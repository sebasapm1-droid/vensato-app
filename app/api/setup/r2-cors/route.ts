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
    // Primero: GET para ver qué formato usa Cloudflare
    const getRes = await fetch(url, {
      headers: { "Authorization": `Bearer ${apiToken}` },
    });
    const getCurrent = await getRes.json();

    return NextResponse.json({
      debug: true,
      status: getRes.status,
      currentCors: getCurrent,
      note: "Este es el estado actual del CORS. Revisalo para entender el formato.",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
