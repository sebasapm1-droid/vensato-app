import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/documentos — lista todos los documentos del usuario autenticado
export async function GET(_req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("documentos")
    .select("id, user_id, propiedad_id, tipo, nombre_original, r2_key, tamanio_bytes, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[documentos GET list] Error:", error);
    return NextResponse.json({ error: "Error cargando documentos" }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
