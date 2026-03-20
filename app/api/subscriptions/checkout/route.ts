import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { PLANS, Tier } from "@/lib/plans";

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const WOMPI_BASE = process.env.WOMPI_PUBLIC_KEY?.startsWith("pub_test_")
  ? "https://sandbox.wompi.co/v1"
  : "https://production.wompi.co/v1";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { tier } = await req.json() as { tier: Tier };
  const plan = PLANS[tier];

  if (!tier || tier === "base" || !plan || plan.precioMensualCOP === 0) {
    return NextResponse.json({ error: "Tier inválido" }, { status: 400 });
  }

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const tierLabel = { inicio: "Inicio", portafolio: "Portafolio", patrimonio: "Patrimonio" }[tier] ?? tier;

  // reference: vensato-{tier}-{userId} — se usará en el webhook para actualizar el perfil
  const reference = `vensato-${tier}-${user.id}`;

  const payload = {
    name: `Plan ${tierLabel} - Vensato`,
    description: `Suscripción mensual al plan ${tierLabel} de Vensato. Acceso por 31 días.`,
    single_use: true,
    collect_shipping: false,
    currency: "COP",
    amount_in_cents: plan.precioMensualCOP * 100,
    redirect_url: `${base}/pricing?payment=done`,
    reference,
  };

  console.log("[checkout] Calling Wompi:", WOMPI_BASE, JSON.stringify(payload));

  const res = await fetch(`${WOMPI_BASE}/payment_links`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.WOMPI_PRIVATE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await res.json();

  if (!res.ok) {
    console.error("[checkout] Wompi error:", JSON.stringify(body));
    const msgs = body?.error?.messages;
    const errorStr = msgs && typeof msgs === "object"
      ? Object.entries(msgs).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`).join(" | ")
      : typeof msgs === "string" ? msgs
      : body?.error?.type ?? "Error al crear el link de pago";
    return NextResponse.json({ error: errorStr }, { status: 500 });
  }

  console.log("[checkout] Wompi response:", JSON.stringify(body));
  const linkId = body.data?.id;
  if (!linkId) return NextResponse.json({ error: "Sin link ID" }, { status: 500 });

  // Guardar mapeo linkId → tier para que el webhook pueda identificar el pago
  await supabaseAdmin
    .from("profiles")
    .update({ wompi_customer_id: `${linkId}:${tier}` })
    .eq("id", user.id);

  const url = `https://checkout.wompi.co/l/${linkId}`;
  return NextResponse.json({ url });
}
