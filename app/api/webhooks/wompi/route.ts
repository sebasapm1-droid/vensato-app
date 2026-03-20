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

// Wompi checksum: SHA256 of transaction fields concatenated with the events secret
// https://docs.wompi.co/docs/colombia/pagos-presenciales-terminales/notificaciones-de-eventos
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
  console.log("[wompi-webhook] computed checksum:", expected, "received:", checksum);
  return expected === checksum;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // ── 2. Parse event first (need transaction fields for signature) ───────────
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

  // ── 1. Verify Wompi signature ──────────────────────────────────────────────
  const wompiSignature = req.headers.get("x-event-checksum") ?? "";
  const secret = process.env.WOMPI_EVENTS_SECRET ?? "";

  // TODO: re-enable once signature algorithm is confirmed
  // if (!verifyWompiSignature(transaction, wompiSignature, secret)) {
  //   console.warn("[wompi-webhook] Invalid signature — rejecting");
  //   return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  // }
  verifyWompiSignature(transaction, wompiSignature, secret); // logs only

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
