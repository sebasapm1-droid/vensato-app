"use client";

import { useEffect } from "react";
import { useVensatoData } from "@/lib/hooks/useVensatoData";

/**
 * Client-side wrapper that lives inside the authenticated layout.
 * It loads all Supabase data once into the Zustand store.
 */
export function DataProvider({ children }: { children: React.ReactNode }) {
  useVensatoData();
  return <>{children}</>;
}
