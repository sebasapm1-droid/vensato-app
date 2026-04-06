import { create } from "zustand";
import * as svc from "@/lib/supabase/services";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Property {
  id: string; alias: string; type: string; city: string; neighborhood: string;
  address: string; areaMt2: number; bedrooms: number; bathrooms: number; estrato: number;
  purchasePrice: number; currentRent: number; adminFee: number; predialAnnual: number;
  capRate: number; status: "occupied" | "vacant"; tenant: string | null; notes: string;
}

export interface Tenant {
  id: string; fullName: string; cedula: string; email: string; phone: string;
  propertyId: string; property: string; contractStatus: string;
  lastPaymentDate: string; documents: string[];
}

export type ChargeStatus = "pending" | "paid" | "overdue";
export interface Charge {
  id: string; tenantId: string; tenant: string; property: string;
  concept: string; amount: number; dueDate: string; status: ChargeStatus;
}

export interface Contract {
  id: string; propertyId: string; tenantId: string;
  property: string; tenant: string; cedula: string;
  startDate: string; endDate: string; vigencyMonths: number;
  rentAmount: number; incrementType: string; status: string;
  generatedAt: string; savedToVault: boolean;
}

export interface VaultDocument {
  id: string; name: string; type: string;
  propertyId: string; property: string;
  tenantId?: string; tenant?: string;
  category: "property" | "tenant";
  uploadedAt: string; size: string; fileUrl?: string;
}

export interface UserConfig {
  fullName: string; email: string; phone: string; nit: string;
  bankName: string; accountType: string; accountNumber: string;
  accountHolder: string; bankAccountKey?: string;
}

// ─── Store Interface ───────────────────────────────────────────────────────────
interface AppStore {
  isLoading: boolean;
  properties: Property[];
  tenants: Tenant[];
  charges: Charge[];
  contracts: Contract[];
  vaultDocuments: VaultDocument[];
  userConfig: UserConfig;
  profileRaw: Record<string, any> | null; // cached raw profile for usePlan

  setAll: (data: Partial<Pick<AppStore, "properties" | "tenants" | "charges" | "contracts" | "vaultDocuments" | "userConfig" | "profileRaw">>) => void;
  setLoading: (v: boolean) => void;

  // Properties
  addProperty: (p: Omit<Property, "id">) => Promise<Property>;
  updateProperty: (id: string, p: Partial<Property>) => Promise<void>;
  deleteProperty: (id: string) => Promise<void>;

  // Tenants
  addTenant: (
    t: Omit<Tenant, "id">,
    initialCharge?: Omit<Charge, "id"> | null,
    contractData?: { startDate: string; contractMonths: number }
  ) => Promise<Tenant>;
  updateTenant: (id: string, data: Partial<Pick<Tenant, "fullName" | "cedula" | "email" | "phone" | "propertyId" | "property">>) => Promise<void>;
  deleteTenant: (id: string) => Promise<void>;
  addTenantDocument: (tenantId: string, docKey: string) => void;
  removeTenantDocument: (tenantId: string, docKey: string, docId?: string) => Promise<void>;

  // Charges
  addCharge: (c: Omit<Charge, "id">) => Promise<Charge>;
  updateChargeStatus: (id: string, status: ChargeStatus) => Promise<void>;
  deleteCharge: (id: string) => Promise<void>;

  // Contracts
  addContract: (c: Omit<Contract, "id">) => Promise<Contract>;
  deleteContract: (id: string) => Promise<void>;

  // Vault
  uploadVaultDocument: (params: { file: File; propertyId: string; tenantId?: string; type: string; name: string }) => Promise<VaultDocument>;
  addVaultDocument: (d: Omit<VaultDocument, "id">) => void;
  removeVaultDocument: (id: string, fileUrl?: string) => Promise<void>;

  // Config
  updateUserConfig: (config: Partial<UserConfig>) => Promise<void>;
}

// Cap rate neto: (canon*12 - admin*12 - predial) / precio_compra
function capRate(rent: number, price: number, adminFee = 0, predialAnnual = 0) {
  if (!price) return 0;
  const noi = rent * 12 - adminFee * 12 - predialAnnual;
  return Number(((noi / price) * 100).toFixed(1));
}

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split("T")[0];
}

