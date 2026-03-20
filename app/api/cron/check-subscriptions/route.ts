import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Este endpoint es llamado por Vercel Cron diariamente.
// Verifica suscripciones vencidas y degrada el tier a 'base'.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: expired, error } = await supabase
    .from("profiles")
    .select("id")
    .neq("tier", "base")
    .lt("subscription_valid_until", new Date().toISOString())
    .eq("subscription_status", "active");

  if (error) {
    console.error("[cron] Error fetching expired subscriptions:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const ids = (expired ?? []).map(u => u.id);

  if (ids.length > 0) {
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ tier: "base", subscription_status: "cancelled" })
      .in("id", ids);

    if (updateError) {
      console.error("[cron] Error updating profiles:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, degraded: ids.length });
}
