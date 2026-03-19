/**
 * Endpoint temporal para configurar el CORS de R2 desde el servidor.
 * Llamar UNA SOLA VEZ desde el browser cuando esté desplegado en Vercel.
 * ELIMINAR este archivo después de usarlo.
 *
 * Protegido: solo funciona si el usuario está autenticado.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } from "@aws-sdk/client-s3";

export async function GET(_req: NextRequest): Promise<NextResponse> {
  // Solo usuarios autenticados pueden ejecutar esto
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const accountId       = process.env.CLOUDFLARE_ACCOUNT_ID!;
  const bucketName      = process.env.R2_BUCKET_NAME!;
  const accessKeyId     = process.env.R2_ACCESS_KEY_ID!;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!;

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

  try {
    await r2.send(new PutBucketCorsCommand({
      Bucket: bucketName,
      CORSConfiguration: corsConfig,
    }));

    const result = await r2.send(new GetBucketCorsCommand({ Bucket: bucketName }));

    return NextResponse.json({
      ok: true,
      message: "CORS configurado correctamente. Ya puedes eliminar este endpoint.",
      corsRules: result.CORSRules,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
