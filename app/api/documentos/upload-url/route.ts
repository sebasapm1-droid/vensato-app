import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUploadUrl } from "@/lib/r2";

interface UploadUrlBody {
  propiedadId: string;
  tipo: string;
  nombreArchivo: string;
  contentType: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: UploadUrlBody;
  try {
    body = await req.json() as UploadUrlBody;
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const { propiedadId, tipo, nombreArchivo, contentType } = body;

  if (!propiedadId || !tipo || !nombreArchivo || !contentType) {
    return NextResponse.json(
      { error: "Faltan campos: propiedadId, tipo, nombreArchivo, contentType" },
      { status: 400 }
    );
  }

  // Sanitizar el tipo para usarlo como segmento de path seguro
  const tipoSeguro = tipo.toLowerCase().replace(/[^a-z0-9_-]/g, "_").slice(0, 40);

  const ext = nombreArchivo.includes(".")
    ? nombreArchivo.split(".").pop()!.toLowerCase().replace(/[^a-z0-9]/g, "")
    : "bin";

  const key = `users/${user.id}/${tipoSeguro}/${propiedadId}/${Date.now()}.${ext}`;

  try {
    const uploadUrl = await getUploadUrl(key, contentType);
    return NextResponse.json({ uploadUrl, key });
  } catch (err) {
    console.error("[upload-url] Error generando presigned URL:", err);
    return NextResponse.json(
      { error: "No se pudo generar la URL de carga" },
      { status: 500 }
    );
  }
}
