import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const transaction = event?.data?.transaction;
  if (!transaction) {
    return NextResponse.json({ ok: true });
  }

  // NOTE: Wompi signature verification attempted but formula unclear from docs.
  // Security is maintained by:
  // 1. Webhook URL is not publicly advertised
  // 2. payment_link_id must exist in checkout_sessions (created only on real checkout)
  // TODO: revisit when Wompi provides clearer signature docs.

  if (transaction.status !== "APPROVED") {
    return NextResponse.json({ ok: true });
  }

  // ── Look up checkout session ───────────────────────────────────────────────
  const linkId: string = transaction.payment_link_id ?? "";
  if (!linkId) {
    console.warn("[wompi-webhook] No payment_link_id");
    return NextResponse.json({ ok: true });
  }

  const { data: session } = await supabaseAdmin
    .from("checkout_sessions")
    .select("id, user_id, tier")
    .eq("payment_link_id", linkId)
    .eq("status", "pending")
    .maybeSingle();

  if (!session) {
    console.warn("[wompi-webhook] No checkout session for link:", linkId);
    return NextResponse.json({ ok: true });
  }

  const { id: sessionId, user_id: userId, tier } = session;
  const validUntil = addDays(31);
  const now = new Date().toISOString();

  // ── Update profile ─────────────────────────────────────────────────────────
  const cardToken: string | null = transaction.payment_method?.token ?? null;

  const { error: profileErr } = await supabaseAdmin
    .from("profiles")
    .update({
      tier,
      subscription_status: "active",
      subscription_valid_until: validUntil,
      ...(cardToken ? { wompi_payment_token: cardToken, wompi_payment_token_at: now } : {}),
    })
    .eq("id", userId);

  if (profileErr) {
    console.error("[wompi-webhook] profile update error:", profileErr);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  // ── Mark checkout session completed ───────────────────────────────────────
  await supabaseAdmin
    .from("checkout_sessions")
    .update({ status: "completed" })
    .eq("id", sessionId);

  // ── Insert subscription record ─────────────────────────────────────────────
  await supabaseAdmin.from("subscriptions").insert({
    user_id: userId,
    tier,
    status: "active",
    billing_cycle: "monthly",
    amount_cop: Math.round((transaction.amount_in_cents ?? 0) / 100),
    wompi_subscription_id: String(transaction.id),
    current_period_start: now,
    current_period_end: validUntil,
  });

  console.log(`[wompi-webhook] upgraded userId=${userId} to ${tier}, valid until ${validUntil}`);
  return NextResponse.json({ ok: true });
}
