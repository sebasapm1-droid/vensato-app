/**
 * Script de un solo uso para configurar el CORS del bucket R2
 * vía la API S3-compatible (el dashboard de Cloudflare solo aplica al dominio público).
 *
 * Uso:
 *   node scripts/set-r2-cors.mjs
 */

import { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } from "@aws-sdk/client-s3";

// Leer credenciales del entorno (carga .env.local manualmente)
import { readFileSync } from "fs";
import { resolve } from "path";

const envPath = resolve(process.cwd(), ".env.local");
const envContent = readFileSync(envPath, "utf-8");
const env = Object.fromEntries(
  envContent
    .split("\n")
    .filter(line => line.includes("=") && !line.startsWith("#"))
    .map(line => {
      const [key, ...rest] = line.split("=");
      return [key.trim(), rest.join("=").trim()];
    })
);

const accountId      = env.CLOUDFLARE_ACCOUNT_ID;
const bucketName     = env.R2_BUCKET_NAME;
const accessKeyId    = env.R2_ACCESS_KEY_ID;
const secretAccessKey = env.R2_SECRET_ACCESS_KEY;

if (!accountId || !bucketName || !accessKeyId || !secretAccessKey) {
  console.error("❌ Faltan variables en .env.local");
  process.exit(1);
}

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
});

const corsConfig = {
  CORSRules: [
    {
      AllowedOrigins: [
        "http://localhost:3000",
        "https://app.vensato.com",
        "https://vensato-app.vercel.app",
      ],
      AllowedMethods: ["GET", "PUT", "DELETE", "HEAD"],
      AllowedHeaders: ["*"],
      ExposeHeaders: ["ETag", "Content-Length"],
      MaxAgeSeconds: 3600,
    },
  ],
};

console.log(`\n🪣  Bucket: ${bucketName}`);
console.log(`🔧 Configurando CORS en endpoint S3...\n`);

try {
  await r2.send(new PutBucketCorsCommand({
    Bucket: bucketName,
    CORSConfiguration: corsConfig,
  }));
  console.log("✅ CORS configurado correctamente.\n");

  // Verificar que quedó guardado
  const result = await r2.send(new GetBucketCorsCommand({ Bucket: bucketName }));
  console.log("📋 Configuración guardada:");
  console.log(JSON.stringify(result.CORSRules, null, 2));
} catch (err) {
  console.error("❌ Error:", err.message);
  process.exit(1);
}
