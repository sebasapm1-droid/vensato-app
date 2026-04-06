import Anthropic from "@anthropic-ai/sdk";
import { createServiceClient } from "@/lib/supabase/server";

type ToolInput = Record<string, unknown>;

export type AgentEntityMemory = {
  tabla: "tenants" | "properties" | "contracts";
  id: string;
  nombre: string;
};

export type AgentMutationMemory = {
  tabla: "tenants" | "properties" | "contracts";
  id: string;
  campo: string;
  valorAnterior: string;
  valorNuevo: string;
  nombre?: string;
};

type PropertyListRow = {
  id: string;
  alias: string;
  city: string | null;
  current_rent: number | null;
};

type TenantListRow = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  property_id: string | null;
};

type PropertySearchRow = {
  id: string;
  alias: string;
  address: string | null;
  city: string | null;
};

type ChargeRow = {
  id: string;
  amount: number;
  due_date: string;
  status: string | null;
  property_id: string | null;
};

type DocumentListRow = {
  id: string;
  tipo: string;
  nombre_original: string;
  created_at: string | null;
};

type DocumentQueryRow = DocumentListRow & {
  r2_key: string;
};

type DocumentRow = {
  tipo: string;
  nombre_original: string;
  texto_extraido: string | null;
};

type TenantDetailRow = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  cedula: string | null;
  property_id: string | null;
};

type PropertyDetailRow = {
  id: string;
  alias: string;
  address: string | null;
  city: string | null;
  current_rent: number | null;
};

type TenantPropertyRow = {
  id: string;
  full_name: string;
  property_id: string | null;
  properties:
    | {
        id: string;
        alias: string;
        address: string | null;
        city: string | null;
        current_rent: number | null;
      }
    | null;
};

type PropertyTenantRow = {
  id: string;
  alias: string;
  city: string | null;
  tenants: Array<{
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
  }> | null;
};

type ContractSummaryRow = {
  id: string;
  property_id: string | null;
  tenant_id: string | null;
  start_date: string;
  end_date: string | null;
  current_rent: number;
  status: string;
};

const MAX_ROWS = 10;
const MAX_SEARCH_ROWS = 5;

const UPDATE_FIELD_MAP = {
  tenants: {
    nombre: "full_name",
    full_name: "full_name",
    nombre_completo: "full_name",
    email: "email",
    telefono: "phone",
    phone: "phone",
    celular: "phone",
    cedula: "cedula",
  },
  properties: {
    nombre: "alias",
    alias: "alias",
    direccion: "address",
    address: "address",
    ciudad: "city",
    city: "city",
    canon_mensual: "current_rent",
    current_rent: "current_rent",
  },
  contracts: {
    canon_mensual: "current_rent",
    current_rent: "current_rent",
    fecha_fin: "end_date",
    end_date: "end_date",
  },
} as const;

const CURRENT_ROW_SELECT_MAP = {
  tenants: {
    full_name: "full_name",
    email: "email, full_name",
    phone: "phone, full_name",
    cedula: "cedula, full_name",
  },
  properties: {
    alias: "alias",
    address: "address, alias",
    city: "city, alias",
    current_rent: "current_rent, alias",
  },
  contracts: {
    current_rent: "current_rent",
    end_date: "end_date",
  },
} as const;

const CHARGE_STATUS_MAP = {
  pendiente: "pending",
  pagado: "paid",
  vencido: "overdue",
} as const;

const CHARGE_STATUS_REVERSE_MAP: Record<string, keyof typeof CHARGE_STATUS_MAP> = {
  pending: "pendiente",
  paid: "pagado",
  overdue: "vencido",
};

