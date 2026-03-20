import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const WOMPI_BASE = process.env.WOMPI_PUBLIC_KEY?.startsWith("pub_test_")
  ? "https://sandbox.wompi.co/v1"
  : "https://production.wompi.co/v1";

const PLANS_COP: Record<string, number> = {
  inicio: 15900,
  portafolio: 35000,
  patrimonio: 85000,
};

function addDays(from: Date, days: number): string {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find active subscriptions expiring in the next 3 days with a saved payment token
  const in3Days = addDays(new Date(), 3);

  const { data: profiles, error } = await supabaseAdmin
    .from("profiles")
    .select("id, tier, subscription_valid_until, wompi_payment_token, email")
    .eq("subscription_status", "active")
    .neq("tier", "base")
    .not("wompi_payment_token", "is", null)
    .lte("subscription_valid_until", in3Days);

  if (error) {
    console.error("[renew] fetch error:", error);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  if (!profiles?.length) {
    console.log("[renew] No subscriptions to renew");
    return NextResponse.json({ renewed: 0 });
  }

  // Get acceptance token (required by Wompi for server-side charges)
  const merchantRes = await fetch(`${WOMPI_BASE}/merchants/${process.env.WOMPI_PUBLIC_KEY}`);
  const merchantBody = await merchantRes.json();
  const acceptanceToken: string = merchantBody?.data?.presigned_acceptance?.acceptance_token ?? "";

  if (!acceptanceToken) {
    console.error("[renew] Could not get acceptance token");
    return NextResponse.json({ error: "No acceptance token" }, { status: 500 });
  }

  let renewed = 0;
  let failed = 0;

  for (const profile of profiles) {
    const amountCOP = PLANS_COP[profile.tier];
    if (!amountCOP) continue;

    const reference = `vensato-renewal-${profile.tier}-${profile.id}-${Date.now()}`;

    try {
      const txRes = await fetch(`${WOMPI_BASE}/transactions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WOMPI_PRIVATE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount_in_cents: amountCOP * 100,
          currency: "COP",
          customer_email: profile.email,
          payment_method: {
            type: "CARD",
            token: profile.wompi_payment_token,
            installments: 1,
          },
          reference,
          acceptance_token: acceptanceToken,
        }),
      });

      const txBody = await txRes.json();
      const txStatus = txBody?.data?.status;

      if (txStatus === "APPROVED") {
        const newValidUntil = addDays(new Date(profile.subscription_valid_until), 31);
        await supabaseAdmin
          .from("profiles")
          .update({ subscription_valid_until: newValidUntil, subscription_status: "active" })
          .eq("id", profile.id);

        await supabaseAdmin.from("subscriptions").insert({
          user_id: profile.id,
          tier: profile.tier,
          status: "active",
          billing_cycle: "monthly",
          amount_cop: amountCOP,
          wompi_subscription_id: String(txBody.data.id),
          current_period_start: new Date().toISOString(),
          current_period_end: newValidUntil,
        });

        console.log(`[renew] renewed ${profile.id} until ${newValidUntil}`);
        renewed++;
      } else {
        // Charge failed — mark as past_due
        await supabaseAdmin
          .from("profiles")
          .update({ subscription_status: "past_due" })
          .eq("id", profile.id);

        console.warn(`[renew] failed for ${profile.id}: status=${txStatus}`);
        failed++;
      }
    } catch (err) {
      console.error(`[renew] error for ${profile.id}:`, err);
      failed++;
    }
  }

  return NextResponse.json({ renewed, failed });
}
