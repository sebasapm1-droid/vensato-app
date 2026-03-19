import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadFile } from "@/lib/r2";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
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
    .select()
    .single();

  if (error) {
    console.error("[upload] Supabase error:", error);
    return NextResponse.json({ error: "No se pudo guardar el documento" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
