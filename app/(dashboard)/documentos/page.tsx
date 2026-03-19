"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store/app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, Folder, FileText, Upload, Trash2, ChevronRight, ChevronDown, X, Home } from "lucide-react";
import { toast } from "sonner";

const PROPERTY_DOC_TYPES = [
  { key: "escritura", label: "Escritura Pública" },
  { key: "certificado_tradicion", label: "Certificado de Tradición y Libertad" },
  { key: "predial", label: "Recibo Predial" },
];

const TENANT_DOC_TYPES = [
  { key: "cedula", label: "Cédula de Ciudadanía" },
  { key: "extractos", label: "Extractos Bancarios" },
  { key: "contrato", label: "Contrato de Arrendamiento" },
  { key: "certificado_laboral", label: "Certificado Laboral" },
  { key: "poliza", label: "Póliza de Arrendamiento" },
];

const DOC_TYPE_ICONS: Record<string, string> = {
  Contrato: "📄", Identificación: "🪪", Escritura: "📜", Matrícula: "📋", Póliza: "🛡️",
};

export default function DocumentosPage() {
  const { properties, tenants, vaultDocuments, uploadVaultDocument, addVaultDocument, removeVaultDocument } = useAppStore();
  const [expandedProps, setExpandedProps] = useState<Set<string>>(new Set());
  const [expandedTenants, setExpandedTenants] = useState<Set<string>>(new Set());
  const [uploadModal, setUploadModal] = useState<{ type: "property" | "tenant"; id: string; name: string } | null>(null);
  const [uploadForm, setUploadForm] = useState({ docType: "", fileName: "", file: null as File | null });
  const [uploading, setUploading] = useState(false);

  const toggleProp = (id: string) => setExpandedProps(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleTenant = (id: string) => setExpandedTenants(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  function getPropertyDocs(propId: string) {
    return vaultDocuments.filter(d => d.propertyId === propId && d.category === "property");
  }
  function getTenantDocs(tenantId: string) {
    return vaultDocuments.filter(d => d.tenantId === tenantId && d.category === "tenant");
  }
  function getPropertyTenants(propId: string) {
    return tenants.filter(t => t.propertyId === propId);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadForm.docType || !uploadModal) { toast.error("Selecciona el tipo de documento."); return; }
    const property = properties.find(p => p.id === (uploadModal.type === "property" ? uploadModal.id : tenants.find(t => t.id === uploadModal.id)?.propertyId));
    const tenant = uploadModal.type === "tenant" ? tenants.find(t => t.id === uploadModal.id) : undefined;
    const docLabel = [...PROPERTY_DOC_TYPES, ...TENANT_DOC_TYPES].find(d => d.key === uploadForm.docType)?.label ?? uploadForm.docType;
    const file = uploadForm.file;

    setUploading(true);
    try {
      if (file) {
        await uploadVaultDocument({
          file, propertyId: property?.id ?? "",
          tenantId: tenant?.id, type: docLabel, name: uploadForm.fileName || file.name,
        });
      } else {
        // Optimistic add without a real file (name-only entry)
        addVaultDocument({
          name: uploadForm.fileName || `${docLabel}.pdf`,
          type: docLabel, propertyId: property?.id ?? "",
          property: property?.alias ?? "—",
          tenantId: tenant?.id, tenant: tenant?.fullName,
          category: uploadModal.type,
          uploadedAt: new Date().toISOString().split("T")[0], size: "—",
        });
      }
      toast.success("Documento cargado en la Bóveda.", { description: `${docLabel} → ${uploadModal.name}` });
      setUploadModal(null);
      setUploadForm({ docType: "", fileName: "", file: null });
    } catch {
      toast.error("Error al cargar el documento. Inténtalo de nuevo.");
    } finally {
      setUploading(false);
    }
  }

  const totalDocs = vaultDocuments.length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-heading font-bold text-2xl text-vensato-text-main">Bóveda Documental</h1>
          <p className="text-vensato-text-secondary text-sm mt-1">
            Explorador de documentos por propiedad e inquilino · <span className="font-semibold">{totalDocs} documentos</span>
          </p>
        </div>
        <Button onClick={() => setUploadModal({ type: "property", id: properties[0]?.id ?? "", name: "Sin Asignar" })}
          className="bg-vensato-brand-primary hover:bg-[#5C7D6E] text-white font-ui flex items-center">
          <Upload className="mr-2 h-4 w-4" /> Cargar Documento
        </Button>
      </div>

      {/* Upload Modal */}
      {uploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-vensato-surface rounded-2xl p-8 w-full max-w-md shadow-2xl border border-vensato-border-subtle">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-heading font-bold text-xl text-vensato-text-main">Cargar Documento</h3>
                <p className="text-sm text-vensato-text-secondary">Para: {uploadModal.name}</p>
              </div>
              <button onClick={() => setUploadModal(null)}><X className="h-5 w-5 text-vensato-text-secondary" /></button>
            </div>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-vensato-text-main">Propiedad</label>
                <select value={uploadModal.type === "property" ? uploadModal.id : (tenants.find(t => t.id === uploadModal.id)?.propertyId ?? "")}
                  onChange={e => {
                    const p = properties.find(pr => pr.id === e.target.value);
                    if (p) setUploadModal(m => m ? { ...m, type: "property", id: p.id, name: p.alias } : m);
                    setUploadForm(f => ({ ...f, docType: "" }));
                  }}
                  className="w-full h-10 rounded-md border border-vensato-border-subtle bg-vensato-base px-3 text-sm focus:outline-none focus:ring-2 focus:ring-vensato-brand-primary">
                  {properties.map(p => <option key={p.id} value={p.id}>{p.alias}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-vensato-text-main">Asignar a</label>
                <select value={uploadModal.type === "property" ? "property" : uploadModal.id}
                  onChange={e => {
                    if (e.target.value === "property") {
                      const p = properties.find(pr => pr.id === (uploadModal.type === "property" ? uploadModal.id : tenants.find(t => t.id === uploadModal.id)?.propertyId));
                      setUploadModal(m => m ? { ...m, type: "property", id: p?.id ?? "", name: p?.alias ?? "" } : m);
                    } else {
                      const t = tenants.find(t => t.id === e.target.value);
                      if (t) setUploadModal(m => m ? { ...m, type: "tenant", id: t.id, name: t.fullName } : m);
                    }
                    setUploadForm(f => ({ ...f, docType: "" }));
                  }}
                  className="w-full h-10 rounded-md border border-vensato-border-subtle bg-vensato-base px-3 text-sm focus:outline-none focus:ring-2 focus:ring-vensato-brand-primary">
                  <option value="property">📁 Documentos de la Propiedad</option>
                  {getPropertyTenants(uploadModal.type === "property" ? uploadModal.id : tenants.find(t => t.id === uploadModal.id)?.propertyId ?? "")
                    .map(t => <option key={t.id} value={t.id}>👤 {t.fullName}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-vensato-text-main">Tipo de documento *</label>
                <select value={uploadForm.docType} onChange={e => setUploadForm(f => ({ ...f, docType: e.target.value }))} required
                  className="w-full h-10 rounded-md border border-vensato-border-subtle bg-vensato-base px-3 text-sm focus:outline-none focus:ring-2 focus:ring-vensato-brand-primary">
                  <option value="">— Seleccionar tipo —</option>
                  {(uploadModal.type === "property" ? PROPERTY_DOC_TYPES : TENANT_DOC_TYPES).map(d => (
                    <option key={d.key} value={d.key}>{d.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-vensato-text-main">Nombre del archivo (opcional)</label>
                <Input value={uploadForm.fileName} onChange={e => setUploadForm(f => ({ ...f, fileName: e.target.value }))}
                  placeholder="Mi_Documento.pdf" className="bg-vensato-base border-vensato-border-subtle h-10" />
              </div>
              <label className="flex items-center justify-center p-5 border-2 border-dashed border-vensato-border-subtle rounded-xl cursor-pointer hover:border-vensato-brand-primary/50 transition-colors bg-vensato-base">
                <div className="text-center">
                  <Upload className="h-8 w-8 mx-auto text-vensato-brand-primary mb-2" />
                  {uploadForm.file
                    ? <p className="text-sm font-semibold text-vensato-success">{uploadForm.file.name}</p>
                    : <>
                        <p className="text-sm font-semibold text-vensato-text-main">Seleccionar archivo</p>
                        <p className="text-xs text-vensato-text-secondary mt-0.5">PDF, JPG o PNG · máx 10MB</p>
                      </>}
                </div>
                <input type="file" accept=".pdf,application/pdf" className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) setUploadForm(prev => ({ ...prev, file: f, fileName: prev.fileName || f.name }));
                  }} />
              </label>
              <div className="flex space-x-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setUploadModal(null)} className="flex-1 border-vensato-border-subtle">Cancelar</Button>
                <Button type="submit" disabled={uploading} className="flex-1 bg-vensato-brand-primary hover:bg-[#5C7D6E] text-white">
                  {uploading ? "Cargando..." : "Guardar Documento"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* File Explorer */}
      <div className="bg-vensato-surface border border-vensato-border-subtle rounded-2xl overflow-hidden shadow-sm">
        {properties.map((prop) => {
          const propDocs = getPropertyDocs(prop.id);
          const propTenants = getPropertyTenants(prop.id);
          const isExpanded = expandedProps.has(prop.id);
          return (
            <div key={prop.id} className="border-b border-vensato-border-subtle last:border-0">
              {/* Property row */}
              <div className="flex items-center px-4 py-3.5 hover:bg-vensato-base cursor-pointer transition-colors"
                onClick={() => toggleProp(prop.id)}>
                <button className="mr-2 text-vensato-text-secondary">
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                {isExpanded ? <FolderOpen className="h-5 w-5 text-vensato-brand-primary mr-3" /> : <Folder className="h-5 w-5 text-vensato-brand-primary mr-3" />}
                <div className="flex-1">
                  <span className="font-semibold text-vensato-text-main text-sm">{prop.alias}</span>
                  <span className="ml-2 text-xs text-vensato-text-secondary">{prop.type} · {prop.city}</span>
                </div>
                <span className="text-xs text-vensato-text-secondary mr-4">{propDocs.length + getTenantDocs(propTenants[0]?.id ?? "").length} docs</span>
                <Button variant="ghost" size="sm"
                  onClick={e => { e.stopPropagation(); setUploadModal({ type: "property", id: prop.id, name: prop.alias }); }}
                  className="h-7 px-2 text-xs text-vensato-brand-primary hover:bg-vensato-brand-primary/10">
                  <Upload className="h-3 w-3 mr-1" /> Subir
                </Button>
              </div>

              {isExpanded && (
                <div className="pl-8 bg-vensato-base/40">
                  {/* Property documents */}
                  <div className="border-l border-vensato-border-subtle ml-4 pl-4">
                    <div className="py-2">
                      <p className="text-xs font-bold uppercase tracking-widest text-vensato-text-secondary mb-2 flex items-center">
                        <Home className="h-3 w-3 mr-1.5" /> Documentos de la propiedad
                      </p>
                      {propDocs.length === 0 ? (
                        <p className="text-xs text-vensato-text-secondary italic mb-2">Sin documentos cargados.</p>
                      ) : propDocs.map(doc => (
                        <div key={doc.id} className="flex items-center py-1.5 group">
                          <FileText className="h-4 w-4 text-vensato-text-secondary mr-2 shrink-0" />
                          <span className="text-sm text-vensato-text-main flex-1">{doc.name}</span>
                          <Badge variant="outline" className="text-xs mr-3 border-vensato-border-subtle">{doc.type}</Badge>
                          <span className="text-xs text-vensato-text-secondary mr-3">{doc.uploadedAt}</span>
                          <button onClick={() => { removeVaultDocument(doc.id, doc.fileUrl); toast.success("Documento eliminado."); }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Tenant folders */}
                    {propTenants.map(tenant => {
                      const tenantDocs = getTenantDocs(tenant.id);
                      const tenExpanded = expandedTenants.has(tenant.id);
                      return (
                        <div key={tenant.id} className="border-t border-vensato-border-subtle py-2">
                          <div className="flex items-center cursor-pointer hover:text-vensato-text-main"
                            onClick={() => toggleTenant(tenant.id)}>
                            <button className="mr-1.5 text-vensato-text-secondary">
                              {tenExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                            </button>
                            {tenExpanded ? <FolderOpen className="h-4 w-4 text-vensato-accent-punch mr-2" /> : <Folder className="h-4 w-4 text-vensato-accent-punch mr-2" />}
                            <span className="text-sm font-semibold text-vensato-text-main flex-1">{tenant.fullName}</span>
                            <span className="text-xs text-vensato-text-secondary mr-3">{tenantDocs.length} docs</span>
                            <Button variant="ghost" size="sm"
                              onClick={e => { e.stopPropagation(); setUploadModal({ type: "tenant", id: tenant.id, name: tenant.fullName }); }}
                              className="h-6 px-2 text-xs text-vensato-accent-punch hover:bg-vensato-accent-punch/10">
                              <Upload className="h-3 w-3 mr-1" /> Subir
                            </Button>
                          </div>
                          {tenExpanded && (
                            <div className="pl-6 mt-2">
                              {tenantDocs.length === 0 ? (
                                <p className="text-xs text-vensato-text-secondary italic">Sin documentos. Usa el botón "Subir".</p>
                              ) : tenantDocs.map(doc => (
                                <div key={doc.id} className="flex items-center py-1.5 group">
                                  <FileText className="h-4 w-4 text-vensato-text-secondary mr-2 shrink-0" />
                                  <span className="text-sm text-vensato-text-main flex-1">{doc.name}</span>
                                  <Badge variant="outline" className="text-xs mr-3 border-vensato-border-subtle">{doc.type}</Badge>
                                  <span className="text-xs text-vensato-text-secondary mr-3">{doc.uploadedAt}</span>
                                  <button onClick={() => { removeVaultDocument(doc.id, doc.fileUrl); toast.success("Documento eliminado."); }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
