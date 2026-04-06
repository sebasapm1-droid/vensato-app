import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireFeature } from "@/lib/middleware/requirePlan";
import { sendChargeEmail } from "@/lib/email/charge-emails";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  req: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const guard = await requireFeature("hasChargeEmailManual")(req);
  if (guard) {
    return guard;
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await context.params;
  const result = await sendChargeEmail(id, user.id, "manual");

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    recipientEmail: result.recipientEmail,
    subject: result.subject,
    messageId: result.messageId,
  });
}
