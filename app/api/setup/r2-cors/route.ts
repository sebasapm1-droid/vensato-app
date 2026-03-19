/**
 * Endpoint de diagnóstico + configuración CORS temporal.
 * ELIMINAR después de resolver el problema de uploads.
 */
import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function GET(): Promise<NextResponse> {
  const accountId  = process.env.CLOUDFLARE_ACCOUNT_ID;
  const bucketName = process.env.R2_BUCKET_NAME;
  const accessKeyId    = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const apiToken   = process.env.CLOUDFLARE_API_TOKEN;

  const envCheck = {
    CLOUDFLARE_ACCOUNT_ID: accountId  ? "✅" : "❌",
    R2_BUCKET_NAME:        bucketName ? "✅" : "❌",
    R2_ACCESS_KEY_ID:      accessKeyId    ? "✅" : "❌",
    R2_SECRET_ACCESS_KEY:  secretAccessKey ? "✅" : "❌",
    CLOUDFLARE_API_TOKEN:  apiToken   ? "✅" : "❌",
  };

  if (!accountId || !bucketName || !accessKeyId || !secretAccessKey) {
    return NextResponse.json({ ok: false, envCheck }, { status: 500 });
  }

  // 1. Test fetch() connectivity to R2 S3 endpoint
  let fetchConnectivity: string;
  try {
    const r = await fetch(`https://${accountId}.r2.cloudflarestorage.com`, {
      method: "HEAD",
      signal: AbortSignal.timeout(5000),
    });
    fetchConnectivity = `✅ HTTP ${r.status}`;
  } catch (e) {
    fetchConnectivity = `❌ ${e instanceof Error ? e.message : String(e)}`;
  }

  // 2. Generate a presigned URL to inspect its format
  const r2 = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });

  let presignedUrl: string;
  try {
    presignedUrl = await getSignedUrl(
      r2,
      new PutObjectCommand({ Bucket: bucketName, Key: "test/diagnostic.txt", ContentType: "text/plain" }),
      { expiresIn: 60 }
    );
  } catch (e) {
    presignedUrl = `❌ Error generando URL: ${e instanceof Error ? e.message : String(e)}`;
  }

  // 3. Test fetch() PUT to the presigned URL (small payload)
  let presignedPutTest: string;
  if (presignedUrl.startsWith("http")) {
    try {
      const r = await fetch(presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": "text/plain" },
        body: "test",
        signal: AbortSignal.timeout(8000),
      });
      presignedPutTest = `✅ HTTP ${r.status} - ${await r.text().catch(() => "")}`;
    } catch (e) {
      presignedPutTest = `❌ ${e instanceof Error ? e.message : String(e)}`;
    }
  } else {
    presignedPutTest = "⏭️ Saltado (URL inválida)";
  }

  return NextResponse.json({
    envCheck,
    fetchConnectivity,
    presignedUrl,
    presignedPutTest,
  });
}
