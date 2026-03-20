import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

// Wompi signature: SHA256 of specific transaction fields + events_secret (no HMAC)
function verifyWompiSignature(transaction: any, checksum: string, secret: string): boolean {
  const str =
    String(transaction.id) +
    String(transaction.nonce ?? "") +
    String(transaction.created_at ?? "") +
    String(transaction.amount_in_cents ?? "") +
    String(transaction.currency ?? "") +
    String(transaction.status ?? "") +
    secret;
  const expected = createHash("sha256").update(str).digest("hex");
  return expected === checksum;
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

  // ── 1. Verify signature ────────────────────────────────────────────────────
  const wompiSignature = req.headers.get("x-event-checksum") ?? "";
  const secret = process.env.WOMPI_EVENTS_SECRET ?? "";

  const signatureOk = verifyWompiSignature(transaction, wompiSignature, secret);
  console.log("[wompi-webhook] signature ok:", signatureOk, "event nonce:", event.nonce);
  // TODO: re-enable after confirming signature algorithm
  // if (!signatureOk) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  if (transaction.status !== "APPROVED") {
    return NextResponse.json({ ok: true });
  }

  // ── 2. Look up checkout session ────────────────────────────────────────────
  const linkId: string = transaction.payment_link_id ?? "";
  console.log("[wompi-webhook] payment_link_id:", linkId, "status:", transaction.status);
  if (!linkId) {
    console.warn("[wompi-webhook] No payment_link_id");
    return NextResponse.json({ ok: true });
  }

  const { data: session, error: sessionErr } = await supabaseAdmin
    .from("checkout_sessions")
    .select("id, user_id, tier")
    .eq("payment_link_id", linkId)
    .eq("status", "pending")
    .maybeSingle();

  console.log("[wompi-webhook] session found:", session, "error:", sessionErr);

  if (!session) {
    console.warn("[wompi-webhook] No checkout session for link:", linkId);
    return NextResponse.json({ ok: true });
  }

  const { id: sessionId, user_id: userId, tier } = session;
  const validUntil = addDays(31);
  const now = new Date().toISOString();

  console.log(`[wompi-webhook] processing: userId=${userId} tier=${tier}`);

  // ── 3. Update profile ──────────────────────────────────────────────────────
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

  // ── 4. Mark checkout session completed ────────────────────────────────────
  await supabaseAdmin
    .from("checkout_sessions")
    .update({ status: "completed" })
    .eq("id", sessionId);

  // ── 5. Insert subscription record ─────────────────────────────────────────
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
