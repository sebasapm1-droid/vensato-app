"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store/app-store";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus, MoreHorizontal, Mail, Phone, X, Trash2, Upload, FileText, Loader2, Pencil } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useDocumentos, type Documento } from "@/hooks/useDocumentos";

const DOC_TYPES = [
  { key: "cedula", label: "Cédula de Ciudadanía" },
  { key: "extractos", label: "Extractos Bancarios" },
  { key: "contrato", label: "Contrato de Arrendamiento" },
  { key: "certificado_laboral", label: "Certificado Laboral" },
  { key: "poliza", label: "Póliza de Arrendamiento" },
];

export default function InquilinosPage() {
  const { tenants, addTenant, updateTenant, deleteTenant, properties } = useAppStore();
  const { subirDocumento, eliminarDocumento, loading: docLoading } = useDocumentos();
  const [showModal, setShowModal] = useState(false);
  const [editTenant, setEditTenant] = useState<typeof tenants[0] | null>(null);
  const [editForm, setEditForm] = useState({ fullName: "", cedula: "", email: "", phone: "", propertyId: "" });
  const [editSaving, setEditSaving] = useState(false);
  const [docsTenant, setDocsTenant] = useState<typeof tenants[0] | null>(null);
  const [form, setForm] = useState({ fullName: "", cedula: "", email: "", phone: "", propertyId: "", dueDay: "5", startDate: "", contractMonths: "12" });
  const [saving, setSaving] = useState(false);

  // Documentos R2 por inquilino
  const [allDocs, setAllDocs] = useState<Documento[]>([]);
  const [docType, setDocType] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);

  // Cargar todos los documentos una vez
  useState(() => {
    fetch("/api/documentos")
      .then(r => r.json())
      .then((data: Documento[]) => setAllDocs(data))
      .catch(() => {});
  });

  function getTenantDocs(tenantId: string) {
    return allDocs.filter(d => d.r2_key.includes(`/tenant_${tenantId}/`));
  }

  async function handleOpenDocsModal(tenant: typeof tenants[0]) {
    setDocsTenant(tenant);
    setDocType("");
    setDocFile(null);
  }

  async function handleUploadDoc(e: React.FormEvent) {
    e.preventDefault();
    if (!docsTenant || !docType || !docFile) return;
    try {
      const doc = await subirDocumento(docFile, `tenant_${docsTenant.id}`, docType as never);
      setAllDocs(prev => [doc, ...prev]);
      toast.success("Documento cargado.");
      setDocType("");
      setDocFile(null);
    } catch (err) {
      toast.error("Error al cargar.", { description: err instanceof Error ? err.message : undefined });
    }
  }

  async function handleDeleteDoc(doc: Documento) {
    try {
      await eliminarDocumento(doc.id);
      setAllDocs(prev => prev.filter(d => d.id !== doc.id));
      toast.success("Documento eliminado.");
    } catch {
      toast.error("No se pudo eliminar el documento.");
    }
  }

  function openEdit(t: typeof tenants[0]) {
    setEditTenant(t);
    setEditForm({ fullName: t.fullName, cedula: t.cedula, email: t.email, phone: t.phone, propertyId: t.propertyId });
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTenant || !editForm.fullName || !editForm.email) { toast.error("Nombre y correo son obligatorios."); return; }
    setEditSaving(true);
    try {
      await updateTenant(editTenant.id, {
        fullName: editForm.fullName, cedula: editForm.cedula,
        email: editForm.email, phone: editForm.phone,
        propertyId: editForm.propertyId,
        property: properties.find(p => p.id === editForm.propertyId)?.alias ?? "Sin asignar",
      });
      toast.success("Inquilino actualizado.");
      setEditTenant(null);
    } catch {
      toast.error("Error al actualizar el inquilino.");
    } finally {
      setEditSaving(false);
    }
  }

  function openCreate() {
    setForm({ fullName: "", cedula: "", email: "", phone: "", propertyId: "", dueDay: "5", startDate: "", contractMonths: "12" });
    setShowModal(true);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName || !form.email) { toast.error("Nombre y correo son obligatorios."); return; }
    setSaving(true);
    try {
      const property = properties.find(p => p.id === form.propertyId);
      // Usar startDate si se proveyó, sino el mes actual
      const startD = form.startDate ? new Date(form.startDate + "T12:00:00") : new Date();
      const chargeYear = startD.getFullYear();
      const chargeMonth = startD.getMonth() + 1;

      // Auto-generar primer cobro si hay propiedad asignada
      const initialCharge = property ? {
        tenantId: "", tenant: form.fullName, property: property.alias,
        concept: `Arriendo - ${startD.toLocaleDateString("es-CO", { month: "long", year: "numeric" })}`,
        amount: property.currentRent,
        dueDate: `${chargeYear}-${String(chargeMonth).padStart(2, "0")}-${String(form.dueDay).padStart(2, "0")}`,
        status: "pending" as const,
      } : null;

      const contractData = property && form.startDate
        ? { startDate: form.startDate, contractMonths: Number(form.contractMonths) }
        : undefined;

      await addTenant({
        fullName: form.fullName, cedula: form.cedula,
        email: form.email, phone: form.phone,
        propertyId: form.propertyId, property: property?.alias ?? "Sin asignar",
        contractStatus: "active", lastPaymentDate: "—", documents: [],
      }, initialCharge, contractData);

      toast.success(`Inquilino "${form.fullName}" creado.`, {
        description: initialCharge ? `Cobro de ${property?.alias} generado automáticamente.` : undefined,
      });
      setShowModal(false);
      setForm({ fullName: "", cedula: "", email: "", phone: "", propertyId: "", dueDay: "5", startDate: "", contractMonths: "12" });
    } catch {
      toast.error("Error al crear el inquilino. Verifica los datos.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    try {
      await deleteTenant(id);
      toast.success(`Inquilino "${name}" eliminado.`, {
        description: "Sus cobros, contratos y documentos han sido eliminados.",
      });
    } catch {
      toast.error("Error al eliminar el inquilino.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-heading font-bold text-2xl text-vensato-text-main">Inquilinos</h1>
          <p className="text-vensato-text-secondary text-sm mt-1">Directorio de arrendatarios y contactos</p>
        </div>
        <Button onClick={openCreate} className="bg-vensato-brand-primary hover:bg-[#5C7D6E] text-white font-ui flex items-center">
          <UserPlus className="mr-2 h-4 w-4" /> Nuevo Inquilino
        </Button>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-vensato-surface rounded-2xl p-8 w-full max-w-md shadow-2xl border border-vensato-border-subtle max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-heading font-bold text-xl text-vensato-text-main">Nuevo Inquilino</h3>
              <button onClick={() => setShowModal(false)}><X className="h-5 w-5 text-vensato-text-secondary" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-vensato-text-main">Nombre Completo *</label>
                <Input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                  placeholder="Carlos Martínez" className="bg-vensato-base border-vensato-border-subtle h-10" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-vensato-text-main">Cédula / NIT</label>
                <Input value={form.cedula} onChange={e => setForm(f => ({ ...f, cedula: e.target.value }))}
                  placeholder="1020304050" className="bg-vensato-base border-vensato-border-subtle h-10" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-vensato-text-main">Correo Electrónico *</label>
                <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="inquilino@email.com" className="bg-vensato-base border-vensato-border-subtle h-10" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-vensato-text-main">Teléfono / WhatsApp</label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+57 300 000 0000" className="bg-vensato-base border-vensato-border-subtle h-10" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-vensato-text-main">Asignar a Propiedad</label>
                <select value={form.propertyId} onChange={e => setForm(f => ({ ...f, propertyId: e.target.value }))}
                  className="w-full h-10 rounded-md border border-vensato-border-subtle bg-vensato-base px-3 text-sm focus:outline-none focus:ring-2 focus:ring-vensato-brand-primary">
                  <option value="">— Sin asignar —</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.alias} {p.status === "occupied" ? "(Ocupada)" : "(Vacante)"}</option>
                  ))}
                </select>
              </div>
              {form.propertyId && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-vensato-text-main">Inicio del contrato</label>
                      <Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                        className="bg-vensato-base border-vensato-border-subtle h-10" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-vensato-text-main">Duración (meses)</label>
                      <select value={form.contractMonths} onChange={e => setForm(f => ({ ...f, contractMonths: e.target.value }))}
                        className="w-full h-10 rounded-md border border-vensato-border-subtle bg-vensato-base px-3 text-sm focus:outline-none focus:ring-2 focus:ring-vensato-brand-primary">
                        {[6, 12, 18, 24, 36].map(m => <option key={m} value={m}>{m} meses</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-vensato-text-main">Día de cobro (cada mes)</label>
                    <select value={form.dueDay} onChange={e => setForm(f => ({ ...f, dueDay: e.target.value }))}
                      className="w-full h-10 rounded-md border border-vensato-border-subtle bg-vensato-base px-3 text-sm focus:outline-none focus:ring-2 focus:ring-vensato-brand-primary">
                      {[1, 2, 3, 4, 5, 10, 15].map(d => <option key={d} value={d}>Día {d} de cada mes</option>)}
                    </select>
                    <p className="text-xs text-vensato-text-secondary mt-1">Se creará el primer cobro automáticamente al guardar.</p>
                  </div>
                </>
              )}
              <div className="flex space-x-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1 border-vensato-border-subtle">Cancelar</Button>
                <Button type="submit" className="flex-1 bg-vensato-brand-primary hover:bg-[#5C7D6E] text-white">Guardar Inquilino</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-vensato-surface rounded-2xl p-8 w-full max-w-md shadow-2xl border border-vensato-border-subtle max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-heading font-bold text-xl text-vensato-text-main">Editar Inquilino</h3>
              <button onClick={() => setEditTenant(null)}><X className="h-5 w-5 text-vensato-text-secondary" /></button>
            </div>
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-vensato-text-main">Nombre Completo *</label>
                <Input value={editForm.fullName} onChange={e => setEditForm(f => ({ ...f, fullName: e.target.value }))}
                  className="bg-vensato-base border-vensato-border-subtle h-10" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-vensato-text-main">Cédula / NIT</label>
                <Input value={editForm.cedula} onChange={e => setEditForm(f => ({ ...f, cedula: e.target.value }))}
                  className="bg-vensato-base border-vensato-border-subtle h-10" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-vensato-text-main">Correo Electrónico *</label>
                <Input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                  className="bg-vensato-base border-vensato-border-subtle h-10" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-vensato-text-main">Teléfono / WhatsApp</label>
                <Input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+57 300 000 0000" className="bg-vensato-base border-vensato-border-subtle h-10" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-vensato-text-main">Propiedad asignada</label>
                <select value={editForm.propertyId} onChange={e => setEditForm(f => ({ ...f, propertyId: e.target.value }))}
                  className="w-full h-10 rounded-md border border-vensato-border-subtle bg-vensato-base px-3 text-sm focus:outline-none focus:ring-2 focus:ring-vensato-brand-primary">
                  <option value="">— Sin asignar —</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.alias} {p.status === "occupied" ? "(Ocupada)" : "(Vacante)"}</option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setEditTenant(null)} className="flex-1 border-vensato-border-subtle">Cancelar</Button>
                <Button type="submit" disabled={editSaving} className="flex-1 bg-vensato-brand-primary hover:bg-[#5C7D6E] text-white">
                  {editSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Guardando…</> : "Guardar cambios"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Documents Modal */}
      {docsTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-vensato-surface rounded-2xl p-8 w-full max-w-md shadow-2xl border border-vensato-border-subtle max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-heading font-bold text-xl text-vensato-text-main">Documentos</h3>
                <p className="text-sm text-vensato-text-secondary">{docsTenant.fullName}</p>
              </div>
              <button onClick={() => setDocsTenant(null)}><X className="h-5 w-5 text-vensato-text-secondary" /></button>
            </div>

            {/* Lista de documentos */}
            <div className="space-y-2 mb-6">
              {getTenantDocs(docsTenant.id).length === 0
                ? <p className="text-sm text-vensato-text-secondary italic">Sin documentos cargados.</p>
                : getTenantDocs(docsTenant.id).map(doc => (
                    <div key={doc.id} className="flex items-center gap-2 p-2.5 rounded-lg border border-vensato-border-subtle bg-vensato-base group">
                      <FileText className="h-4 w-4 text-vensato-text-secondary shrink-0" />
                      <span className="text-sm text-vensato-text-main flex-1 truncate">{doc.nombre_original}</span>
                      <span className="text-xs text-vensato-text-secondary">{doc.tipo}</span>
                      <button
                        onClick={() => handleDeleteDoc(doc)}
                        disabled={docLoading}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
              }
            </div>

            {/* Subir nuevo documento */}
            <form onSubmit={handleUploadDoc} className="space-y-3 border-t border-vensato-border-subtle pt-4">
              <p className="text-xs font-semibold text-vensato-text-secondary uppercase tracking-wider">Subir nuevo documento</p>
              <select
                value={docType}
                onChange={e => setDocType(e.target.value)}
                required
                className="w-full h-10 rounded-md border border-vensato-border-subtle bg-vensato-base px-3 text-sm focus:outline-none focus:ring-2 focus:ring-vensato-brand-primary"
              >
                <option value="">— Tipo de documento —</option>
                {DOC_TYPES.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
              </select>
              <label className="flex items-center gap-2 p-3 border border-dashed border-vensato-border-subtle rounded-lg cursor-pointer hover:border-vensato-brand-primary/50 transition-colors bg-vensato-base">
                <Upload className="h-4 w-4 text-vensato-brand-primary shrink-0" />
                <span className="text-sm text-vensato-text-secondary truncate">
                  {docFile ? docFile.name : "Seleccionar archivo (PDF)"}
                </span>
                <input type="file" accept=".pdf,.jpg,.png" className="hidden" onChange={e => setDocFile(e.target.files?.[0] ?? null)} />
              </label>
              <Button type="submit" disabled={docLoading || !docFile || !docType} className="w-full bg-vensato-brand-primary hover:bg-[#5C7D6E] text-white">
                {docLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Subiendo…</> : "Subir Documento"}
              </Button>
            </form>
          </div>
        </div>
      )}

      <Card className="rounded-xl shadow-sm border-vensato-border-subtle bg-vensato-surface overflow-hidden">
        <Table>
          <TableHeader className="bg-vensato-base border-b border-vensato-border-subtle">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-medium text-vensato-text-secondary h-12">Nombre y Contacto</TableHead>
              <TableHead className="font-medium text-vensato-text-secondary hidden md:table-cell h-12">Cédula</TableHead>
              <TableHead className="font-medium text-vensato-text-secondary h-12">Propiedad</TableHead>
              <TableHead className="font-medium text-vensato-text-secondary hidden md:table-cell h-12">Estado</TableHead>
              <TableHead className="font-medium text-vensato-text-secondary hidden lg:table-cell h-12">Documentos</TableHead>
              <TableHead className="w-[50px] h-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-12 text-vensato-text-secondary">No hay inquilinos registrados.</TableCell></TableRow>
            ) : tenants.map((t) => (
              <TableRow key={t.id} className="hover:bg-vensato-base/50 transition-colors border-vensato-border-subtle">
                <TableCell className="py-4">
                  <div className="font-medium text-vensato-text-main">{t.fullName}</div>
                  <div className="flex items-center space-x-3 mt-1 text-xs text-vensato-text-secondary">
                    <span className="flex items-center"><Mail className="w-3 h-3 mr-1" />{t.email}</span>
                    {t.phone && <span className="flex items-center"><Phone className="w-3 h-3 mr-1" />{t.phone}</span>}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell py-4 text-vensato-text-secondary tabular-nums">{t.cedula || "—"}</TableCell>
                <TableCell className="py-4 text-vensato-text-main font-medium">{t.property}</TableCell>
                <TableCell className="hidden md:table-cell py-4">
                  {t.contractStatus === "active"
                    ? <Badge variant="outline" className="bg-vensato-success/10 text-vensato-success border-vensato-success/20">Activo</Badge>
                    : <Badge variant="outline" className="bg-vensato-warning/10 text-vensato-warning border-vensato-warning/20">Por Vencer</Badge>
                  }
                </TableCell>
                <TableCell className="hidden lg:table-cell py-4">
                  <button onClick={() => handleOpenDocsModal(t)}
                    className="flex items-center space-x-1 text-xs font-semibold text-vensato-brand-primary hover:underline">
                    <FileText className="h-3.5 w-3.5" />
                    <span>{getTenantDocs(t.id).length} doc{getTenantDocs(t.id).length !== 1 ? "s" : ""}</span>
                  </button>
                </TableCell>
                <TableCell className="py-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-full text-vensato-text-secondary hover:text-vensato-text-main hover:bg-vensato-border-subtle/50 transition-colors">
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="bottom" align="end" className="min-w-[180px]">
                      <DropdownMenuItem onClick={() => openEdit(t)}>
                        <Pencil className="h-4 w-4" /> Editar inquilino
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleOpenDocsModal(t)}>
                        <Upload className="h-4 w-4" /> Gestionar docs
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onClick={() => handleDelete(t.id, t.fullName)}>
                        <Trash2 className="h-4 w-4" /> Eliminar inquilino
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
