/**
 * Supabase service functions for all app entities.
 * All functions use the browser client and handle errors gracefully.
 */
import { createClient } from "@/lib/supabase/client";

type PropertyRow = {
  id: string;
  alias: string;
  type: string | null;
  city: string | null;
  neighborhood: string | null;
  address: string | null;
  area_m2: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  estrato: number | null;
  commercial_value: number | null;
  current_rent: number | null;
  admin_fee: number | null;
  predial_annual: number | null;
  additional_contacts: Array<{
    id?: string;
    label?: string;
    name?: string;
    phone?: string;
    email?: string;
  }> | null;
  notes: string | null;
  status: string | null;
};

type TenantRow = {
  id: string;
  full_name: string;
  cedula: string | null;
  email: string | null;
  phone: string | null;
  property_id: string | null;
  properties?: { alias: string | null } | null;
};

type ChargeRow = {
  id: string;
  tenant_id: string | null;
  concept: string;
  amount: number;
  due_date: string;
  status: string | null;
  tenants?: { full_name: string | null } | null;
  properties?: { alias: string | null } | null;
};

type ContractRow = {
  id: string;
  property_id: string | null;
  tenant_id: string | null;
  start_date: string;
  end_date: string | null;
  duration_months: number | null;
  current_rent: number;
  increment_type: string | null;
  status: string | null;
  created_at: string | null;
  tenants?: { full_name: string | null; cedula: string | null } | null;
  properties?: { alias: string | null } | null;
};

type DocumentRow = {
  id: string;
  user_id: string | null;
  property_id: string | null;
  tenant_id: string | null;
  type: string | null;
  name: string;
  file_url: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_at: string | null;
  tenants?: { full_name: string | null } | null;
  properties?: { alias: string | null } | null;
};

// ─── Profile ──────────────────────────────────────────────────────────────────
export async function getProfile(userId?: string) {
  const sb = createClient();
  const id = userId ?? (await sb.auth.getUser()).data.user?.id;
  if (!id) return null;
  const { data } = await sb.from("profiles")
    .select("id,full_name,email,phone,cedula,bank_name,bank_account_type,bank_account_number,bank_account_holder,bank_account_key,tier,subscription_status,subscription_valid_until,wompi_payment_token,pending_tier,pending_tier_since")
    .eq("id", id).single();
  return data;
}

export async function upsertProfile(profile: {
  full_name?: string; email?: string; phone?: string; cedula?: string;
  bank_name?: string; bank_account_type?: string; bank_account_number?: string;
  bank_account_holder?: string; bank_account_key?: string;
}) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await sb.from("profiles").update(profile).eq("id", user.id);
  if (error) throw error;
}

// ─── Properties ───────────────────────────────────────────────────────────────
export async function getProperties() {
  const sb = createClient();
  const { data, error } = await sb.from("properties")
    .select("id,alias,type,city,neighborhood,address,area_m2,bedrooms,bathrooms,estrato,commercial_value,current_rent,admin_fee,predial_annual,additional_contacts,notes,status")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PropertyRow[];
}

export async function createProperty(property: Record<string, unknown>) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data, error } = await sb.from("properties").insert({ ...property, user_id: user.id }).select().single();
  if (error) throw error;
  return data as PropertyRow;
}

export async function updateProperty(id: string, property: Record<string, unknown>) {
  const sb = createClient();
  const { data, error } = await sb.from("properties").update(property).eq("id", id).select().single();
  if (error) throw error;
  return data as PropertyRow;
}

export async function deleteProperty(id: string) {
  const sb = createClient();
  const { error } = await sb.from("properties").delete().eq("id", id);
  if (error) throw error;
}

// ─── Tenants ──────────────────────────────────────────────────────────────────
export async function getTenants() {
  const sb = createClient();
  const { data, error } = await sb
    .from("tenants")
    .select("id,full_name,cedula,email,phone,property_id,properties(alias)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as TenantRow[];
}

export async function createTenant(tenant: Record<string, unknown>) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data, error } = await sb.from("tenants").insert({ ...tenant, user_id: user.id }).select("*, properties(alias)").single();
  if (error) throw error;
  return data as TenantRow;
}

