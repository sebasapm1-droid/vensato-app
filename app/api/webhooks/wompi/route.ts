import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac } from "crypto";

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

  // ── 1. Verify Wompi signature ──────────────────────────────────────────────
  const wompiSignature = req.headers.get("x-event-checksum") ?? "";
  const secret = process.env.WOMPI_EVENTS_SECRET ?? "";

  const expected = createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  if (expected !== wompiSignature) {
    console.warn("[wompi-webhook] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // ── 2. Parse event ─────────────────────────────────────────────────────────
  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const transaction = event?.data?.transaction;
  if (!transaction) {
    return NextResponse.json({ ok: true }); // ignore non-transaction events
  }

  if (transaction.status !== "APPROVED") {
    // Not approved — nothing to do
    return NextResponse.json({ ok: true });
  }

  // ── 3. Parse reference: vensato-{tier}-{userId} ───────────────────────────
  const ref: string = transaction.reference ?? "";
  const match = ref.match(/^vensato-(inicio|portafolio|patrimonio)-(.+)$/);
  if (!match) {
    console.warn("[wompi-webhook] Unrecognised reference:", ref);
    return NextResponse.json({ ok: true });
  }

  const tier = match[1] as "inicio" | "portafolio" | "patrimonio";
  const userId = match[2];
  const validUntil = addDays(31);

  // ── 4. Update profile ──────────────────────────────────────────────────────
  const { error: profileErr } = await supabaseAdmin
    .from("profiles")
    .update({
      tier,
      subscription_status: "active",
      subscription_valid_until: validUntil,
    })
    .eq("id", userId);

  if (profileErr) {
    console.error("[wompi-webhook] profile update error:", profileErr);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  // ── 5. Insert into subscriptions table ────────────────────────────────────
  const now = new Date().toISOString();
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

  console.log(`[wompi-webhook] ${userId} upgraded to ${tier}, valid until ${validUntil}`);
  return NextResponse.json({ ok: true });
}
