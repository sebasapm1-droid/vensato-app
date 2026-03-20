/**
 * useVensatoData — loads all app data from Supabase on mount,
 * populates the Zustand store, and marks the store as "ready".
 *
 * Place <DataProvider> inside your authenticated layout.
 */
"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store/app-store";
import {
  getProperties, getTenants, getCharges, getContracts, getDocuments, getProfile,
} from "@/lib/supabase/services";

function dbPropertyToStore(p: any) {
  return {
    id: p.id, alias: p.alias, type: p.type ?? "Apartamento",
    city: p.city ?? "", neighborhood: p.neighborhood ?? "",
    address: p.address ?? "", areaMt2: p.area_m2 ?? 0,
    bedrooms: p.bedrooms ?? 0, bathrooms: p.bathrooms ?? 0,
    estrato: p.estrato ?? 0, purchasePrice: p.commercial_value ?? 0,
    currentRent: p.current_rent ?? 0, adminFee: p.admin_fee ?? 0,
    predialAnnual: p.predial_annual ?? 0, notes: p.notes ?? "",
    status: p.status ?? "vacant", tenant: null,
    capRate: p.commercial_value && p.current_rent
      ? Number((((p.current_rent * 12 - (p.admin_fee ?? 0) * 12 - (p.predial_annual ?? 0)) / p.commercial_value) * 100).toFixed(1)) : 0,
  };
}

function dbTenantToStore(t: any) {
  return {
    id: t.id, fullName: t.full_name,
    cedula: t.cedula ?? "", email: t.email ?? "", phone: t.phone ?? "",
    propertyId: t.property_id ?? "",
    property: t.properties?.alias ?? "Sin asignar",
    contractStatus: "active" as const, lastPaymentDate: "—", documents: [],
  };
}

function dbChargeToStore(c: any) {
  return {
    id: c.id, tenantId: c.tenant_id ?? "",
    tenant: c.tenants?.full_name ?? "—",
    property: c.properties?.alias ?? "—",
    concept: c.concept, amount: c.amount,
    dueDate: c.due_date, status: c.status as "pending" | "paid" | "overdue",
  };
}

function dbContractToStore(c: any) {
  return {
    id: c.id, propertyId: c.property_id ?? "",
    tenantId: c.tenant_id ?? "",
    property: c.properties?.alias ?? "—",
    tenant: c.tenants?.full_name ?? "—",
    cedula: c.tenants?.cedula ?? "",
    startDate: c.start_date, endDate: c.end_date ?? "",
    vigencyMonths: c.duration_months ?? 12,
    rentAmount: c.current_rent ?? 0,
    incrementType: c.increment_type ?? "IPC (Ley 820/2003)",
    status: c.status as "active" | "expired",
    generatedAt: c.created_at, savedToVault: true,
  };
}

function dbDocToStore(d: any) {
  return {
    id: d.id, name: d.name, type: d.type ?? "",
    propertyId: d.property_id ?? "",
    property: d.properties?.alias ?? "—",
    tenantId: d.tenant_id ?? undefined,
    tenant: d.tenants?.full_name ?? undefined,
    category: d.tenant_id ? "tenant" as const : "property" as const,
    uploadedAt: d.uploaded_at?.split("T")[0] ?? "",
    size: d.file_size ? `${(d.file_size / 1024).toFixed(0)} KB` : "—",
    fileUrl: d.file_url,
  };
}

function dbProfileToStore(p: any) {
  return {
    fullName: p.full_name ?? "", email: p.email ?? "",
    phone: p.phone ?? "", nit: p.cedula ?? "",
    bankName: p.bank_name ?? "", accountType: p.bank_account_type ?? "Ahorros",
    accountNumber: p.bank_account_number ?? "",
    accountHolder: p.bank_account_holder ?? "",
    bankAccountKey: p.bank_account_key ?? "",
  };
}

export function useVensatoData() {
  const store = useAppStore();
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    async function load() {
      store.setLoading(true);
      try {
        // Documents are loaded lazily in the vault section — excluded here to speed up initial load
        const [props, tenants, charges, contracts, profile] = await Promise.all([
          getProperties(), getTenants(), getCharges(), getContracts(), getProfile(),
        ]);

        store.setAll({
          properties: props.map(dbPropertyToStore),
          tenants: tenants.map(dbTenantToStore),
          charges: charges.map(dbChargeToStore),
          contracts: contracts.map(dbContractToStore),
          userConfig: profile ? dbProfileToStore(profile) : store.userConfig,
          profileRaw: profile ?? null,
        });
      } catch (err) {
        console.error("[useVensatoData] Failed to load data:", err);
      } finally {
        store.setLoading(false);
      }
    }

    load();
  }, []);
}

export {
  dbPropertyToStore, dbTenantToStore, dbChargeToStore,
  dbContractToStore, dbDocToStore, dbProfileToStore,
};
