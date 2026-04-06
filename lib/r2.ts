import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const bucketName = process.env.R2_BUCKET_NAME;
const apiToken = process.env.CLOUDFLARE_API_TOKEN;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

if (!accountId || !bucketName || !apiToken || !accessKeyId || !secretAccessKey) {
  throw new Error("Faltan variables de R2 para API y firmas de descarga.");
}

const base = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucketName}/objects`;
const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;

const s3Client = new S3Client({
  region: "auto",
  endpoint,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

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
    throw new Error(`R2 upload fallo (${res.status}): ${text.slice(0, 200)}`);
  }
}

export async function downloadFile(key: string): Promise<Response> {
  const res = await fetch(`${base}/${key}`, {
    headers: { Authorization: `Bearer ${apiToken}` },
  });

  if (!res.ok) {
    throw new Error(`R2 download fallo (${res.status})`);
  }

  return res;
}

export async function deleteFile(key: string): Promise<void> {
  const res = await fetch(`${base}/${key}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${apiToken}` },
  });

  if (!res.ok && res.status !== 404) {
    throw new Error(`R2 delete fallo (${res.status})`);
  }
}

export async function getDownloadUrl(
  key: string,
  expiresIn: number
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}
