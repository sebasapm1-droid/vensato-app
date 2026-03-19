/**
 * Cloudflare R2 client — SERVER ONLY.
 * Nunca importar desde componentes de cliente.
 * Los secretos R2 (access key, secret) viven únicamente aquí.
 */
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const bucketName = process.env.R2_BUCKET_NAME;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

if (!accountId || !bucketName || !accessKeyId || !secretAccessKey) {
  throw new Error(
    "Faltan variables de entorno de Cloudflare R2. Verifica CLOUDFLARE_ACCOUNT_ID, R2_BUCKET_NAME, R2_ACCESS_KEY_ID y R2_SECRET_ACCESS_KEY en .env.local"
  );
}

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

/**
 * Genera una presigned PUT URL para que el browser suba directamente a R2.
 * El archivo NUNCA pasa por el servidor de Next.js.
 */
export async function getUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 300
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(r2, command, { expiresIn });
}

/**
 * Genera una presigned GET URL para que el browser descargue desde R2.
 * Por defecto expira en 1 hora.
 */
export async function getDownloadUrl(
  key: string,
  expiresIn = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });
  return getSignedUrl(r2, command, { expiresIn });
}

/**
 * Elimina un objeto del bucket R2. Llamar solo desde el servidor
 * después de verificar que el usuario tiene ownership del documento.
 */
export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });
  await r2.send(command);
}