export const TOOLS: Anthropic.Tool[] = [
  {
    name: "listar_propiedades",
    description: "Lista propiedades del usuario.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "listar_inquilinos",
    description: "Lista inquilinos del usuario.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "buscar_entidad",
    description: "Busca inquilinos o propiedades.",
    input_schema: {
      type: "object",
      properties: {
        tipo: { type: "string", enum: ["tenant", "property"] },
        nombre: { type: "string" },
      },
      required: ["tipo", "nombre"],
    },
  },
  {
    name: "obtener_detalle_entidad",
    description: "Obtiene detalle de una entidad.",
    input_schema: {
      type: "object",
      properties: {
        tabla: { type: "string", enum: ["tenants", "properties"] },
        id: { type: "string" },
      },
      required: ["tabla", "id"],
    },
  },
  {
    name: "obtener_propiedad_inquilino",
    description: "Obtiene propiedad de un inquilino.",
    input_schema: {
      type: "object",
      properties: {
        tenant_id: { type: "string" },
      },
      required: ["tenant_id"],
    },
  },
  {
    name: "listar_inquilinos_propiedad",
    description: "Lista inquilinos de una propiedad.",
    input_schema: {
      type: "object",
      properties: {
        property_id: { type: "string" },
      },
      required: ["property_id"],
    },
  },
  {
    name: "obtener_contrato_activo",
    description: "Obtiene contrato activo relacionado.",
    input_schema: {
      type: "object",
      properties: {
        tabla: { type: "string", enum: ["tenants", "properties"] },
        id: { type: "string" },
      },
      required: ["tabla", "id"],
    },
  },
  {
    name: "resumen_propiedad",
    description: "Resume una propiedad.",
    input_schema: {
      type: "object",
      properties: {
        property_id: { type: "string" },
      },
      required: ["property_id"],
    },
  },
  {
    name: "actualizar_campo",
    description: "Actualiza un campo permitido.",
    input_schema: {
      type: "object",
      properties: {
        tabla: { type: "string", enum: ["tenants", "properties", "contracts"] },
        id: { type: "string" },
        campo: { type: "string" },
        valor: { type: "string" },
      },
      required: ["tabla", "id", "campo", "valor"],
    },
  },
  {
    name: "consultar_pagos",
    description: "Consulta cobros del usuario.",
    input_schema: {
      type: "object",
      properties: {
        estado: { type: "string", enum: ["pendiente", "pagado", "vencido"] },
        property_id: { type: "string" },
      },
      required: [],
    },
  },
  {
    name: "resumen_portafolio",
    description: "Resume portafolio actual.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "resumen_ingresos",
    description: "Resume ingresos del usuario.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "listar_documentos",
    description: "Lista documentos recientes.",
    input_schema: {
      type: "object",
      properties: {
        property_id: { type: "string" },
        tenant_id: { type: "string" },
        tipo: { type: "string" },
      },
      required: [],
    },
  },
  {
    name: "leer_documento",
    description: "Lee texto extraido guardado.",
    input_schema: {
      type: "object",
      properties: {
        document_id: { type: "string" },
      },
      required: ["document_id"],
    },
  },
];

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function normalizeFieldName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function formatChargeStatus(status: string | null): string {
  if (!status) {
    return "pendiente";
  }

  return CHARGE_STATUS_REVERSE_MAP[status] ?? status;
}

async function listarPropiedades(userId: string): Promise<unknown> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("properties")
    .select("id, alias, city, current_rent")
    .eq("user_id", userId)
    .limit(MAX_ROWS);

  if (error) return { error: error.message };

  return ((data ?? []) as PropertyListRow[]).map((row) => ({
    id: row.id,
    nombre: row.alias,
    ciudad: row.city,
    canon_mensual: row.current_rent,
  }));
}

async function listarInquilinos(userId: string): Promise<unknown> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("id, full_name, email, phone, property_id")
    .eq("user_id", userId)
    .limit(MAX_ROWS);

  if (error) return { error: error.message };

  return ((data ?? []) as TenantListRow[]).map((row) => ({
    id: row.id,
    nombre: row.full_name,
    email: row.email,
    telefono: row.phone,
    property_id: row.property_id,
  }));
}

async function buscarEntidad(input: ToolInput, userId: string): Promise<unknown> {
  const tipo = asString(input.tipo);
  const nombre = asString(input.nombre);

  if (!tipo || !nombre) {
    return { error: "Parametros invalidos" };
  }

  const supabase = createServiceClient();

  if (tipo === "tenant") {
    const { data, error } = await supabase
      .from("tenants")
      .select("id, full_name, email, phone, property_id")
      .eq("user_id", userId)
      .ilike("full_name", `%${nombre}%`)
      .limit(MAX_SEARCH_ROWS);

    if (error) return { error: error.message };

    return ((data ?? []) as TenantListRow[]).map((row) => ({
      id: row.id,
      nombre: row.full_name,
      email: row.email,
      telefono: row.phone,
      property_id: row.property_id,
    }));
  }

  if (tipo === "property") {
    const { data, error } = await supabase
      .from("properties")
      .select("id, alias, address, city")
      .eq("user_id", userId)
      .ilike("alias", `%${nombre}%`)
      .limit(MAX_SEARCH_ROWS);

    if (error) return { error: error.message };

    return ((data ?? []) as PropertySearchRow[]).map((row) => ({
      id: row.id,
      nombre: row.alias,
      direccion: row.address,
      ciudad: row.city,
    }));
  }

  return { error: "Tipo no permitido" };
}

