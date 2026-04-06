import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { extractTextFromPDF } from "@/lib/document-extractor";
import { uploadFile } from "@/lib/r2";
import { requireFeature } from "@/lib/middleware/requirePlan";
import { getPlan } from "@/lib/permissions";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const guard = await requireFeature("hasBovedaDocs")(req);
  if (guard) return guard;

  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Verificar límite de almacenamiento
  const { data: profile } = await supabase
    .from("profiles")
    .select("tier, subscription_status, subscription_valid_until")
    .eq("id", user.id)
    .single();

  if (profile) {
    const plan = getPlan(profile);
    const limitBytes = plan.bovedaStorageGB * 1024 * 1024 * 1024;
    const { data: docs } = await supabase
      .from("documentos")
      .select("tamanio_bytes")
      .eq("user_id", user.id);
    const usedBytes = docs?.reduce((s, d) => s + (d.tamanio_bytes ?? 0), 0) ?? 0;
    // Leemos el tamaño del archivo del header para la validación previa
    const contentLength = Number(req.headers.get("content-length") ?? 0);
    if (usedBytes + contentLength > limitBytes) {
      return NextResponse.json({ error: "storage_limit_reached", message: "Has alcanzado el límite de almacenamiento de tu plan." }, { status: 403 });
    }
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "FormData inválido" }, { status: 400 });
  }

  const file       = formData.get("file") as File | null;
  const propiedadId = formData.get("propiedadId") as string | null;
  const tipo       = formData.get("tipo") as string | null;

  if (!file || !propiedadId || !tipo) {
    return NextResponse.json(
      { error: "Faltan campos: file, propiedadId, tipo" },
      { status: 400 }
    );
  }

  const tipoSeguro = tipo.toLowerCase().replace(/[^a-z0-9_-]/g, "_").slice(0, 40);
  const ext = file.name.includes(".")
    ? file.name.split(".").pop()!.toLowerCase().replace(/[^a-z0-9]/g, "")
    : "bin";
  const key = `users/${user.id}/${tipoSeguro}/${propiedadId}/${Date.now()}.${ext}`;

  try {
    await uploadFile(key, await file.arrayBuffer(), file.type || "application/octet-stream");
  } catch (err) {
    console.error("[upload] R2 error:", err);
    return NextResponse.json({ error: "No se pudo subir el archivo" }, { status: 500 });
  }

  // propiedadId puede ser "tenant_{id}" para docs de inquilino — en ese caso no hay FK válida
  const dbPropId = propiedadId.startsWith("tenant_") ? null : propiedadId;

  const { data, error } = await supabase
    .from("documentos")
    .insert({
      user_id: user.id,
      propiedad_id: dbPropId,
      tipo,
      nombre_original: file.name,
      r2_key: key,
      tamanio_bytes: file.size,
    })
    .select("id, user_id, propiedad_id, tipo, nombre_original, r2_key, tamanio_bytes, created_at")
    .single();

  if (error) {
    console.error("[upload] Supabase error:", error);
    return NextResponse.json({ error: "No se pudo guardar el documento" }, { status: 500 });
  }

  if (/\.pdf$/i.test(file.name)) {
    void (async () => {
      const textoExtraido = await extractTextFromPDF(key);

      if (textoExtraido === null) {
        return;
      }

      try {
        const serviceSupabase = createServiceClient();
        const { error: updateError } = await serviceSupabase
          .from("documentos")
          .update({ texto_extraido: textoExtraido })
          .eq("id", data.id)
          .eq("user_id", user.id);

        if (updateError) {
          console.error("[upload] Extraction update error:", updateError);
        }
      } catch (backgroundError) {
        console.error("[upload] Background extraction error:", backgroundError);
      }
    })();
  }

  return NextResponse.json(data, { status: 201 });
}
