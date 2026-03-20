import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { Tier } from "@/lib/plans";

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const TIER_RANK: Record<Tier, number> = { base: 0, inicio: 1, portafolio: 2, patrimonio: 3 };

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { tier } = await req.json() as { tier: Tier };

  // Fetch current profile to validate
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("tier, subscription_status")
    .eq("id", user.id)
    .single();

  if (!profile) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });

  const currentRank = TIER_RANK[profile.tier as Tier] ?? 0;
  const targetRank = TIER_RANK[tier] ?? 0;

  if (targetRank >= currentRank) {
    return NextResponse.json({ error: "Usa el flujo de upgrade para planes superiores" }, { status: 400 });
  }

  await supabaseAdmin
    .from("profiles")
    .update({ pending_tier: tier, pending_tier_since: new Date().toISOString() })
    .eq("id", user.id);

  return NextResponse.json({ ok: true });
}
