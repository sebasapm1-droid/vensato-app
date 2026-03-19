"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store/app-store";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus, MoreHorizontal, Mail, Phone, X, Trash2, Upload, FileText, Check } from "lucide-react";
import { toast } from "sonner";

const DOC_TYPES = [
  { key: "cedula", label: "Cédula de Ciudadanía" },
  { key: "extractos", label: "Extractos Bancarios" },
  { key: "contrato", label: "Contrato de Arrendamiento" },
  { key: "certificado_laboral", label: "Certificado Laboral" },
  { key: "poliza", label: "Póliza de Arrendamiento" },
];

export default function InquilinosPage() {
  const { tenants, addTenant, deleteTenant, addTenantDocument, removeTenantDocument, properties, charges } = useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [docsTenant, setDocsTenant] = useState<typeof tenants[0] | null>(null);
  const [form, setForm] = useState({ fullName: "", cedula: "", email: "", phone: "", propertyId: "", dueDay: "5" });
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setForm({ fullName: "", cedula: "", email: "", phone: "", propertyId: "", dueDay: "5" });
    setShowModal(true);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName || !form.email) { toast.error("Nombre y correo son obligatorios."); return; }
    setSaving(true);
    try {
      const property = properties.find(p => p.id === form.propertyId);
      const dueDate = `Día ${form.dueDay} de cada mes`;

      // Auto-generate first monthly charge if property assigned
      const initialCharge = property ? {
        tenantId: "", tenant: form.fullName, property: property.alias,
        concept: `Arriendo - ${new Date().toLocaleDateString("es-CO", { month: "long", year: "numeric" })}`,
        amount: property.currentRent,
        dueDate: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(form.dueDay).padStart(2, "0")}`,
        status: "pending" as const,
      } : null;

      await addTenant({
        fullName: form.fullName, cedula: form.cedula,
        email: form.email, phone: form.phone,
        propertyId: form.propertyId, property: property?.alias ?? "Sin asignar",
        contractStatus: "active", lastPaymentDate: "—", documents: [],
      }, initialCharge);

      toast.success(`Inquilino "${form.fullName}" creado.`, {
        description: initialCharge ? `Cobro de ${property?.alias} generado automáticamente.` : undefined,
      });
      setShowModal(false);
      setForm({ fullName: "", cedula: "", email: "", phone: "", propertyId: "", dueDay: "5" });
    } catch {
      toast.error("Error al crear el inquilino. Verifica los datos.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    setMenuOpen(null);
    try {
      await deleteTenant(id);
      toast.success(`Inquilino "${name}" eliminado.`, {
        description: "Sus cobros, contratos y documentos han sido eliminados.",
      });
    } catch {
      toast.error("Error al eliminar el inquilino.");
    }
  }

  function handleAddDoc(tenantId: string, docKey: string, fileName = "") {
    addTenantDocument(tenantId, docKey);
    const docLabel = DOC_TYPES.find(d => d.key === docKey)?.label ?? docKey;
    // Also add to vault
    const tenant = tenants.find(t => t.id === tenantId);
    toast.success(`"${docLabel}" cargado.`);
  }

  function handleRemoveDoc(tenantId: string, docKey: string) {
    removeTenantDocument(tenantId, docKey);
    toast.success("Documento eliminado.");
  }

  return (
    <div className="space-y-6" onClick={() => setMenuOpen(null)}>
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
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-vensato-text-main">Día de cobro (cada mes)</label>
                  <select value={form.dueDay} onChange={e => setForm(f => ({ ...f, dueDay: e.target.value }))}
                    className="w-full h-10 rounded-md border border-vensato-border-subtle bg-vensato-base px-3 text-sm focus:outline-none focus:ring-2 focus:ring-vensato-brand-primary">
                    {[1, 2, 3, 4, 5, 10, 15].map(d => <option key={d} value={d}>Día {d} de cada mes</option>)}
                  </select>
                  <p className="text-xs text-vensato-text-secondary mt-1">Se creará automáticamente el primer cobro del mes actual.</p>
                </div>
              )}
              <div className="flex space-x-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1 border-vensato-border-subtle">Cancelar</Button>
                <Button type="submit" className="flex-1 bg-vensato-brand-primary hover:bg-[#5C7D6E] text-white">Guardar Inquilino</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Documents Modal */}
      {docsTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-vensato-surface rounded-2xl p-8 w-full max-w-md shadow-2xl border border-vensato-border-subtle">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-heading font-bold text-xl text-vensato-text-main">Gestionar Documentos</h3>
                <p className="text-sm text-vensato-text-secondary">{docsTenant.fullName}</p>
              </div>
              <button onClick={() => setDocsTenant(null)}><X className="h-5 w-5 text-vensato-text-secondary" /></button>
            </div>
            <div className="space-y-2">
              {DOC_TYPES.map(doc => {
                const current = tenants.find(t => t.id === docsTenant.id);
                const uploaded = current?.documents.includes(doc.key);
                return (
                  <div key={doc.key} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${uploaded ? "border-vensato-success/30 bg-vensato-success/5" : "border-vensato-border-subtle bg-vensato-base"}`}>
                    <span className="flex items-center space-x-2 text-sm text-vensato-text-main">
                      <FileText className={`h-4 w-4 ${uploaded ? "text-vensato-success" : "text-vensato-text-secondary"}`} />
                      <span>{doc.label}</span>
                    </span>
                    <div className="flex items-center space-x-1">
                      {uploaded ? (
                        <>
                          <span className="text-xs font-semibold text-vensato-success mr-2 flex items-center"><Check className="h-3 w-3 mr-0.5" /> Cargado</span>
                          <button onClick={() => handleRemoveDoc(docsTenant.id, doc.key)}
                            className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors" title="Eliminar documento">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      ) : (
                        <label className="cursor-pointer flex items-center space-x-1 text-xs text-vensato-brand-primary font-semibold hover:underline">
                          <Upload className="h-3.5 w-3.5" /><span>Subir</span>
                          <input type="file" accept=".pdf,.jpg,.png" className="hidden"
                            onChange={() => handleAddDoc(docsTenant.id, doc.key)} />
                        </label>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <Button onClick={() => setDocsTenant(null)} className="w-full mt-6 bg-vensato-brand-primary hover:bg-[#5C7D6E] text-white">Cerrar</Button>
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
                  <button onClick={() => setDocsTenant(t)}
                    className="flex items-center space-x-1 text-xs font-semibold text-vensato-brand-primary hover:underline">
                    <FileText className="h-3.5 w-3.5" /><span>{t.documents.length} doc{t.documents.length !== 1 ? "s" : ""}</span>
                  </button>
                </TableCell>
                <TableCell className="py-4 relative">
                  <Button variant="ghost" size="icon"
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === t.id ? null : t.id); }}
                    className="text-vensato-text-secondary hover:text-vensato-text-main rounded-full h-8 w-8 hover:bg-vensato-border-subtle/50">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                  {menuOpen === t.id && (
                    <div className="absolute right-8 top-3 z-20 bg-vensato-surface rounded-xl shadow-lg border border-vensato-border-subtle py-1 min-w-[170px]" onClick={e => e.stopPropagation()}>
                      <button onClick={() => { setMenuOpen(null); setDocsTenant(t); }}
                        className="w-full flex items-center px-4 py-2.5 text-sm text-vensato-text-main hover:bg-vensato-base transition-colors space-x-2">
                        <Upload className="h-4 w-4 text-vensato-text-secondary" /><span>Gestionar docs</span>
                      </button>
                      <button onClick={() => handleDelete(t.id, t.fullName)}
                        className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors space-x-2">
                        <Trash2 className="h-4 w-4" /><span>Eliminar inquilino</span>
                      </button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
