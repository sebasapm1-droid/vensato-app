import { NextRequest, NextResponse } from "next/server";
import {
  listAutomaticChargeCandidates,
  sendChargeEmail,
} from "@/lib/email/charge-emails";

function addDays(date: Date, days: number): string {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString().split("T")[0];
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const targetDate = addDays(new Date(), 5);
    const candidates = await listAutomaticChargeCandidates(targetDate);

    let sent = 0;
    let failed = 0;

    for (const candidate of candidates) {
      const result = await sendChargeEmail(
        candidate.chargeId,
        candidate.userId,
        "automatic"
      );

      if (result.ok) {
        sent += 1;
      } else {
        failed += 1;
      }
    }

    return NextResponse.json({
      targetDate,
      candidates: candidates.length,
      sent,
      failed,
    });
  } catch (error) {
    console.error("[cron] send-charge-emails failed:", error);
    return NextResponse.json(
      { error: "No se pudieron enviar las cuentas de cobro." },
      { status: 500 }
    );
  }
}