export async function updateTenant(id: string, data: Record<string, unknown>) {
  const sb = createClient();
  const { error } = await sb.from("tenants").update(data).eq("id", id);
  if (error) throw error;
}

export async function deleteTenant(id: string) {
  const sb = createClient();
  const { error } = await sb.from("tenants").delete().eq("id", id);
  if (error) throw error;
}

// ─── Charges ──────────────────────────────────────────────────────────────────
export async function getCharges() {
  const sb = createClient();
  const { data, error } = await sb
    .from("charges")
    .select("id,tenant_id,concept,amount,due_date,status,tenants(full_name),properties(alias)")
    .order("due_date", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ChargeRow[];
}

export async function createCharge(charge: Record<string, unknown>) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data, error } = await sb.from("charges").insert({ ...charge, user_id: user.id }).select().single();
  if (error) throw error;
  return data as ChargeRow;
}

export async function updateChargeStatus(id: string, status: string) {
  const sb = createClient();
  const { data, error } = await sb.from("charges").update({ status }).eq("id", id).select().single();
  if (error) throw error;
  return data as ChargeRow;
}

export async function deleteCharge(id: string) {
  const sb = createClient();
  const { error } = await sb.from("charges").delete().eq("id", id);
  if (error) throw error;
}

// ─── Contracts ────────────────────────────────────────────────────────────────
export async function getContracts() {
  const sb = createClient();
  const { data, error } = await sb
    .from("contracts")
    .select("id,property_id,tenant_id,start_date,end_date,duration_months,current_rent,increment_type,status,created_at,tenants(full_name,cedula),properties(alias)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ContractRow[];
}

export async function createContract(contract: Record<string, unknown>) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data, error } = await sb.from("contracts").insert({ ...contract, user_id: user.id }).select().single();
  if (error) throw error;
  return data as ContractRow;
}

export async function deleteContract(id: string) {
  const sb = createClient();
  const { error } = await sb.from("contracts").delete().eq("id", id);
  if (error) throw error;
}

// ─── Documents ────────────────────────────────────────────────────────────────
export async function getDocuments() {
  const sb = createClient();
  const { data, error } = await sb
    .from("documents")
    .select("*, tenants(full_name), properties(alias)")
    .order("uploaded_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DocumentRow[];
}

export async function uploadDocument(params: {
  file: File;
  propertyId: string;
  tenantId?: string;
  type: string;
  name: string;
}) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Security: only PDFs allowed (matches bucket policy), max 10MB
  if (params.file.type !== "application/pdf") {
    throw new Error("Solo se permiten archivos PDF.");
  }
  if (params.file.size > 10 * 1024 * 1024) {
    throw new Error("El archivo no puede superar 10MB.");
  }


  // Upload to Storage
  const path = tenantFolder(params.tenantId, params.propertyId, params.file.name);
  const { error: storageError } = await sb.storage
    .from("documents")
    .upload(path, params.file, { upsert: true });
  if (storageError) throw storageError;

  const { data: { publicUrl } } = sb.storage.from("documents").getPublicUrl(path);

  // Insert DB record
  const { data, error: dbError } = await sb.from("documents").insert({
    user_id: user.id,
    property_id: params.propertyId,
    tenant_id: params.tenantId ?? null,
    type: params.type,
    name: params.name,
    file_url: publicUrl,
    file_size: params.file.size,
    mime_type: params.file.type,
  }).select().single();

  if (dbError) throw dbError;
  return data as DocumentRow;
}

export async function deleteDocument(id: string, fileUrl: string) {
  const sb = createClient();
  // Delete from Storage
  const url = new URL(fileUrl);
  const storagePath = url.pathname.split("/documents/")[1];
  if (storagePath) {
    await sb.storage.from("documents").remove([storagePath]);
  }
  const { error } = await sb.from("documents").delete().eq("id", id);
  if (error) throw error;
}

function tenantFolder(tenantId: string | undefined, propertyId: string, fileName: string): string {
  const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const ts = Date.now();
  if (tenantId) return `${propertyId}/${tenantId}/${ts}_${sanitized}`;
  return `${propertyId}/${ts}_${sanitized}`;
}
