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
   * Sube un archivo al servidor, que lo guarda en R2 vía Cloudflare API.
   * El archivo pasa por Next.js → Cloudflare API → R2.
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
        const formData = new FormData();
        formData.append("file", archivo);
        formData.append("propiedadId", propiedadId);
        formData.append("tipo", tipo);

        const res = await fetch("/api/documentos/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const { error: apiError } = await res.json() as { error: string };
          throw new Error(apiError ?? "Error subiendo documento");
        }

        return await res.json() as Documento;
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
   * Retorna la URL del endpoint de descarga (autenticado).
   * El browser abrirá la ruta que hace streaming del archivo desde R2.
   */
  const obtenerUrlDescarga = useCallback(
    async (documentoId: string): Promise<string> => {
      return `/api/documentos/${documentoId}/download`;
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
