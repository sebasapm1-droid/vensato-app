import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDownloadUrl, deleteFile } from "@/lib/r2";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/documentos/[id] — genera presigned download URL (1 hora)
export async function GET(
  _req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Obtener el documento y verificar ownership con RLS (la policy hace el filtro)
  const { data: doc, error } = await supabase
    .from("documentos")
    .select("id, user_id, r2_key")
    .eq("id", id)
    .single();

  if (error || !doc) {
    return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
  }

  // Doble verificación explícita de ownership
  if (doc.user_id !== user.id) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  try {
    const url = await getDownloadUrl(doc.r2_key);
    return NextResponse.json({ url });
  } catch (err) {
    console.error("[documentos GET] Error generando download URL:", err);
    return NextResponse.json(
      { error: "No se pudo generar la URL de descarga" },
      { status: 500 }
    );
  }
}

// DELETE /api/documentos/[id] — elimina archivo en R2 y registro en Supabase
export async function DELETE(
  _req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Obtener el documento (RLS garantiza que solo veremos los del usuario)
  const { data: doc, error } = await supabase
    .from("documentos")
    .select("id, user_id, r2_key")
    .eq("id", id)
    .single();

  if (error || !doc) {
    return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
  }

  if (doc.user_id !== user.id) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  try {
    // Primero eliminar el archivo de R2
    await deleteFile(doc.r2_key);
  } catch (err) {
    console.error("[documentos DELETE] Error eliminando de R2:", err);
    return NextResponse.json(
      { error: "No se pudo eliminar el archivo de almacenamiento" },
      { status: 500 }
    );
  }

  // Luego eliminar el registro de Supabase
  const { error: dbError } = await supabase
    .from("documentos")
    .delete()
    .eq("id", id);

  if (dbError) {
    console.error("[documentos DELETE] Error eliminando de Supabase:", dbError);
    return NextResponse.json(
      { error: "Archivo eliminado de R2 pero el registro en BD falló" },
      { status: 500 }
    );
  }

  return new NextResponse(null, { status: 204 });
}