// ─── Store ────────────────────────────────────────────────────────────────────
export const useAppStore = create<AppStore>((set, get) => ({
  isLoading: true,
  properties: [],
  tenants: [],
  charges: [],
  contracts: [],
  vaultDocuments: [],
  profileRaw: null,
  userConfig: {
    fullName: "", email: "", phone: "", nit: "",
    bankName: "", accountType: "Ahorros", accountNumber: "", accountHolder: "",
  },

  setAll: (data) => set(s => ({ ...s, ...data })),
  setLoading: (v) => set({ isLoading: v }),

  // ── Properties ──
  addProperty: async (p) => {
    const dbRow = await svc.createProperty({
      alias: p.alias, type: p.type, city: p.city, neighborhood: p.neighborhood,
      address: p.address, area_m2: p.areaMt2, bedrooms: p.bedrooms, bathrooms: p.bathrooms,
      estrato: p.estrato, commercial_value: p.purchasePrice, current_rent: p.currentRent,
      admin_fee: p.adminFee, predial_annual: p.predialAnnual, notes: p.notes, status: p.status,
    });
    const prop: Property = {
      ...p, id: dbRow.id,
      capRate: capRate(p.currentRent, p.purchasePrice, p.adminFee, p.predialAnnual),
    };
    set(s => ({ properties: [prop, ...s.properties] }));
    return prop;
  },

  updateProperty: async (id, data) => {
    const dbData: Record<string, any> = {};
    if (data.alias !== undefined) dbData.alias = data.alias;
    if (data.type !== undefined) dbData.type = data.type;
    if (data.city !== undefined) dbData.city = data.city;
    if (data.neighborhood !== undefined) dbData.neighborhood = data.neighborhood;
    if (data.address !== undefined) dbData.address = data.address;
    if (data.areaMt2 !== undefined) dbData.area_m2 = data.areaMt2;
    if (data.bedrooms !== undefined) dbData.bedrooms = data.bedrooms;
    if (data.bathrooms !== undefined) dbData.bathrooms = data.bathrooms;
    if (data.estrato !== undefined) dbData.estrato = data.estrato;
    if (data.purchasePrice !== undefined) dbData.commercial_value = data.purchasePrice;
    if (data.currentRent !== undefined) dbData.current_rent = data.currentRent;
    if (data.adminFee !== undefined) dbData.admin_fee = data.adminFee;
    if (data.predialAnnual !== undefined) dbData.predial_annual = data.predialAnnual;
    if (data.notes !== undefined) dbData.notes = data.notes;
    if (data.status !== undefined) dbData.status = data.status;
    await svc.updateProperty(id, dbData);
    set(s => ({
      properties: s.properties.map(p => {
        if (p.id !== id) return p;
        const updated = { ...p, ...data };
        return { ...updated, capRate: capRate(updated.currentRent, updated.purchasePrice, updated.adminFee, updated.predialAnnual) };
      })
    }));
  },

  deleteProperty: async (id) => {
    await svc.deleteProperty(id);
    set(s => ({
      properties: s.properties.filter(p => p.id !== id),
      tenants: s.tenants.filter(t => t.propertyId !== id),
      charges: s.charges.filter(c => c.tenantId !== s.tenants.find(t => t.propertyId === id)?.id),
      vaultDocuments: s.vaultDocuments.filter(d => d.propertyId !== id),
    }));
  },

  // ── Tenants ──
  addTenant: async (t, initialCharge, contractData) => {
    const dbRow = await svc.createTenant({
      property_id: t.propertyId || null,
      full_name: t.fullName, cedula: t.cedula, email: t.email, phone: t.phone,
    });
    const tenant: Tenant = { ...t, id: dbRow.id };
    let chargeToAdd: Charge | null = null;
    let contractToAdd: Contract | null = null;

    if (initialCharge) {
      const chargeRow = await svc.createCharge({
        property_id: t.propertyId || null,
        tenant_id: dbRow.id,
        concept: initialCharge.concept,
        amount: initialCharge.amount,
        due_date: initialCharge.dueDate,
        status: "pending",
      });
      chargeToAdd = {
        id: chargeRow.id, tenantId: dbRow.id,
        tenant: t.fullName, property: t.property,
        concept: initialCharge.concept, amount: initialCharge.amount,
        dueDate: initialCharge.dueDate, status: "pending",
      };
    }

    // Auto-crear contrato si se proveen fechas
    if (t.propertyId && contractData?.startDate && contractData?.contractMonths) {
      const property = get().properties.find(p => p.id === t.propertyId);
      const endDate = addMonths(contractData.startDate, contractData.contractMonths);
      const contractRow = await svc.createContract({
        property_id: t.propertyId,
        tenant_id: dbRow.id,
        start_date: contractData.startDate,
        end_date: endDate,
        duration_months: contractData.contractMonths,
        initial_rent: property?.currentRent ?? 0,
        current_rent: property?.currentRent ?? 0,
        increment_type: "ipc",
        status: "active",
      });
      contractToAdd = {
        id: contractRow.id, propertyId: t.propertyId, tenantId: dbRow.id,
        property: property?.alias ?? t.property, tenant: t.fullName, cedula: t.cedula,
        startDate: contractData.startDate, endDate, vigencyMonths: contractData.contractMonths,
        rentAmount: property?.currentRent ?? 0, incrementType: "IPC (Ley 820/2003)",
        status: "active", generatedAt: new Date().toISOString().split("T")[0], savedToVault: false,
      };
    }

    // Marcar propiedad como ocupada
    if (t.propertyId) {
      await svc.updateProperty(t.propertyId, { status: "occupied" });
    }

    set(s => ({
      tenants: [tenant, ...s.tenants],
      charges: chargeToAdd ? [chargeToAdd, ...s.charges] : s.charges,
      contracts: contractToAdd ? [contractToAdd, ...s.contracts] : s.contracts,
      properties: t.propertyId
        ? s.properties.map(p => p.id === t.propertyId ? { ...p, status: "occupied" as const } : p)
        : s.properties,
    }));
    return tenant;
  },

  updateTenant: async (id, data) => {
    const dbData: Record<string, any> = {};
    if (data.fullName !== undefined) dbData.full_name = data.fullName;
    if (data.cedula !== undefined) dbData.cedula = data.cedula;
    if (data.email !== undefined) dbData.email = data.email;
    if (data.phone !== undefined) dbData.phone = data.phone;
    if (data.propertyId !== undefined) dbData.property_id = data.propertyId || null;
    await svc.updateTenant(id, dbData);
    set(s => ({
      tenants: s.tenants.map(t => t.id !== id ? t : {
        ...t, ...data,
        property: data.propertyId
          ? (s.properties.find(p => p.id === data.propertyId)?.alias ?? t.property)
          : data.propertyId === "" ? "Sin asignar" : t.property,
      }),
    }));
  },

  deleteTenant: async (id) => {
    const tenant = get().tenants.find(t => t.id === id);
    const propertyId = tenant?.propertyId;

    await svc.deleteTenant(id);

    // Si no quedan más inquilinos en esa propiedad, marcarla como vacante
    let shouldVacate = false;
    if (propertyId) {
      const remaining = get().tenants.filter(t => t.id !== id && t.propertyId === propertyId);
      shouldVacate = remaining.length === 0;
      if (shouldVacate) {
        await svc.updateProperty(propertyId, { status: "vacant" });
      }
    }

    set(s => ({
      tenants: s.tenants.filter(t => t.id !== id),
      charges: s.charges.filter(c => c.tenantId !== id),
      contracts: s.contracts.filter(c => c.tenantId !== id),
      vaultDocuments: s.vaultDocuments.filter(d => d.tenantId !== id),
      properties: shouldVacate && propertyId
        ? s.properties.map(p => p.id === propertyId ? { ...p, status: "vacant" as const } : p)
        : s.properties,
    }));
  },

  addTenantDocument: (tenantId, docKey) => {
    set(s => ({
      tenants: s.tenants.map(t => t.id === tenantId
        ? { ...t, documents: Array.from(new Set([...t.documents, docKey])) } : t)
    }));
  },

  removeTenantDocument: async (tenantId, docKey, docId) => {
    if (docId) {
      const vault = get().vaultDocuments.find(d => d.id === docId);
      await svc.deleteDocument(docId, vault?.fileUrl ?? "");
    }
    set(s => ({
      tenants: s.tenants.map(t => t.id === tenantId
        ? { ...t, documents: t.documents.filter(d => d !== docKey) } : t),
      vaultDocuments: s.vaultDocuments.filter(d => d.id !== docId),
    }));
  },

  // ── Charges ──
  addCharge: async (c) => {
    const tenant = get().tenants.find(t => t.id === c.tenantId);
    const dbRow = await svc.createCharge({
      property_id: tenant?.propertyId || null,
      tenant_id: c.tenantId || null,
      concept: c.concept, amount: c.amount,
      due_date: c.dueDate, status: "pending",
    });
    const charge: Charge = { ...c, id: dbRow.id };
    set(s => ({ charges: [charge, ...s.charges] }));
    return charge;
  },

  updateChargeStatus: async (id, status) => {
    await svc.updateChargeStatus(id, status);
    set(s => ({ charges: s.charges.map(c => c.id === id ? { ...c, status } : c) }));
  },

  deleteCharge: async (id) => {
    await svc.deleteCharge(id);
    set(s => ({ charges: s.charges.filter(c => c.id !== id) }));
  },

  // ── Contracts ──
  addContract: async (c) => {
    const dbRow = await svc.createContract({
      property_id: c.propertyId || null,
      tenant_id: c.tenantId || null,
      start_date: c.startDate, end_date: c.endDate,
      duration_months: c.vigencyMonths,
      initial_rent: c.rentAmount, current_rent: c.rentAmount,
      increment_type: "ipc", status: "active",
    });
    const contract: Contract = { ...c, id: dbRow.id };
    const vaultEntry: VaultDocument = {
      id: `vd_${Date.now()}`, name: `Contrato_${c.tenant.replace(/\s+/g, "_")}.pdf`,
      type: "Contrato", propertyId: c.propertyId, property: c.property,
      tenantId: c.tenantId, tenant: c.tenant, category: "tenant",
      uploadedAt: new Date().toISOString().split("T")[0], size: "~120 KB",
    };
    set(s => ({
      contracts: [contract, ...s.contracts],
      vaultDocuments: [vaultEntry, ...s.vaultDocuments],
    }));
    return contract;
  },

  deleteContract: async (id) => {
    await svc.deleteContract(id);
    set(s => ({ contracts: s.contracts.filter(c => c.id !== id) }));
  },

  // ── Vault ──
  uploadVaultDocument: async (params) => {
    const dbRow = await svc.uploadDocument(params);
    const doc: VaultDocument = {
      id: dbRow.id, name: dbRow.name, type: dbRow.type ?? "",
      propertyId: dbRow.property_id ?? "",
      property: get().properties.find(p => p.id === dbRow.property_id)?.alias ?? "—",
      tenantId: dbRow.tenant_id ?? undefined,
      tenant: get().tenants.find(t => t.id === dbRow.tenant_id)?.fullName ?? undefined,
      category: dbRow.tenant_id ? "tenant" : "property",
      uploadedAt: dbRow.uploaded_at?.split("T")[0] ?? "",
      size: dbRow.file_size ? `${(dbRow.file_size / 1024).toFixed(0)} KB` : "—",
      fileUrl: dbRow.file_url,
    };
    set(s => ({ vaultDocuments: [doc, ...s.vaultDocuments] }));
    return doc;
  },

  addVaultDocument: (d) => set(s => ({
    vaultDocuments: [{ ...d, id: `vd_${Date.now()}` }, ...s.vaultDocuments]
  })),

  removeVaultDocument: async (id, fileUrl) => {
    if (fileUrl && fileUrl.startsWith("http")) {
      await svc.deleteDocument(id, fileUrl);
    }
    set(s => ({ vaultDocuments: s.vaultDocuments.filter(d => d.id !== id) }));
  },

  // ── Config ──
  updateUserConfig: async (profile) => {
    await svc.upsertProfile({
      full_name: profile.fullName, email: profile.email, phone: profile.phone, cedula: profile.nit,
      bank_name: profile.bankName, bank_account_type: profile.accountType,
      bank_account_number: profile.accountNumber, bank_account_holder: profile.accountHolder,
      bank_account_key: profile.bankAccountKey,
    });
    set(s => ({ userConfig: { ...s.userConfig, ...profile } }));
  },
}));
