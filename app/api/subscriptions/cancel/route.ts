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

  // Marcar como cancelado — mantiene acceso hasta subscription_valid_until
  const { error: updateErr } = await supabaseAdmin
    .from("profiles")
    .update({
      subscription_status: "cancelled",
      wompi_payment_token: null,
      wompi_payment_token_at: null,
    })
    .eq("id", user.id);

  if (updateErr) {
    console.error("[cancel] error:", updateErr);
    return NextResponse.json({ error: "Error al cancelar" }, { status: 500 });
  }

  // Marcar la suscripción activa como cancelada
  await supabaseAdmin
    .from("subscriptions")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("status", "active");

  return NextResponse.json({ ok: true });
}