async function obtenerDetalleEntidad(input: ToolInput, userId: string): Promise<unknown> {
  const tabla = asString(input.tabla);
  const id = asString(input.id);

  if (!tabla || !id) {
    return { error: "Parametros invalidos" };
  }

  const supabase = createServiceClient();

  if (tabla === "tenants") {
    const { data, error } = await supabase
      .from("tenants")
      .select("id, full_name, email, phone, cedula, property_id")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) return { error: error.message };
    if (!data) return { error: "No encontrado" };

    const row = data as TenantDetailRow;
    return {
      tabla: "tenants",
      id: row.id,
      nombre: row.full_name,
      email: row.email,
      telefono: row.phone,
      cedula: row.cedula,
      property_id: row.property_id,
    };
  }

  if (tabla === "properties") {
    const { data, error } = await supabase
      .from("properties")
      .select("id, alias, address, city, current_rent")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) return { error: error.message };
    if (!data) return { error: "No encontrado" };

    const row = data as PropertyDetailRow;
    return {
      tabla: "properties",
      id: row.id,
      nombre: row.alias,
      direccion: row.address,
      ciudad: row.city,
      canon_mensual: row.current_rent,
    };
  }

  return { error: "Tabla no permitida" };
}

async function obtenerPropiedadInquilino(
  input: ToolInput,
  userId: string
): Promise<unknown> {
  const tenantId = asString(input.tenant_id);

  if (!tenantId) {
    return { error: "Parametros invalidos" };
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("tenants")
    .select(
      "id, full_name, property_id, properties(id, alias, address, city, current_rent)"
    )
    .eq("id", tenantId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) return { error: "No encontrado" };

  const row = data as TenantPropertyRow;
  if (!row.property_id || !row.properties) {
    return { error: "Inquilino sin propiedad asociada" };
  }

  return {
    tenant_id: row.id,
    tenant_nombre: row.full_name,
    property_id: row.properties.id,
    propiedad: {
      id: row.properties.id,
      nombre: row.properties.alias,
      direccion: row.properties.address,
      ciudad: row.properties.city,
      canon_mensual: row.properties.current_rent,
    },
  };
}

async function listarInquilinosPropiedad(
  input: ToolInput,
  userId: string
): Promise<unknown> {
  const propertyId = asString(input.property_id);

  if (!propertyId) {
    return { error: "Parametros invalidos" };
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("properties")
    .select("id, alias, city, tenants(id, full_name, email, phone)")
    .eq("id", propertyId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) return { error: "No encontrado" };

  const row = data as PropertyTenantRow;

  return {
    property_id: row.id,
    propiedad: row.alias,
    ciudad: row.city,
    inquilinos: (row.tenants ?? []).slice(0, MAX_ROWS).map((tenant) => ({
      id: tenant.id,
      nombre: tenant.full_name,
      email: tenant.email,
      telefono: tenant.phone,
    })),
  };
}

async function obtenerContratoActivo(
  input: ToolInput,
  userId: string
): Promise<unknown> {
  const tabla = asString(input.tabla);
  const id = asString(input.id);

  if (!tabla || !id) {
    return { error: "Parametros invalidos" };
  }

  const supabase = createServiceClient();
  let query = supabase
    .from("contracts")
    .select("id, property_id, tenant_id, start_date, end_date, current_rent, status")
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(1);

  if (tabla === "tenants") {
    query = query.eq("tenant_id", id);
  } else if (tabla === "properties") {
    query = query.eq("property_id", id);
  } else {
    return { error: "Tabla no permitida" };
  }

  const { data, error } = await query;
  if (error) return { error: error.message };

  const row = ((data ?? []) as ContractSummaryRow[])[0];
  if (!row) {
    return { error: "No encontre contrato activo" };
  }

  return {
    id: row.id,
    property_id: row.property_id,
    tenant_id: row.tenant_id,
    fecha_inicio: row.start_date,
    fecha_fin: row.end_date,
    canon_mensual: row.current_rent,
    estado: row.status,
  };
}

async function resumenPropiedad(input: ToolInput, userId: string): Promise<unknown> {
  const propertyId = asString(input.property_id);

  if (!propertyId) {
    return { error: "Parametros invalidos" };
  }

  const supabase = createServiceClient();
  const [propertyResult, tenantsResult, activeContractResult, pendingChargesResult, documentsResult] =
    await Promise.all([
      supabase
        .from("properties")
        .select("id, alias, address, city, current_rent")
        .eq("id", propertyId)
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("tenants")
        .select("id, full_name", { count: "exact" })
        .eq("property_id", propertyId)
        .eq("user_id", userId)
        .limit(MAX_ROWS),
      supabase
        .from("contracts")
        .select("id, tenant_id, start_date, end_date, current_rent, status")
        .eq("property_id", propertyId)
        .eq("user_id", userId)
        .eq("status", "active")
        .limit(1),
      supabase
        .from("charges")
        .select("id, amount")
        .eq("property_id", propertyId)
        .eq("user_id", userId)
        .eq("status", "pending")
        .limit(MAX_ROWS),
      supabase
        .from("documentos")
        .select("id", { count: "exact" })
        .eq("propiedad_id", propertyId)
        .eq("user_id", userId)
        .limit(MAX_ROWS),
    ]);

  if (propertyResult.error) return { error: propertyResult.error.message };
  if (!propertyResult.data) return { error: "No encontrado" };
  if (tenantsResult.error) return { error: tenantsResult.error.message };
  if (activeContractResult.error) return { error: activeContractResult.error.message };
  if (pendingChargesResult.error) return { error: pendingChargesResult.error.message };
  if (documentsResult.error) return { error: documentsResult.error.message };

  const property = propertyResult.data as PropertyDetailRow;
  const tenants = (tenantsResult.data ?? []) as Array<{ id: string; full_name: string }>;
  const activeContract = ((activeContractResult.data ?? []) as ContractSummaryRow[])[0] ?? null;
  const pendingCharges = (pendingChargesResult.data ?? []) as Array<{ id: string; amount: number }>;
  const pendingAmount = pendingCharges.reduce((sum, charge) => sum + Number(charge.amount ?? 0), 0);

  return {
    property_id: property.id,
    nombre: property.alias,
    direccion: property.address,
    ciudad: property.city,
    canon_mensual: property.current_rent,
    inquilinos: tenants.map((tenant) => ({
      id: tenant.id,
      nombre: tenant.full_name,
    })),
    cantidad_inquilinos: tenantsResult.count ?? tenants.length,
    contrato_activo: activeContract
      ? {
          id: activeContract.id,
          tenant_id: activeContract.tenant_id,
          fecha_inicio: activeContract.start_date,
          fecha_fin: activeContract.end_date,
          canon_mensual: activeContract.current_rent,
        }
      : null,
    cobros_pendientes: pendingCharges.length,
    monto_pendiente_cop: pendingAmount,
    documentos: documentsResult.count ?? 0,
  };
}

async function actualizarCampo(input: ToolInput, userId: string): Promise<unknown> {
  const tabla = asString(input.tabla) as keyof typeof UPDATE_FIELD_MAP | null;
  const id = asString(input.id);
  const campo = asString(input.campo);
  const valor = asString(input.valor);

  if (!tabla || !id || !campo || valor === null) {
    return { error: "Parametros invalidos" };
  }

  const normalizedField = normalizeFieldName(campo);
  const fieldMap = UPDATE_FIELD_MAP[tabla];
  const dbField = fieldMap[normalizedField as keyof typeof fieldMap];

  if (!dbField) return { error: "Campo no permitido" };

  const supabase = createServiceClient();
  const currentSelect = CURRENT_ROW_SELECT_MAP[tabla][
    dbField as keyof (typeof CURRENT_ROW_SELECT_MAP)[typeof tabla]
  ];

  const currentRowQuery =
    tabla === "tenants"
      ? supabase
          .from("tenants")
          .select(currentSelect as "full_name" | "email, full_name" | "phone, full_name" | "cedula, full_name")
          .eq("id", id)
          .eq("user_id", userId)
          .maybeSingle()
      : tabla === "properties"
        ? supabase
            .from("properties")
            .select(currentSelect as "alias" | "address, alias" | "city, alias" | "current_rent, alias")
            .eq("id", id)
            .eq("user_id", userId)
            .maybeSingle()
        : supabase
            .from("contracts")
            .select(currentSelect as "current_rent" | "end_date")
            .eq("id", id)
            .eq("user_id", userId)
            .maybeSingle();

  const { data: currentRow, error: currentError } = await currentRowQuery;
  if (currentError) return { error: currentError.message };
  if (!currentRow) return { error: "No autorizado" };

  const payload: Record<string, string> = { [dbField]: valor };
  const { data: updatedRow, error: updateError } = await supabase
    .from(tabla)
    .update(payload)
    .eq("id", id)
    .eq("user_id", userId)
    .select(dbField)
    .maybeSingle();

  if (updateError) return { error: updateError.message };

  const appliedValue =
    updatedRow &&
    typeof updatedRow === "object" &&
    dbField in updatedRow
      ? (updatedRow as Record<string, unknown>)[dbField]
      : null;

  if (appliedValue !== valor) {
    return { error: "No se pudo confirmar el cambio" };
  }

  const valorAnterior =
    currentRow &&
    typeof currentRow === "object" &&
    dbField in currentRow
      ? String((currentRow as Record<string, unknown>)[dbField] ?? "")
      : "";

  const nombreRegistro =
    tabla === "tenants"
      ? String((currentRow as Record<string, unknown> | null)?.full_name ?? "")
      : tabla === "properties"
        ? String((currentRow as Record<string, unknown> | null)?.alias ?? "")
        : "";

  return {
    ok: true,
    tabla,
    id,
    campo: normalizedField,
    valor,
    valor_anterior: valorAnterior,
    nombre: nombreRegistro || undefined,
  };
}

async function consultarPagos(input: ToolInput, userId: string): Promise<unknown> {
  const estado = asOptionalString(input.estado);
  const propertyId = asOptionalString(input.property_id);

  const supabase = createServiceClient();
  let query = supabase
    .from("charges")
    .select("id, amount, due_date, status, property_id")
    .eq("user_id", userId)
    .order("due_date", { ascending: false })
    .limit(MAX_ROWS);

  if (estado) {
    const mappedStatus = CHARGE_STATUS_MAP[estado as keyof typeof CHARGE_STATUS_MAP];
    if (!mappedStatus) return { error: "Estado no permitido" };
    query = query.eq("status", mappedStatus);
  }

  if (propertyId) {
    query = query.eq("property_id", propertyId);
  }

  const { data, error } = await query;
  if (error) return { error: error.message };

  return ((data ?? []) as ChargeRow[]).map((row) => ({
    id: row.id,
    monto: row.amount,
    fecha_vencimiento: row.due_date,
    estado: formatChargeStatus(row.status),
    property_id: row.property_id,
  }));
}

async function resumenPortafolio(userId: string): Promise<unknown> {
  const supabase = createServiceClient();

  const [propertiesResult, tenantsResult, chargesResult] = await Promise.all([
    supabase.from("properties").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("tenants").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("charges").select("amount").eq("user_id", userId).eq("status", "pending"),
  ]);

  if (propertiesResult.error) return { error: propertiesResult.error.message };
  if (tenantsResult.error) return { error: tenantsResult.error.message };
  if (chargesResult.error) return { error: chargesResult.error.message };

  const pendingCharges = (chargesResult.data ?? []) as Array<{ amount: number }>;
  const montoPendiente = pendingCharges.reduce((sum, charge) => sum + charge.amount, 0);

  return {
    propiedades: propertiesResult.count ?? 0,
    inquilinos: tenantsResult.count ?? 0,
    cobros_pendientes: pendingCharges.length,
    monto_pendiente_cop: montoPendiente,
  };
}

async function resumenIngresos(userId: string): Promise<unknown> {
  const supabase = createServiceClient();

  const [propertiesResult, paidChargesResult, pendingChargesResult] = await Promise.all([
    supabase.from("properties").select("current_rent").eq("user_id", userId).limit(MAX_ROWS),
    supabase.from("charges").select("amount").eq("user_id", userId).eq("status", "paid").limit(MAX_ROWS),
    supabase.from("charges").select("amount").eq("user_id", userId).eq("status", "pending").limit(MAX_ROWS),
  ]);

  if (propertiesResult.error) return { error: propertiesResult.error.message };
  if (paidChargesResult.error) return { error: paidChargesResult.error.message };
  if (pendingChargesResult.error) return { error: pendingChargesResult.error.message };

  const estimatedMonthlyIncome = (propertiesResult.data ?? []).reduce(
    (sum, property) => sum + Number(property.current_rent ?? 0),
    0
  );
  const paidIncome = (paidChargesResult.data ?? []).reduce(
    (sum, charge) => sum + Number(charge.amount ?? 0),
    0
  );
  const pendingIncome = (pendingChargesResult.data ?? []).reduce(
    (sum, charge) => sum + Number(charge.amount ?? 0),
    0
  );

  return {
    ingreso_mensual_estimado_cop: estimatedMonthlyIncome,
    ingresos_pagados_registrados_cop: paidIncome,
    ingresos_pendientes_cop: pendingIncome,
    pagos_registrados: paidChargesResult.data?.length ?? 0,
    pagos_pendientes: pendingChargesResult.data?.length ?? 0,
  };
}

async function listarDocumentos(input: ToolInput, userId: string): Promise<unknown> {
  const propertyId = asOptionalString(input.property_id);
  const tenantId = asOptionalString(input.tenant_id);
  const tipo = asOptionalString(input.tipo);

  const supabase = createServiceClient();
  let query = supabase
    .from("documentos")
    .select("id, tipo, nombre_original, created_at, r2_key")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(MAX_ROWS);

  if (propertyId) query = query.eq("propiedad_id", propertyId);
  if (tipo) query = query.eq("tipo", tipo);

  const { data, error } = await query;
  if (error) return { error: error.message };

  let rows = (data ?? []) as DocumentQueryRow[];
  if (tenantId) {
    rows = rows.filter((row) => row.r2_key.includes(`/tenant_${tenantId}/`));
  }

  return rows.map(({ id, tipo: docTipo, nombre_original, created_at }) => ({
    id,
    tipo: docTipo,
    nombre_original,
    created_at,
  }));
}

async function leerDocumento(input: ToolInput, userId: string): Promise<unknown> {
  const documentId = asString(input.document_id);
  if (!documentId) return { error: "Parametro invalido" };

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("documentos")
    .select("tipo, nombre_original, texto_extraido")
    .eq("id", documentId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return { error: error.message };

  const row = data as DocumentRow | null;
  if (!row || row.texto_extraido === null) {
    return { disponible: false, mensaje: "Documento sin texto extraible" };
  }

  return {
    disponible: true,
    tipo: row.tipo,
    nombre: row.nombre_original,
    contenido: row.texto_extraido,
  };
}

export async function executeTool(
  name: string,
  input: Record<string, unknown>,
  userId: string
): Promise<unknown> {
  switch (name) {
    case "listar_propiedades":
      return listarPropiedades(userId);
    case "listar_inquilinos":
      return listarInquilinos(userId);
    case "buscar_entidad":
      return buscarEntidad(input, userId);
    case "obtener_detalle_entidad":
      return obtenerDetalleEntidad(input, userId);
    case "obtener_propiedad_inquilino":
      return obtenerPropiedadInquilino(input, userId);
    case "listar_inquilinos_propiedad":
      return listarInquilinosPropiedad(input, userId);
    case "obtener_contrato_activo":
      return obtenerContratoActivo(input, userId);
    case "resumen_propiedad":
      return resumenPropiedad(input, userId);
    case "actualizar_campo":
      return actualizarCampo(input, userId);
    case "consultar_pagos":
      return consultarPagos(input, userId);
    case "resumen_portafolio":
      return resumenPortafolio(userId);
    case "resumen_ingresos":
      return resumenIngresos(userId);
    case "listar_documentos":
      return listarDocumentos(input, userId);
    case "leer_documento":
      return leerDocumento(input, userId);
    default:
      return { error: "Herramienta no soportada" };
  }
}
