import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireFeature } from "@/lib/middleware/requirePlan";
import {
  TOOLS,
  executeTool,
  type AgentEntityMemory,
  type AgentMutationMemory,
} from "@/app/api/agent/tools";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ToolExecution = {
  toolUse: Anthropic.ToolUseBlock;
  result: unknown;
};

type AgentMemory = {
  activeEntity?: AgentEntityMemory | null;
  activeProperty?: AgentEntityMemory | null;
  lastMutation?: AgentMutationMemory | null;
};

const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 400;
const MAX_HISTORY = 6;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SYSTEM_PROMPT = `
Eres el asistente de Vensato. Ayudas a gestionar propiedades, inquilinos,
contratos y documentos del usuario. Solo respondes sobre estos temas.
Si te piden algo fuera de este contexto responde:
"Solo puedo ayudarte con la gestion de tus propiedades en Vensato."
Antes de modificar datos, confirma brevemente y luego haz el cambio en el mismo turno.
Si necesitas identificar un registro, usa herramientas. Nunca pidas IDs al usuario.
Si preguntan por inquilinos, no respondas con propiedades. Si preguntan por ingresos, usa herramientas de ingresos.
Si preguntan por la propiedad de un inquilino, sigue la relacion del inquilino hacia su propiedad.
Respuestas cortas. Nunca inventes datos. Si no encuentras algo, dilo.
`.trim();

function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    (candidate.role === "user" || candidate.role === "assistant") &&
    typeof candidate.content === "string"
  );
}

