import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { downloadFile } from "@/lib/r2";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  _req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse | Response> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data: doc, error } = await supabase
    .from("documentos")
    .select("id, user_id, r2_key, nombre_original")
    .eq("id", id)
    .single();

  if (error || !doc) {
    return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
  }

  if (doc.user_id !== user.id) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  try {
    const r2Res = await downloadFile(doc.r2_key);
    const contentType = r2Res.headers.get("Content-Type") ?? "application/octet-stream";

    return new Response(r2Res.body, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": "inline",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    console.error("[download] R2 error:", err);
    return NextResponse.json({ error: "No se pudo descargar el archivo" }, { status: 500 });
  }
}
