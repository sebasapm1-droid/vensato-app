/**
 * Cloudflare R2 — SERVER ONLY.
 * Usa la API REST de Cloudflare (api.cloudflare.com) para evitar
 * problemas de conectividad con el endpoint S3-compatible (cloudflarestorage.com).
 */

const accountId  = process.env.CLOUDFLARE_ACCOUNT_ID;
const bucketName = process.env.R2_BUCKET_NAME;
const apiToken   = process.env.CLOUDFLARE_API_TOKEN;

if (!accountId || !bucketName || !apiToken) {
  throw new Error(
    "Faltan variables de R2: CLOUDFLARE_ACCOUNT_ID, R2_BUCKET_NAME, CLOUDFLARE_API_TOKEN"
  );
}

const base = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucketName}/objects`;

export async function uploadFile(
  key: string,
  body: ArrayBuffer,
  contentType: string
): Promise<void> {
  const res = await fetch(`${base}/${key}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": contentType,
    },
    body,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`R2 upload falló (${res.status}): ${text.slice(0, 200)}`);
  }
}

export async function downloadFile(key: string): Promise<Response> {
  const res = await fetch(`${base}/${key}`, {
    headers: { Authorization: `Bearer ${apiToken}` },
  });
  if (!res.ok) {
    throw new Error(`R2 download falló (${res.status})`);
  }
  return res;
}

export async function deleteFile(key: string): Promise<void> {
  const res = await fetch(`${base}/${key}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${apiToken}` },
  });
  if (!res.ok && res.status !== 404) {
    throw new Error(`R2 delete falló (${res.status})`);
  }
}