function getTextContent(blocks: Anthropic.Messages.ContentBlock[]): string {
  return blocks
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

function getToolUses(
  blocks: Anthropic.Messages.ContentBlock[]
): Anthropic.ToolUseBlock[] {
  return blocks.filter(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );
}

function asObjectArray(value: unknown): Array<Record<string, unknown>> | null {
  if (!Array.isArray(value)) {
    return null;
  }

  return value.filter(
    (item): item is Record<string, unknown> =>
      typeof item === "object" && item !== null
  );
}

function isAgentMemory(value: unknown): value is AgentMemory {
  return typeof value === "object" && value !== null;
}

function isUuid(value: string | null | undefined): boolean {
  return typeof value === "string" && UUID_REGEX.test(value);
}

function shouldUseActiveEntity(text: string): boolean {
  const normalized = text.toLowerCase();
  return (
    normalized.includes("camb") ||
    normalized.includes("actualiz") ||
    normalized.includes("modific") ||
    normalized.includes("edit") ||
    normalized.includes("su ") ||
    normalized.includes("sus ") ||
    normalized.includes("apellido") ||
    normalized.includes("correo") ||
    normalized.includes("email") ||
    normalized.includes("celular") ||
    normalized.includes("telefono") ||
    normalized.includes("cedula") ||
    normalized.includes("direccion") ||
    normalized.includes("ciudad")
  );
}

function shouldRevertLastChange(text: string): boolean {
  const normalized = text.toLowerCase();
  return (
    normalized.includes("revierte") ||
    normalized.includes("revertir") ||
    normalized.includes("deshaz") ||
    normalized.includes("deshacer") ||
    normalized.includes("deja como estaba")
  );
}

function buildMemoryNote(memory: AgentMemory, latestUserText: string): string | null {
  if (shouldRevertLastChange(latestUserText) && memory.lastMutation) {
    const mutation = memory.lastMutation;
    return `Contexto de sesion: ultimo cambio en ${mutation.tabla} id ${mutation.id}. Campo ${mutation.campo}. Valor anterior "${mutation.valorAnterior}". Valor nuevo "${mutation.valorNuevo}".`;
  }

  if (shouldUseActiveEntity(latestUserText) && memory.activeEntity) {
    const entity = memory.activeEntity;
    const relatedProperty =
      memory.activeProperty &&
      memory.activeProperty.tabla === "properties" &&
      memory.activeProperty.id
        ? ` Propiedad relacionada id ${memory.activeProperty.id} nombre "${memory.activeProperty.nombre}".`
        : "";
    return `Contexto de sesion: entidad activa ${entity.tabla} id ${entity.id} nombre "${entity.nombre}".${relatedProperty} Si piden un dato de esa entidad, usa obtener_detalle_entidad. Si piden la propiedad de un inquilino, usa obtener_propiedad_inquilino. Si piden cambiar algo, usa actualizar_campo con esa entidad.`;
  }

  return null;
}

function formatCurrency(value: unknown): string {
  const amount = typeof value === "number" ? value : Number(value ?? 0);
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function formatDirectToolResponse(
  toolName: string,
  toolResult: unknown
): string | null {
  if (
    typeof toolResult === "object" &&
    toolResult !== null &&
    "error" in toolResult &&
    typeof (toolResult as Record<string, unknown>).error === "string"
  ) {
    return (toolResult as Record<string, unknown>).error as string;
  }

  if (toolName === "resumen_portafolio") {
    const result =
      typeof toolResult === "object" && toolResult !== null
        ? (toolResult as Record<string, unknown>)
        : null;

    if (!result) {
      return null;
    }

    return `Tienes ${result.propiedades ?? 0} propiedades, ${result.inquilinos ?? 0} inquilinos, ${result.cobros_pendientes ?? 0} cobros pendientes y ${formatCurrency(result.monto_pendiente_cop)} pendientes.`;
  }

  if (toolName === "listar_propiedades") {
    const rows = asObjectArray(toolResult);
    if (!rows) {
      return null;
    }

    if (rows.length === 0) {
      return "No encontre propiedades activas.";
    }

    const lines = rows
      .map((row) => {
        const nombre = typeof row.nombre === "string" ? row.nombre : "Sin nombre";
        const ciudad = typeof row.ciudad === "string" ? row.ciudad : "Sin ciudad";
        return `${nombre} (${ciudad}) - ${formatCurrency(row.canon_mensual)}`;
      });

    return `Tienes ${rows.length} ${rows.length === 1 ? "propiedad" : "propiedades"}:\n- ${lines.join("\n- ")}`;
  }

  if (toolName === "listar_inquilinos") {
    const rows = asObjectArray(toolResult);
    if (!rows) {
      return null;
    }

    if (rows.length === 0) {
      return "No encontre inquilinos registrados.";
    }

    const lines = rows.map((row) => {
      const nombre = typeof row.nombre === "string" ? row.nombre : "Sin nombre";
      const email = typeof row.email === "string" ? row.email : null;
      return email ? `${nombre} (${email})` : nombre;
    });

    return `Tienes ${rows.length} ${rows.length === 1 ? "inquilino" : "inquilinos"}:\n- ${lines.join("\n- ")}`;
  }

  if (toolName === "obtener_detalle_entidad") {
    const result =
      typeof toolResult === "object" && toolResult !== null
        ? (toolResult as Record<string, unknown>)
        : null;

    if (!result) {
      return null;
    }

    if (typeof result.error === "string") {
      return result.error;
    }

    if (result.tabla === "tenants") {
      const parts: string[] = [];
      if (typeof result.nombre === "string" && result.nombre) {
        parts.push(`Nombre: ${result.nombre}`);
      }
      if (typeof result.email === "string" && result.email) {
        parts.push(`Correo: ${result.email}`);
      }
      if (typeof result.telefono === "string" && result.telefono) {
        parts.push(`Celular: ${result.telefono}`);
      }
      if (typeof result.cedula === "string" && result.cedula) {
        parts.push(`Cedula: ${result.cedula}`);
      }

      return parts.length > 0
        ? parts.join("\n")
        : "No encontre mas datos de ese inquilino.";
    }

    if (result.tabla === "properties") {
      const parts: string[] = [];
      if (typeof result.nombre === "string" && result.nombre) {
        parts.push(`Propiedad: ${result.nombre}`);
      }
      if (typeof result.direccion === "string" && result.direccion) {
        parts.push(`Direccion: ${result.direccion}`);
      }
      if (typeof result.ciudad === "string" && result.ciudad) {
        parts.push(`Ciudad: ${result.ciudad}`);
      }
      if (result.canon_mensual !== undefined && result.canon_mensual !== null) {
        parts.push(`Canon mensual: ${formatCurrency(result.canon_mensual)}`);
      }

      return parts.length > 0
        ? parts.join("\n")
        : "No encontre mas datos de esa propiedad.";
    }
  }

  if (toolName === "obtener_propiedad_inquilino") {
    const result =
      typeof toolResult === "object" && toolResult !== null
        ? (toolResult as Record<string, unknown>)
        : null;

    if (!result) {
      return null;
    }

    if (typeof result.error === "string") {
      return result.error;
    }

    const tenantName =
      typeof result.tenant_nombre === "string" ? result.tenant_nombre : "Ese inquilino";
    const propiedad =
      typeof result.propiedad === "object" && result.propiedad !== null
        ? (result.propiedad as Record<string, unknown>)
        : null;

    if (!propiedad) {
      return null;
    }

    const nombre =
      typeof propiedad.nombre === "string" ? propiedad.nombre : "Sin nombre";
    const ciudad =
      typeof propiedad.ciudad === "string" ? propiedad.ciudad : "sin ciudad";

    return `${tenantName} esta asociado a ${nombre} en ${ciudad}.`;
  }

  if (toolName === "listar_inquilinos_propiedad") {
    const result =
      typeof toolResult === "object" && toolResult !== null
        ? (toolResult as Record<string, unknown>)
        : null;

    if (!result) {
      return null;
    }

    if (typeof result.error === "string") {
      return result.error;
    }

    const inquilinos = asObjectArray(result.inquilinos) ?? [];
    const propiedad =
      typeof result.propiedad === "string" ? result.propiedad : "esta propiedad";

    if (inquilinos.length === 0) {
      return `${propiedad} no tiene inquilinos registrados.`;
    }

    const nombres = inquilinos.map((row) =>
      typeof row.nombre === "string" ? row.nombre : "Sin nombre"
    );

    return `${propiedad} tiene ${inquilinos.length} ${inquilinos.length === 1 ? "inquilino" : "inquilinos"}:\n- ${nombres.join("\n- ")}`;
  }

  if (toolName === "obtener_contrato_activo") {
    const result =
      typeof toolResult === "object" && toolResult !== null
        ? (toolResult as Record<string, unknown>)
        : null;

    if (!result) {
      return null;
    }

    if (typeof result.error === "string") {
      return result.error;
    }

    return `Contrato activo:\n- Canon mensual: ${formatCurrency(result.canon_mensual)}\n- Inicio: ${typeof result.fecha_inicio === "string" ? result.fecha_inicio : "sin fecha"}\n- Fin: ${typeof result.fecha_fin === "string" ? result.fecha_fin : "sin fecha"}`;
  }

  if (toolName === "resumen_propiedad") {
    const result =
      typeof toolResult === "object" && toolResult !== null
        ? (toolResult as Record<string, unknown>)
        : null;

    if (!result) {
      return null;
    }

    if (typeof result.error === "string") {
      return result.error;
    }

    const nombre = typeof result.nombre === "string" ? result.nombre : "Propiedad";
    const ciudad = typeof result.ciudad === "string" ? result.ciudad : "sin ciudad";

    return `${nombre} (${ciudad})\n- Canon mensual: ${formatCurrency(result.canon_mensual)}\n- Inquilinos: ${typeof result.cantidad_inquilinos === "number" ? result.cantidad_inquilinos : 0}\n- Cobros pendientes: ${typeof result.cobros_pendientes === "number" ? result.cobros_pendientes : 0}\n- Monto pendiente: ${formatCurrency(result.monto_pendiente_cop)}\n- Documentos: ${typeof result.documentos === "number" ? result.documentos : 0}`;
  }

  if (toolName === "consultar_pagos") {
    const rows = asObjectArray(toolResult);
    if (!rows) {
      return null;
    }

    if (rows.length === 0) {
      return "No encontre pagos para esos filtros.";
    }

    const lines = rows
      .map((row) => {
        const id = typeof row.id === "string" ? row.id.slice(0, 8) : "sin-id";
        const estado = typeof row.estado === "string" ? row.estado : "sin estado";
        const fecha =
          typeof row.fecha_vencimiento === "string"
            ? row.fecha_vencimiento
            : "sin fecha";
        return `${id}: ${formatCurrency(row.monto)} - ${estado} - vence ${fecha}`;
      });

    return `Encontre ${rows.length} ${rows.length === 1 ? "pago" : "pagos"}:\n- ${lines.join("\n- ")}`;
  }

  if (toolName === "listar_documentos") {
    const rows = asObjectArray(toolResult);
    if (!rows) {
      return null;
    }

    if (rows.length === 0) {
      return "No encontre documentos con esos filtros.";
    }

    const lines = rows
      .map((row) => {
        const id = typeof row.id === "string" ? row.id : "sin-id";
        const nombre =
          typeof row.nombre_original === "string"
            ? row.nombre_original
            : "Sin nombre";
        const tipo = typeof row.tipo === "string" ? row.tipo : "sin tipo";
        return `${id}: ${nombre} (${tipo})`;
      });

    return `Encontre ${rows.length} ${rows.length === 1 ? "documento" : "documentos"}:\n- ${lines.join("\n- ")}`;
  }

  if (toolName === "resumen_ingresos") {
    const result =
      typeof toolResult === "object" && toolResult !== null
        ? (toolResult as Record<string, unknown>)
        : null;

    if (!result) {
      return null;
    }

    return `Resumen de ingresos:\n- Ingreso mensual estimado: ${formatCurrency(result.ingreso_mensual_estimado_cop)}\n- Pagos registrados: ${formatCurrency(result.ingresos_pagados_registrados_cop)}\n- Pagos pendientes: ${formatCurrency(result.ingresos_pendientes_cop)}`;
  }

  if (toolName === "leer_documento") {
    const result =
      typeof toolResult === "object" && toolResult !== null
        ? (toolResult as Record<string, unknown>)
        : null;

    if (!result) {
      return null;
    }

    if (result.disponible === false) {
      return typeof result.mensaje === "string"
        ? result.mensaje
        : "Documento sin texto extraible.";
    }

    const nombre =
      typeof result.nombre === "string" ? result.nombre : "Documento";
    const contenido =
      typeof result.contenido === "string" ? result.contenido : "";

    return `${nombre}\n\n${contenido}`;
  }

  return null;
}

function formatMutationToolResponse(toolResults: ToolExecution[]): string | null {
  const updateResult = [...toolResults]
    .reverse()
    .find(({ toolUse }) => toolUse.name === "actualizar_campo");

  if (!updateResult) {
    return null;
  }

  const result =
    typeof updateResult.result === "object" && updateResult.result !== null
      ? (updateResult.result as Record<string, unknown>)
      : null;

  if (!result) {
    return null;
  }

  if (typeof result.error === "string") {
    return result.error;
  }

  if (result.ok === true) {
    const campo = typeof result.campo === "string" ? result.campo : "campo";
    const valor = typeof result.valor === "string" ? result.valor : "";
    return `Cambio aplicado. ${campo} actualizado a "${valor}".`;
  }

  return null;
}

function deriveMemory(
  previousMemory: AgentMemory,
  toolResults: ToolExecution[]
): AgentMemory {
  let nextMemory: AgentMemory = { ...previousMemory };

  for (const { toolUse, result } of toolResults) {
    if (toolUse.name === "listar_inquilinos") {
      const rows = asObjectArray(result);

      if (rows && rows.length === 1) {
        const row = rows[0];
        const id = typeof row.id === "string" ? row.id : null;
        const nombre = typeof row.nombre === "string" ? row.nombre : null;

        if (id && nombre) {
          nextMemory = {
            ...nextMemory,
            activeEntity: {
              tabla: "tenants",
              id,
              nombre,
            },
          };
        }
      }
    }

    if (toolUse.name === "listar_propiedades") {
      const rows = asObjectArray(result);

      if (rows && rows.length === 1) {
        const row = rows[0];
        const id = typeof row.id === "string" ? row.id : null;
        const nombre = typeof row.nombre === "string" ? row.nombre : null;

        if (id && nombre) {
          nextMemory = {
            ...nextMemory,
            activeEntity: {
              tabla: "properties",
              id,
              nombre,
            },
            activeProperty: {
              tabla: "properties",
              id,
              nombre,
            },
          };
        }
      }
    }

    if (toolUse.name === "buscar_entidad") {
      const rows = asObjectArray(result);
      const toolInput =
        typeof toolUse.input === "object" && toolUse.input !== null
          ? (toolUse.input as Record<string, unknown>)
          : {};
      const tipo =
        typeof toolInput.tipo === "string" ? toolInput.tipo : null;

      if (rows && rows.length === 1 && (tipo === "tenant" || tipo === "property")) {
        const row = rows[0];
        const id = typeof row.id === "string" ? row.id : null;
        const nombre = typeof row.nombre === "string" ? row.nombre : null;

        if (id && nombre) {
          nextMemory = {
            ...nextMemory,
            activeEntity: {
              tabla: tipo === "tenant" ? "tenants" : "properties",
              id,
              nombre,
            },
            activeProperty:
              tipo === "property"
                ? {
                    tabla: "properties",
                    id,
                    nombre,
                  }
                : nextMemory.activeProperty,
          };
        }
      }
    }

    if (
      toolUse.name === "obtener_detalle_entidad" &&
      typeof result === "object" &&
      result !== null
    ) {
      const data = result as Record<string, unknown>;
      const tabla = data.tabla === "tenants" || data.tabla === "properties" ? data.tabla : null;
      const id = typeof data.id === "string" ? data.id : null;
      const nombre = typeof data.nombre === "string" ? data.nombre : null;

      if (tabla && id && nombre) {
        nextMemory = {
          ...nextMemory,
          activeEntity: {
            tabla,
            id,
            nombre,
          },
          activeProperty:
            tabla === "properties"
              ? {
                  tabla: "properties",
                  id,
                  nombre,
                }
              : nextMemory.activeProperty,
        };
      }
    }

    if (
      toolUse.name === "obtener_propiedad_inquilino" &&
      typeof result === "object" &&
      result !== null
    ) {
      const data = result as Record<string, unknown>;
      const tenantId = typeof data.tenant_id === "string" ? data.tenant_id : null;
      const tenantNombre =
        typeof data.tenant_nombre === "string" ? data.tenant_nombre : null;
      const propiedad =
        typeof data.propiedad === "object" && data.propiedad !== null
          ? (data.propiedad as Record<string, unknown>)
          : null;
      const propertyId = typeof data.property_id === "string" ? data.property_id : null;
      const propertyNombre =
        propiedad && typeof propiedad.nombre === "string" ? propiedad.nombre : null;

      if (tenantId && tenantNombre) {
        nextMemory = {
          ...nextMemory,
          activeEntity: {
            tabla: "tenants",
            id: tenantId,
            nombre: tenantNombre,
          },
          activeProperty:
            propertyId && propertyNombre
              ? {
                  tabla: "properties",
                  id: propertyId,
                  nombre: propertyNombre,
                }
              : nextMemory.activeProperty,
        };
      }
    }

    if (
      toolUse.name === "listar_inquilinos_propiedad" &&
      typeof result === "object" &&
      result !== null
    ) {
      const data = result as Record<string, unknown>;
      const propertyId =
        typeof data.property_id === "string" ? data.property_id : null;
      const propertyName =
        typeof data.propiedad === "string" ? data.propiedad : null;

      if (propertyId && propertyName) {
        nextMemory = {
          ...nextMemory,
          activeProperty: {
            tabla: "properties",
            id: propertyId,
            nombre: propertyName,
          },
        };
      }
    }

    if (
      toolUse.name === "actualizar_campo" &&
      typeof result === "object" &&
      result !== null &&
      (result as Record<string, unknown>).ok === true
    ) {
      const data = result as Record<string, unknown>;
      nextMemory = {
        activeEntity: nextMemory.activeEntity,
        lastMutation: {
          tabla: data.tabla as AgentMutationMemory["tabla"],
          id: String(data.id ?? ""),
          campo: String(data.campo ?? ""),
          valorAnterior: String(data.valor_anterior ?? ""),
          valorNuevo: String(data.valor ?? ""),
          nombre:
            typeof data.nombre === "string" && data.nombre
              ? data.nombre
              : nextMemory.activeEntity?.nombre,
        },
        activeProperty: nextMemory.activeProperty,
      };
    }
  }

  return nextMemory;
}

function patchToolInputWithMemory(
  toolUse: Anthropic.ToolUseBlock,
  memory: AgentMemory
): Record<string, unknown> {
  const input = { ...(toolUse.input as Record<string, unknown>) };

  if (
    (toolUse.name === "actualizar_campo" ||
      toolUse.name === "obtener_detalle_entidad") &&
    memory.activeEntity &&
    (!isUuid(typeof input.id === "string" ? input.id : null) ||
      (typeof input.tabla === "string" && input.tabla !== memory.activeEntity.tabla))
  ) {
    input.id = memory.activeEntity.id;
    input.tabla = memory.activeEntity.tabla;
  }

  if (
    toolUse.name === "obtener_propiedad_inquilino" &&
    memory.activeEntity?.tabla === "tenants" &&
    !isUuid(typeof input.tenant_id === "string" ? input.tenant_id : null)
  ) {
    input.tenant_id = memory.activeEntity.id;
  }

  if (
    (toolUse.name === "listar_inquilinos_propiedad" ||
      toolUse.name === "resumen_propiedad") &&
    memory.activeProperty &&
    !isUuid(typeof input.property_id === "string" ? input.property_id : null)
  ) {
    input.property_id = memory.activeProperty.id;
  }

  if (
    toolUse.name === "obtener_contrato_activo" &&
    (!isUuid(typeof input.id === "string" ? input.id : null) ||
      typeof input.tabla !== "string")
  ) {
    if (memory.activeEntity) {
      input.id = memory.activeEntity.id;
      input.tabla = memory.activeEntity.tabla;
    } else if (memory.activeProperty) {
      input.id = memory.activeProperty.id;
      input.tabla = memory.activeProperty.tabla;
    }
  }

  return input;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const guard = await requireFeature("hasAgent")(req);
    if (guard) {
      return guard;
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as
      | { messages?: unknown; memory?: unknown }
      | null;

    const rawMessages = Array.isArray(body?.messages) ? body.messages : [];
    const messages = rawMessages.filter(isChatMessage).slice(-MAX_HISTORY);
    const memory = isAgentMemory(body?.memory) ? (body.memory as AgentMemory) : {};
    const latestUserText =
      [...messages].reverse().find((message) => message.role === "user")?.content ?? "";

    if (shouldRevertLastChange(latestUserText) && memory.lastMutation) {
      const reverted = await executeTool(
        "actualizar_campo",
        {
          tabla: memory.lastMutation.tabla,
          id: memory.lastMutation.id,
          campo: memory.lastMutation.campo,
          valor: memory.lastMutation.valorAnterior,
        },
        user.id
      );

      const revertedResult =
        typeof reverted === "object" && reverted !== null
          ? (reverted as Record<string, unknown>)
          : null;

      const nextMemory: AgentMemory =
        revertedResult?.ok === true
          ? {
              activeEntity: memory.activeEntity ?? null,
              activeProperty: memory.activeProperty ?? null,
              lastMutation: {
                tabla: memory.lastMutation.tabla,
                id: memory.lastMutation.id,
                campo: memory.lastMutation.campo,
                valorAnterior: memory.lastMutation.valorNuevo,
                valorNuevo: memory.lastMutation.valorAnterior,
                nombre: memory.lastMutation.nombre,
              },
            }
          : memory;

      return NextResponse.json({
        message:
          revertedResult?.ok === true
            ? `Cambio revertido. ${memory.lastMutation.campo} restaurado a "${memory.lastMutation.valorAnterior}".`
            : typeof revertedResult?.error === "string"
              ? revertedResult.error
              : "No pude revertir el ultimo cambio.",
        input_tokens: 0,
        output_tokens: 0,
        memory: nextMemory,
      });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "Falta configurar ANTHROPIC_API_KEY." },
        { status: 500 }
      );
    }

    const memoryNote = buildMemoryNote(memory, latestUserText);
    const initialMessages: Anthropic.MessageParam[] = memoryNote
      ? [
          ...messages,
          {
            role: "user",
            content: `[contexto interno] ${memoryNote}`,
          },
        ]
      : [...messages];

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let currentMessages: Anthropic.MessageParam[] = [...initialMessages];
    let lastResponse: Anthropic.Message | null = null;
    let nextMemory: AgentMemory = memory;

    for (let iteration = 0; iteration < 4; iteration += 1) {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPT,
        tools: TOOLS,
        messages: currentMessages,
      });

      totalInputTokens += response.usage.input_tokens;
      totalOutputTokens += response.usage.output_tokens;
      lastResponse = response;

      if (response.stop_reason !== "tool_use") {
        return NextResponse.json({
          message: getTextContent(response.content),
          input_tokens: totalInputTokens,
          output_tokens: totalOutputTokens,
          memory: nextMemory,
        });
      }

      const toolUses = getToolUses(response.content);
      if (toolUses.length === 0) {
        return NextResponse.json({
          message: "No pude completar la accion.",
          input_tokens: totalInputTokens,
          output_tokens: totalOutputTokens,
          memory: nextMemory,
        });
      }

      const toolResults = await Promise.all(
        toolUses.map(async (toolUse) => ({
          toolUse,
          result: await executeTool(
            toolUse.name,
            patchToolInputWithMemory(toolUse, nextMemory),
            user.id
          ),
        }))
      );

      nextMemory = deriveMemory(nextMemory, toolResults);

      const mutationResponse = formatMutationToolResponse(toolResults);
      if (mutationResponse) {
        return NextResponse.json({
          message: mutationResponse,
          input_tokens: totalInputTokens,
          output_tokens: totalOutputTokens,
          memory: nextMemory,
        });
      }

      if (toolResults.length === 1) {
        const directResponse = formatDirectToolResponse(
          toolResults[0].toolUse.name,
          toolResults[0].result
        );

        if (directResponse) {
          return NextResponse.json({
            message: directResponse,
            input_tokens: totalInputTokens,
            output_tokens: totalOutputTokens,
            memory: nextMemory,
          });
        }
      }

      currentMessages = [
        ...currentMessages,
        {
          role: "assistant",
          content: response.content,
        },
        {
          role: "user",
          content: toolResults.map(({ toolUse, result }) => ({
            type: "tool_result" as const,
            tool_use_id: toolUse.id,
            content: JSON.stringify(result),
          })),
        },
      ];
    }

    return NextResponse.json({
      message: lastResponse ? getTextContent(lastResponse.content) : "No pude completar la accion.",
      input_tokens: totalInputTokens,
      output_tokens: totalOutputTokens,
      memory: nextMemory,
    });
  } catch (error) {
    console.error("[agent] Request failed:", error);
    return NextResponse.json(
      { error: "No se pudo procesar la solicitud del agente." },
      { status: 500 }
    );
  }
}
