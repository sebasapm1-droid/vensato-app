"use client";

import { useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TipoDocumento = "contrato" | "foto" | "cedula" | "extracto" | "otro";

export interface Documento {
  id: string;
  user_id: string;
  propiedad_id: string | null;
  tipo: TipoDocumento;
  nombre_original: string;
  r2_key: string;
  tamanio_bytes: number | null;
  created_at: string;
}

interface UploadUrlResponse {
  uploadUrl: string;
  key: string;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseDocumentosReturn {
  loading: boolean;
  error: string | null;
  subirDocumento: (
    archivo: File,
    propiedadId: string,
    tipo: TipoDocumento
  ) => Promise<Documento>;
  obtenerUrlDescarga: (documentoId: string) => Promise<string>;
  eliminarDocumento: (documentoId: string) => Promise<void>;
}

export function useDocumentos(): UseDocumentosReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Sube un archivo a R2 sin pasar por el servidor:
   * 1. Obtiene presigned PUT URL del servidor
   * 2. PUT directo al bucket R2 desde el browser
   * 3. Guarda la metadata en Supabase vía API
   */
  const subirDocumento = useCallback(
    async (
      archivo: File,
      propiedadId: string,
      tipo: TipoDocumento
    ): Promise<Documento> => {
      setLoading(true);
      setError(null);

      try {
        // Paso 1: Obtener presigned URL del servidor
        const urlRes = await fetch("/api/documentos/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            propiedadId,
            tipo,
            nombreArchivo: archivo.name,
            contentType: archivo.type || "application/octet-stream",
          }),
        });

        if (!urlRes.ok) {
          const { error: apiError } = await urlRes.json() as { error: string };
          throw new Error(apiError ?? "Error obteniendo URL de carga");
        }

        const { uploadUrl, key } = await urlRes.json() as UploadUrlResponse;

        // Paso 2: PUT directo a R2 — el archivo NUNCA toca el servidor de Next.js
        let r2Res: Response;
        try {
          r2Res = await fetch(uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": archivo.type || "application/octet-stream" },
            body: archivo,
          });
        } catch (fetchErr) {
          // fetch lanza TypeError cuando CORS bloquea la request
          throw new Error(
            `No se pudo conectar con R2. Verifica que el dominio esté en el CORS del bucket. (${fetchErr instanceof Error ? fetchErr.message : "TypeError"})`
          );
        }

        if (!r2Res.ok) {
          const body = await r2Res.text().catch(() => "");
          throw new Error(
            `R2 rechazó el archivo (HTTP ${r2Res.status}). ${body.slice(0, 200)}`
          );
        }

        // Paso 3: Guardar metadata en Supabase
        const metaRes = await fetch("/api/documentos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            propiedadId,
            tipo,
            nombreOriginal: archivo.name,
            r2Key: key,
            tamanioBytes: archivo.size,
          }),
        });

        if (!metaRes.ok) {
          const { error: apiError } = await metaRes.json() as { error: string };
          throw new Error(apiError ?? "Error guardando metadata del documento");
        }

        const doc = await metaRes.json() as Documento;
        return doc;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error desconocido al subir documento";
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Obtiene una URL temporal de descarga (1 hora) para un documento.
   */
  const obtenerUrlDescarga = useCallback(
    async (documentoId: string): Promise<string> => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/documentos/${documentoId}`);

        if (!res.ok) {
          const { error: apiError } = await res.json() as { error: string };
          throw new Error(apiError ?? "Error obteniendo URL de descarga");
        }

        const { url } = await res.json() as { url: string };
        return url;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error obteniendo URL de descarga";
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Elimina el archivo de R2 y el registro de Supabase.
   */
  const eliminarDocumento = useCallback(
    async (documentoId: string): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/documentos/${documentoId}`, {
          method: "DELETE",
        });

        if (!res.ok && res.status !== 204) {
          const { error: apiError } = await res.json() as { error: string };
          throw new Error(apiError ?? "Error eliminando el documento");
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error eliminando el documento";
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { loading, error, subirDocumento, obtenerUrlDescarga, eliminarDocumento };
}
