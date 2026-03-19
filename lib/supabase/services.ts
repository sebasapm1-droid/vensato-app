/**
 * Supabase service functions for all app entities.
 * All functions use the browser client and handle errors gracefully.
 */
import { createClient } from "@/lib/supabase/client";

// ─── Profile ──────────────────────────────────────────────────────────────────
export async function getProfile() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb.from("profiles").select("*").eq("id", user.id).single();
  return data;
}

export async function upsertProfile(profile: {
  full_name?: string; email?: string; phone?: string; cedula?: string;
  bank_name?: string; bank_account_type?: string; bank_account_number?: string; bank_account_holder?: string;
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
  const { data, error } = await sb.from("properties").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createProperty(property: Record<string, any>) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data, error } = await sb.from("properties").insert({ ...property, user_id: user.id }).select().single();
  if (error) throw error;
  return data;
}

export async function updateProperty(id: string, property: Record<string, any>) {
  const sb = createClient();
  const { data, error } = await sb.from("properties").update(property).eq("id", id).select().single();
  if (error) throw error;
  return data;
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
    .select("*, properties(alias)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createTenant(tenant: Record<string, any>) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data, error } = await sb.from("tenants").insert({ ...tenant, user_id: user.id }).select("*, properties(alias)").single();
  if (error) throw error;
  return data;
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
    .select("*, tenants(full_name), properties(alias)")
    .order("due_date", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createCharge(charge: Record<string, any>) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data, error } = await sb.from("charges").insert({ ...charge, user_id: user.id }).select().single();
  if (error) throw error;
  return data;
}

export async function updateChargeStatus(id: string, status: string) {
  const sb = createClient();
  const { data, error } = await sb.from("charges").update({ status }).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

// ─── Contracts ────────────────────────────────────────────────────────────────
export async function getContracts() {
  const sb = createClient();
  const { data, error } = await sb
    .from("contracts")
    .select("*, tenants(full_name, cedula), properties(alias)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createContract(contract: Record<string, any>) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data, error } = await sb.from("contracts").insert({ ...contract, user_id: user.id }).select().single();
  if (error) throw error;
  return data;
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
  return data ?? [];
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
  return data;
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
