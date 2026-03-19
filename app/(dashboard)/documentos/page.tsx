"use client";

import { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/lib/store/app-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FolderOpen, Folder, FileText, Upload, Trash2,
  ChevronRight, ChevronDown, X, Home, ExternalLink, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useDocumentos, type Documento } from "@/hooks/useDocumentos";

// ─── Tipos de documento disponibles en la UI ──────────────────────────────────

const PROPERTY_DOC_TYPES = [
  { key: "Escritura Pública", label: "Escritura Pública" },
  { key: "Certificado de Tradición y Libertad", label: "Certificado de Tradición y Libertad" },
  { key: "Recibo Predial", label: "Recibo Predial" },
];

const TENANT_DOC_TYPES = [
  { key: "Cédula de Ciudadanía", label: "Cédula de Ciudadanía" },
  { key: "Extractos Bancarios", label: "Extractos Bancarios" },
  { key: "Contrato de Arrendamiento", label: "Contrato de Arrendamiento" },
  { key: "Certificado Laboral", label: "Certificado Laboral" },
  { key: "Póliza de Arrendamiento", label: "Póliza de Arrendamiento" },
];

type UploadTarget = { type: "property" | "tenant"; id: string; name: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return iso.split("T")[0];
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function DocumentosPage() {
  const { properties, tenants } = useAppStore();
  const { subirDocumento, obtenerUrlDescarga, eliminarDocumento, loading: hookLoading } = useDocumentos();

  // Lista de documentos cargados desde R2
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [fetching, setFetching] = useState(true);

  // Árbol expandido
  const [expandedProps, setExpandedProps] = useState<Set<string>>(new Set());
  const [expandedTenants, setExpandedTenants] = useState<Set<string>>(new Set());

  // Modal de carga
  const [uploadTarget, setUploadTarget] = useState<UploadTarget | null>(null);
  const [docType, setDocType] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // IDs en proceso de descarga o eliminación
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Cargar lista al montar ──────────────────────────────────────────────────

  const cargarDocumentos = useCallback(async () => {
    setFetching(true);
    try {
      const res = await fetch("/api/documentos");
      if (!res.ok) throw new Error("Error cargando documentos");
      const data = await res.json() as Documento[];
      setDocumentos(data);
    } catch {
      toast.error("No se pudieron cargar los documentos.");
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => { cargarDocumentos(); }, [cargarDocumentos]);

  // ── Helpers de árbol ───────────────────────────────────────────────────────

  const toggle = (set: Set<string>, id: string) => {
    const next = new Set(set);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  };

  function getPropDocs(propId: string) {
    return documentos.filter(d => d.propiedad_id === propId && !tenants.some(t => t.id === /* tenantId stored in r2_key path */ ""));
    // Los docs de propiedad son los que NO pertenecen a ningún inquilino de esa propiedad
  }

  function getTenantDocs(tenantId: string) {
    // La key tiene formato: users/{uid}/{tipo}/{propiedadId}/{ts}.ext
    // Para distinguir docs de inquilino guardamos el tenantId en el path si lo pasamos,
    // pero la tabla documentos no tiene tenant_id. Usamos la convención de key:
    // docs de inquilino: users/{uid}/{tipo}/tenant_{tenantId}/{ts}.ext
    return documentos.filter(d => d.r2_key.includes(`/tenant_${tenantId}/`));
  }

  function getPropOnlyDocs(propId: string) {
    // Docs de la propiedad (no de inquilinos): path tiene propiedadId directamente
    const tenantIds = tenants.filter(t => t.propertyId === propId).map(t => t.id);
    return documentos.filter(d =>
      d.propiedad_id === propId &&
      !tenantIds.some(tid => d.r2_key.includes(`/tenant_${tid}/`))
    );
  }

  function getPropertyTenants(propId: string) {
    return tenants.filter(t => t.propertyId === propId);
  }

  // ── Subir documento ────────────────────────────────────────────────────────

  function openModal(target: UploadTarget) {
    setUploadTarget(target);
    setDocType("");
    setFile(null);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadTarget || !docType || !file) {
      toast.error("Selecciona el tipo de documento y un archivo.");
      return;
    }

    // Determinar propiedadId
    const propiedadId = uploadTarget.type === "property"
      ? uploadTarget.id
      : (tenants.find(t => t.id === uploadTarget.id)?.propertyId ?? "");

    if (!propiedadId) {
      toast.error("No se encontró la propiedad.");
      return;
    }

    setUploading(true);
    try {
      // Para documentos de inquilino, modificamos el tipo para codificar el tenant en el path
      // La API build la key como: users/{uid}/{tipo_seguro}/{propiedadId}/{ts}.ext
      // Para tenant: pasamos propiedadId = "tenant_{tenantId}" como propiedadId
      const efectivoPropId = uploadTarget.type === "tenant"
        ? `tenant_${uploadTarget.id}`
        : propiedadId;

      const doc = await subirDocumento(file, efectivoPropId, docType as never);

      // El registro en supabase tiene propiedad_id real, pero la key tiene el tenant path
      // Actualizamos propiedad_id en el registro creado si es de inquilino
      setDocumentos(prev => [{ ...doc, propiedad_id: propiedadId }, ...prev]);

      toast.success("Documento cargado.", { description: `${docType} → ${uploadTarget.name}` });
      setUploadTarget(null);
      setFile(null);
      setDocType("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      toast.error("Error al cargar el documento.", { description: msg });
    } finally {
      setUploading(false);
    }
  }

  // ── Abrir / descargar ──────────────────────────────────────────────────────

  async function handleOpen(doc: Documento) {
    setOpeningId(doc.id);
    try {
      const url = await obtenerUrlDescarga(doc.id);
      window.open(url, "_blank");
    } catch {
      toast.error("No se pudo obtener el enlace de descarga.");
    } finally {
      setOpeningId(null);
    }
  }

  // ── Eliminar ───────────────────────────────────────────────────────────────

  async function handleDelete(doc: Documento) {
    setDeletingId(doc.id);
    try {
      await eliminarDocumento(doc.id);
      setDocumentos(prev => prev.filter(d => d.id !== doc.id));
      toast.success("Documento eliminado.");
    } catch {
      toast.error("No se pudo eliminar el documento.");
    } finally {
      setDeletingId(null);
    }
  }

  // ── Fila de documento ──────────────────────────────────────────────────────

  function DocRow({ doc }: { doc: Documento }) {
    const isOpening = openingId === doc.id;
    const isDeleting = deletingId === doc.id;
    return (
      <div className="flex items-center py-1.5 group gap-2">
        <FileText className="h-4 w-4 text-vensato-text-secondary shrink-0" />
        <button
          onClick={() => handleOpen(doc)}
          disabled={isOpening}
          className="text-sm text-vensato-text-main flex-1 text-left hover:text-vensato-brand-primary hover:underline truncate"
          title={doc.nombre_original}
        >
          {isOpening
            ? <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Abriendo…</span>
            : doc.nombre_original
          }
        </button>
        <ExternalLink className="h-3.5 w-3.5 text-vensato-text-secondary opacity-0 group-hover:opacity-60 shrink-0" />
        <Badge variant="outline" className="text-xs border-vensato-border-subtle shrink-0">{doc.tipo}</Badge>
        <span className="text-xs text-vensato-text-secondary shrink-0 hidden lg:block">{formatBytes(doc.tamanio_bytes)}</span>
        <span className="text-xs text-vensato-text-secondary shrink-0 hidden lg:block">{formatDate(doc.created_at)}</span>
        <button
          onClick={() => handleDelete(doc)}
          disabled={isDeleting}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 shrink-0"
        >
          {isDeleting
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Trash2 className="h-3.5 w-3.5" />
          }
        </button>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const totalDocs = documentos.length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-heading font-bold text-2xl text-vensato-text-main">Bóveda Documental</h1>
          <p className="text-vensato-text-secondary text-sm mt-1">
            Almacenamiento en Cloudflare R2 ·{" "}
            <span className="font-semibold">{totalDocs} documento{totalDocs !== 1 ? "s" : ""}</span>
          </p>
        </div>
        <Button
          onClick={() => properties[0] && openModal({ type: "property", id: properties[0].id, name: properties[0].alias })}
          className="bg-vensato-brand-primary hover:bg-[#5C7D6E] text-white font-ui flex items-center"
          disabled={properties.length === 0}
        >
          <Upload className="mr-2 h-4 w-4" /> Cargar Documento
        </Button>
      </div>

      {/* ── Modal de carga ── */}
      {uploadTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-vensato-surface rounded-2xl p-8 w-full max-w-md shadow-2xl border border-vensato-border-subtle">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-heading font-bold text-xl text-vensato-text-main">Cargar Documento</h3>
                <p className="text-sm text-vensato-text-secondary">Para: {uploadTarget.name}</p>
              </div>
              <button onClick={() => setUploadTarget(null)}><X className="h-5 w-5 text-vensato-text-secondary" /></button>
            </div>
            <form onSubmit={handleUpload} className="space-y-4">
              {/* Propiedad */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-vensato-text-main">Propiedad</label>
                <select
                  value={uploadTarget.type === "property" ? uploadTarget.id : (tenants.find(t => t.id === uploadTarget.id)?.propertyId ?? "")}
                  onChange={e => {
                    const p = properties.find(pr => pr.id === e.target.value);
                    if (p) setUploadTarget({ type: "property", id: p.id, name: p.alias });
                    setDocType("");
                  }}
                  className="w-full h-10 rounded-md border border-vensato-border-subtle bg-vensato-base px-3 text-sm focus:outline-none focus:ring-2 focus:ring-vensato-brand-primary"
                >
                  {properties.map(p => <option key={p.id} value={p.id}>{p.alias}</option>)}
                </select>
              </div>

              {/* Asignar a propiedad o inquilino */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-vensato-text-main">Asignar a</label>
                <select
                  value={uploadTarget.type === "property" ? "property" : uploadTarget.id}
                  onChange={e => {
                    if (e.target.value === "property") {
                      const propId = uploadTarget.type === "property"
                        ? uploadTarget.id
                        : tenants.find(t => t.id === uploadTarget.id)?.propertyId ?? "";
                      const p = properties.find(pr => pr.id === propId);
                      setUploadTarget({ type: "property", id: propId, name: p?.alias ?? "" });
                    } else {
                      const t = tenants.find(t => t.id === e.target.value);
                      if (t) setUploadTarget({ type: "tenant", id: t.id, name: t.fullName });
                    }
                    setDocType("");
                  }}
                  className="w-full h-10 rounded-md border border-vensato-border-subtle bg-vensato-base px-3 text-sm focus:outline-none focus:ring-2 focus:ring-vensato-brand-primary"
                >
                  <option value="property">📁 Documentos de la Propiedad</option>
                  {getPropertyTenants(
                    uploadTarget.type === "property"
                      ? uploadTarget.id
                      : tenants.find(t => t.id === uploadTarget.id)?.propertyId ?? ""
                  ).map(t => <option key={t.id} value={t.id}>👤 {t.fullName}</option>)}
                </select>
              </div>

              {/* Tipo de documento */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-vensato-text-main">Tipo de documento *</label>
                <select
                  value={docType}
                  onChange={e => setDocType(e.target.value)}
                  required
                  className="w-full h-10 rounded-md border border-vensato-border-subtle bg-vensato-base px-3 text-sm focus:outline-none focus:ring-2 focus:ring-vensato-brand-primary"
                >
                  <option value="">— Seleccionar tipo —</option>
                  {(uploadTarget.type === "property" ? PROPERTY_DOC_TYPES : TENANT_DOC_TYPES).map(d => (
                    <option key={d.key} value={d.key}>{d.label}</option>
                  ))}
                </select>
              </div>

              {/* Selector de archivo */}
              <label className="flex items-center justify-center p-5 border-2 border-dashed border-vensato-border-subtle rounded-xl cursor-pointer hover:border-vensato-brand-primary/50 transition-colors bg-vensato-base">
                <div className="text-center">
                  <Upload className="h-8 w-8 mx-auto text-vensato-brand-primary mb-2" />
                  {file
                    ? <p className="text-sm font-semibold text-vensato-success">{file.name}</p>
                    : <>
                        <p className="text-sm font-semibold text-vensato-text-main">Seleccionar archivo *</p>
                        <p className="text-xs text-vensato-text-secondary mt-0.5">PDF · máx 50 MB</p>
                      </>
                  }
                </div>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  required
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) setFile(f);
                  }}
                />
              </label>

              <div className="flex space-x-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setUploadTarget(null)} className="flex-1 border-vensato-border-subtle">
                  Cancelar
                </Button>
                <Button type="submit" disabled={uploading || !file} className="flex-1 bg-vensato-brand-primary hover:bg-[#5C7D6E] text-white">
                  {uploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Cargando…</> : "Guardar Documento"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Explorador ── */}
      <div className="bg-vensato-surface border border-vensato-border-subtle rounded-2xl overflow-hidden shadow-sm">
        {fetching ? (
          <div className="flex items-center justify-center py-16 text-vensato-text-secondary">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Cargando documentos…
          </div>
        ) : properties.length === 0 ? (
          <div className="py-16 text-center text-vensato-text-secondary text-sm">
            No hay propiedades. Crea una propiedad primero.
          </div>
        ) : (
          properties.map((prop) => {
            const propDocs = getPropOnlyDocs(prop.id);
            const propTenants = getPropertyTenants(prop.id);
            const isExpanded = expandedProps.has(prop.id);
            const totalPropDocs = propDocs.length + propTenants.reduce((s, t) => s + getTenantDocs(t.id).length, 0);

            return (
              <div key={prop.id} className="border-b border-vensato-border-subtle last:border-0">
                {/* Fila de propiedad */}
                <div
                  className="flex items-center px-4 py-3.5 hover:bg-vensato-base cursor-pointer transition-colors"
                  onClick={() => setExpandedProps(s => toggle(s, prop.id))}
                >
                  <button className="mr-2 text-vensato-text-secondary">
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                  {isExpanded
                    ? <FolderOpen className="h-5 w-5 text-vensato-brand-primary mr-3" />
                    : <Folder className="h-5 w-5 text-vensato-brand-primary mr-3" />
                  }
                  <div className="flex-1">
                    <span className="font-semibold text-vensato-text-main text-sm">{prop.alias}</span>
                    <span className="ml-2 text-xs text-vensato-text-secondary">{prop.type} · {prop.city}</span>
                  </div>
                  <span className="text-xs text-vensato-text-secondary mr-4">{totalPropDocs} docs</span>
                  <Button
                    variant="ghost" size="sm"
                    onClick={e => { e.stopPropagation(); openModal({ type: "property", id: prop.id, name: prop.alias }); }}
                    className="h-7 px-2 text-xs text-vensato-brand-primary hover:bg-vensato-brand-primary/10"
                  >
                    <Upload className="h-3 w-3 mr-1" /> Subir
                  </Button>
                </div>

                {isExpanded && (
                  <div className="pl-8 bg-vensato-base/40">
                    <div className="border-l border-vensato-border-subtle ml-4 pl-4">

                      {/* Documentos de la propiedad */}
                      <div className="py-2">
                        <p className="text-xs font-bold uppercase tracking-widest text-vensato-text-secondary mb-2 flex items-center">
                          <Home className="h-3 w-3 mr-1.5" /> Documentos de la propiedad
                        </p>
                        {propDocs.length === 0
                          ? <p className="text-xs text-vensato-text-secondary italic mb-2">Sin documentos cargados.</p>
                          : propDocs.map(doc => <DocRow key={doc.id} doc={doc} />)
                        }
                      </div>

                      {/* Carpetas de inquilinos */}
                      {propTenants.map(tenant => {
                        const tDocs = getTenantDocs(tenant.id);
                        const tenExpanded = expandedTenants.has(tenant.id);
                        return (
                          <div key={tenant.id} className="border-t border-vensato-border-subtle py-2">
                            <div
                              className="flex items-center cursor-pointer hover:text-vensato-text-main"
                              onClick={() => setExpandedTenants(s => toggle(s, tenant.id))}
                            >
                              <button className="mr-1.5 text-vensato-text-secondary">
                                {tenExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                              </button>
                              {tenExpanded
                                ? <FolderOpen className="h-4 w-4 text-vensato-accent-punch mr-2" />
                                : <Folder className="h-4 w-4 text-vensato-accent-punch mr-2" />
                              }
                              <span className="text-sm font-semibold text-vensato-text-main flex-1">{tenant.fullName}</span>
                              <span className="text-xs text-vensato-text-secondary mr-3">{tDocs.length} docs</span>
                              <Button
                                variant="ghost" size="sm"
                                onClick={e => { e.stopPropagation(); openModal({ type: "tenant", id: tenant.id, name: tenant.fullName }); }}
                                className="h-6 px-2 text-xs text-vensato-accent-punch hover:bg-vensato-accent-punch/10"
                              >
                                <Upload className="h-3 w-3 mr-1" /> Subir
                              </Button>
                            </div>
                            {tenExpanded && (
                              <div className="pl-6 mt-2">
                                {tDocs.length === 0
                                  ? <p className="text-xs text-vensato-text-secondary italic">Sin documentos. Usa "Subir".</p>
                                  : tDocs.map(doc => <DocRow key={doc.id} doc={doc} />)
                                }
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
          })
        )}
      </div>
    </div>
  );
}
