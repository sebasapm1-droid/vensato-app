import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("subscription_status, subscription_valid_until, tier")
    .eq("id", user.id)
    .single();

  if (!profile) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });

  if (profile.subscription_status !== "cancelled") {
    return NextResponse.json({ error: "La suscripción no está cancelada" }, { status: 400 });
  }

  // Solo reactivar si el período actual sigue vigente
  const validUntil = profile.subscription_valid_until ? new Date(profile.subscription_valid_until) : null;
  if (!validUntil || validUntil < new Date()) {
    return NextResponse.json({ error: "El período ya venció, debes hacer un nuevo pago" }, { status: 400 });
  }

  await supabaseAdmin
    .from("profiles")
    .update({ subscription_status: "active" })
    .eq("id", user.id);

  return NextResponse.json({ ok: true });
}
