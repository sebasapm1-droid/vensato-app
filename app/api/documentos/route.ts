import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface CreateDocumentoBody {
  propiedadId: string;
  tipo: string;
  nombreOriginal: string;
  r2Key: string;
  tamanioBytes: number;
}

// GET /api/documentos — lista todos los documentos del usuario autenticado
export async function GET(_req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("documentos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[documentos GET list] Error:", error);
    return NextResponse.json({ error: "Error cargando documentos" }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

// POST /api/documentos — guarda metadata de un documento ya subido a R2
export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: CreateDocumentoBody;
  try {
    body = await req.json() as CreateDocumentoBody;
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const { propiedadId, tipo, nombreOriginal, r2Key, tamanioBytes } = body;

  if (!propiedadId || !tipo || !nombreOriginal || !r2Key) {
    return NextResponse.json(
      { error: "Faltan campos: propiedadId, tipo, nombreOriginal, r2Key" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("documentos")
    .insert({
      user_id: user.id,
      propiedad_id: propiedadId,
      tipo,
      nombre_original: nombreOriginal,
      r2_key: r2Key,
      tamanio_bytes: tamanioBytes ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error("[documentos POST] Error insertando:", error);
    return NextResponse.json(
      { error: "No se pudo guardar el documento" },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}
