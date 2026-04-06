/**
 * useVensatoData - loads app data from Supabase and fills the Zustand store.
 */
"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store/app-store";
import {
  getProperties,
  getTenants,
  getCharges,
  getContracts,
  getProfile,
} from "@/lib/supabase/services";

const REFRESH_EVENT = "vensato-data-refresh";

function dbPropertyToStore(p: any) {
  const additionalContacts = Array.isArray(p.additional_contacts)
    ? p.additional_contacts
        .filter((contact: unknown) => typeof contact === "object" && contact !== null)
        .map((contact: Record<string, unknown>, index: number) => ({
          id:
            typeof contact.id === "string" && contact.id
              ? contact.id
              : `contact-${p.id}-${index}`,
          label: typeof contact.label === "string" ? contact.label : "",
          name: typeof contact.name === "string" ? contact.name : "",
          phone: typeof contact.phone === "string" ? contact.phone : "",
          email: typeof contact.email === "string" ? contact.email : "",
        }))
    : [];

  return {
    id: p.id,
    alias: p.alias,
    type: p.type ?? "Apartamento",
    city: p.city ?? "",
    neighborhood: p.neighborhood ?? "",
    address: p.address ?? "",
    areaMt2: p.area_m2 ?? 0,
    bedrooms: p.bedrooms ?? 0,
    bathrooms: p.bathrooms ?? 0,
    estrato: p.estrato ?? 0,
    purchasePrice: p.commercial_value ?? 0,
    currentRent: p.current_rent ?? 0,
    adminFee: p.admin_fee ?? 0,
    predialAnnual: p.predial_annual ?? 0,
    notes: p.notes ?? "",
    status: p.status ?? "vacant",
    tenant: null,
    additionalContacts,
    capRate:
      p.commercial_value && p.current_rent
        ? Number(
            (
              (((p.current_rent * 12 - (p.admin_fee ?? 0) * 12 - (p.predial_annual ?? 0)) /
                p.commercial_value) *
                100)
            ).toFixed(1)
          )
        : 0,
  };
}

function dbTenantToStore(t: any) {
  return {
    id: t.id,
    fullName: t.full_name,
    cedula: t.cedula ?? "",
    email: t.email ?? "",
    phone: t.phone ?? "",
    propertyId: t.property_id ?? "",
    property: t.properties?.alias ?? "Sin asignar",
    contractStatus: "active" as const,
    lastPaymentDate: "-",
    documents: [],
  };
}

function dbChargeToStore(c: any) {
  return {
    id: c.id,
    tenantId: c.tenant_id ?? "",
    tenant: c.tenants?.full_name ?? "-",
    property: c.properties?.alias ?? "-",
    concept: c.concept,
    amount: c.amount,
    dueDate: c.due_date,
    status: c.status as "pending" | "paid" | "overdue",
  };
}

function dbContractToStore(c: any) {
  return {
    id: c.id,
    propertyId: c.property_id ?? "",
    tenantId: c.tenant_id ?? "",
    property: c.properties?.alias ?? "-",
    tenant: c.tenants?.full_name ?? "-",
    cedula: c.tenants?.cedula ?? "",
    startDate: c.start_date,
    endDate: c.end_date ?? "",
    vigencyMonths: c.duration_months ?? 12,
    rentAmount: c.current_rent ?? 0,
    incrementType: c.increment_type ?? "IPC (Ley 820/2003)",
    status: c.status as "active" | "expired",
    generatedAt: c.created_at,
    savedToVault: true,
  };
}

function dbProfileToStore(p: any) {
  return {
    fullName: p.full_name ?? "",
    email: p.email ?? "",
    phone: p.phone ?? "",
    nit: p.cedula ?? "",
    bankName: p.bank_name ?? "",
    accountType: p.bank_account_type ?? "Ahorros",
    accountNumber: p.bank_account_number ?? "",
    accountHolder: p.bank_account_holder ?? "",
    bankAccountKey: p.bank_account_key ?? "",
  };
}

export function useVensatoData(userId: string) {
  const store = useAppStore();
  const loaded = useRef(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) {
      store.setLoading(true);
    }
    try {
      const [props, tenants, charges, contracts, profile] = await Promise.all([
        getProperties(),
        getTenants(),
        getCharges(),
        getContracts(),
        getProfile(userId),
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
      if (!silent) {
        store.setLoading(false);
      }
    }
  }, [store, userId]);

  useEffect(() => {
    if (loaded.current) {
      return;
    }

    loaded.current = true;
    void load();
  }, [load]);

  useEffect(() => {
    function handleRefresh() {
      void load(true);
    }

    window.addEventListener(REFRESH_EVENT, handleRefresh);
    return () => {
      window.removeEventListener(REFRESH_EVENT, handleRefresh);
    };
  }, [load]);
}

export {
  dbPropertyToStore,
  dbTenantToStore,
  dbChargeToStore,
  dbContractToStore,
  dbProfileToStore,
};
