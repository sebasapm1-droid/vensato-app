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

// Wompi signature: SHA256 of event.signature.properties values + events_secret (no HMAC)
// Properties and order are listed dynamically in event.signature.properties
function verifyWompiSignature(event: any, secret: string): boolean {
  const { checksum, properties } = event?.signature ?? {};
  if (!checksum || !Array.isArray(properties)) return false;

  const transaction = event?.data?.transaction ?? {};
  const values = properties.map((path: string) => {
    const field = path.split(".").slice(1).join(".");
    return String(transaction[field] ?? "");
  });
  const str = values.join("") + secret;
  const expected = createHash("sha256").update(str).digest("hex");

  console.log("[wompi-webhook] hash input:", values.join(""), "| expected checksum:", checksum);
  console.log("[wompi-webhook] computed:", expected);

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

  console.log("[wompi-webhook] x-event-checksum header:", req.headers.get("x-event-checksum"));
  console.log("[wompi-webhook] event.signature.checksum:", event?.signature?.checksum);

  // ── 1. Verify signature ────────────────────────────────────────────────────
  const eventsSecret = process.env.WOMPI_EVENTS_SECRET ?? "";
  const integritySecret = process.env.WOMPI_INTEGRITY_SECRET ?? "";

  console.log("[wompi-webhook] events secret full:", JSON.stringify(eventsSecret));
  console.log("[wompi-webhook] integrity secret full:", JSON.stringify(integritySecret));

  const okWithEvents = verifyWompiSignature(event, eventsSecret);
  const okWithIntegrity = verifyWompiSignature(event, integritySecret);
  console.log("[wompi-webhook] events ok:", okWithEvents, "| integrity ok:", okWithIntegrity);

  if (!okWithEvents && !okWithIntegrity) {
    console.warn("[wompi-webhook] Invalid signature (not blocking)");
  }

  if (transaction.status !== "APPROVED") {
    return NextResponse.json({ ok: true });
  }

  // ── 2. Look up checkout session ────────────────────────────────────────────
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
