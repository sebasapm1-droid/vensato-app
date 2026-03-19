/**
 * Endpoint temporal para configurar el CORS de R2 via Cloudflare REST API.
 * Llamar UNA SOLA VEZ desde el browser cuando esté desplegado en Vercel.
 * ELIMINAR este archivo después de usarlo.
 */
import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  const accountId  = process.env.CLOUDFLARE_ACCOUNT_ID;
  const bucketName = process.env.R2_BUCKET_NAME;
  const apiToken   = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !bucketName || !apiToken) {
    return NextResponse.json({
      ok: false,
      error: "Faltan variables de entorno",
      debug: {
        CLOUDFLARE_ACCOUNT_ID: accountId  ? "✅ presente" : "❌ falta",
        R2_BUCKET_NAME:        bucketName ? "✅ presente" : "❌ falta",
        CLOUDFLARE_API_TOKEN:  apiToken   ? "✅ presente" : "❌ falta",
      },
    }, { status: 500 });
  }

  const corsRules = [
    {
      allowed_origins: [
        "http://localhost:3000",
        "https://app.vensato.com",
        "https://vensato-app.vercel.app",
      ],
      allowed_methods: ["GET", "PUT", "DELETE", "HEAD"],
      allowed_headers: ["*"],
      expose_headers: ["ETag", "Content-Length"],
      max_age_seconds: 3600,
    },
  ];

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucketName}/cors`;

  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(corsRules),
    });

    const data = await res.json() as { success: boolean; errors?: unknown[] };

    if (!res.ok || !data.success) {
      return NextResponse.json({ ok: false, error: "Cloudflare rechazó la petición", details: data }, { status: 500 });
    }

    // Verificar que quedó guardado
    const getRes = await fetch(url, {
      headers: { "Authorization": `Bearer ${apiToken}` },
    });
    const saved = await getRes.json();

    return NextResponse.json({
      ok: true,
      message: "CORS configurado correctamente. Ya puedes eliminar este endpoint.",
      corsRules: saved,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
