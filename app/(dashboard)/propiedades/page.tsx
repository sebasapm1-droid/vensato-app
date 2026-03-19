"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useAppStore, type Property } from "@/lib/store/app-store";
import { formatCOP } from "@/lib/utils/mock-data";
import { Plus, MoreHorizontal, X, Pencil, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const propertyTypes = ["Apartamento", "Casa", "Local", "Bodega", "Oficina", "Lote", "Finca"];

const emptyForm = {
  alias: "", type: "Apartamento", city: "", neighborhood: "", address: "",
  areaMt2: "", bedrooms: "", bathrooms: "", estrato: "",
  purchasePrice: "", currentRent: "", adminFee: "", predialAnnual: "",
  notes: "",
};

export default function PropiedadesPage() {
  const { properties: props, addProperty, updateProperty, deleteProperty } = useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Property | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setEditTarget(null);
    setForm({ ...emptyForm });
    setShowModal(true);
  }

  function openEdit(p: Property) {
    setEditTarget(p);
    setForm({
      alias: p.alias,
      type: p.type,
      city: p.city,
      neighborhood: p.neighborhood,
      address: p.address,
      areaMt2: String(p.areaMt2),
      bedrooms: String(p.bedrooms),
      bathrooms: String(p.bathrooms),
      estrato: String(p.estrato),
      purchasePrice: String(p.purchasePrice),
      currentRent: String(p.currentRent),
      adminFee: String(p.adminFee),
      predialAnnual: String(p.predialAnnual),
      notes: p.notes ?? "",
    });
    setShowModal(true);
  }

  async function handleDelete(id: string, alias: string) {
    try {
      await deleteProperty(id);
      toast.success(`Propiedad "${alias}" eliminada.`);
    } catch {
      toast.error("No se pudo eliminar la propiedad.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.alias || !form.city || !form.currentRent) {
      toast.error("Completa los campos obligatorios."); return;
    }
    setSaving(true);
    try {
      const parsed = { areaMt2: Number(form.areaMt2), bedrooms: Number(form.bedrooms), bathrooms: Number(form.bathrooms), estrato: Number(form.estrato), purchasePrice: Number(form.purchasePrice), currentRent: Number(form.currentRent), adminFee: Number(form.adminFee), predialAnnual: Number(form.predialAnnual) };
      if (editTarget) {
        await updateProperty(editTarget.id, { ...form, ...parsed });
        toast.success(`Propiedad "${form.alias}" actualizada.`);
      } else {
        await addProperty({ id: "", ...form, ...parsed, capRate: 0, status: "vacant", tenant: null } as Property);
        toast.success(`Propiedad "${form.alias}" creada.`);
      }
      setShowModal(false);
    } catch {
      toast.error("Error al guardar la propiedad. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  const f = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-heading font-bold text-2xl text-vensato-text-main">Propiedades</h1>
          <p className="text-vensato-text-secondary text-sm mt-1">Gestión de tu portafolio inmobiliario</p>
        </div>
        <Button onClick={openCreate} className="bg-vensato-brand-primary hover:bg-[#5C7D6E] text-white font-ui flex items-center">
          <Plus className="mr-2 h-4 w-4" /> Nueva Propiedad
        </Button>
      </div>

      {/* ─── Modal ─── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-vensato-surface rounded-2xl w-full max-w-2xl shadow-2xl border border-vensato-border-subtle flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-vensato-border-subtle">
              <h3 className="font-heading font-bold text-xl text-vensato-text-main">
                {editTarget ? "Editar Propiedad" : "Nueva Propiedad"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-vensato-text-secondary hover:text-vensato-text-main">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="overflow-y-auto">
              <div className="p-6 space-y-5">
                {/* Identificación */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-vensato-text-secondary mb-3">Identificación</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-1.5">
                      <label className="text-sm font-semibold text-vensato-text-main">Alias / Nombre *</label>
                      <Input value={form.alias} onChange={f("alias")} placeholder="Apt 301 - Laureles" className="bg-vensato-base border-vensato-border-subtle h-10" required />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-vensato-text-main">Tipo *</label>
                      <select value={form.type} onChange={f("type")} className="w-full h-10 rounded-md border border-vensato-border-subtle bg-vensato-base px-3 text-sm text-vensato-text-main focus:outline-none focus:ring-2 focus:ring-vensato-brand-primary">
                        {propertyTypes.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-vensato-text-main">Estrato</label>
                      <Input type="number" min={1} max={6} value={form.estrato} onChange={f("estrato")} placeholder="4" className="bg-vensato-base border-vensato-border-subtle h-10" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-vensato-text-main">Ciudad *</label>
                      <Input value={form.city} onChange={f("city")} placeholder="Medellín" className="bg-vensato-base border-vensato-border-subtle h-10" required />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-vensato-text-main">Barrio</label>
                      <Input value={form.neighborhood} onChange={f("neighborhood")} placeholder="Laureles" className="bg-vensato-base border-vensato-border-subtle h-10" />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <label className="text-sm font-semibold text-vensato-text-main">Dirección</label>
                      <Input value={form.address} onChange={f("address")} placeholder="Cra 76 # 34-21 Apt 301" className="bg-vensato-base border-vensato-border-subtle h-10" />
                    </div>
                  </div>
                </div>

                {/* Características */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-vensato-text-secondary mb-3">Características</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-vensato-text-main">Área m²</label>
                      <Input type="number" value={form.areaMt2} onChange={f("areaMt2")} placeholder="72" className="bg-vensato-base border-vensato-border-subtle h-10" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-vensato-text-main">Habitaciones</label>
                      <Input type="number" value={form.bedrooms} onChange={f("bedrooms")} placeholder="2" className="bg-vensato-base border-vensato-border-subtle h-10" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-vensato-text-main">Baños</label>
                      <Input type="number" value={form.bathrooms} onChange={f("bathrooms")} placeholder="2" className="bg-vensato-base border-vensato-border-subtle h-10" />
                    </div>
                  </div>
                </div>

                {/* Financiero */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-vensato-text-secondary mb-3">Información Financiera (COP)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-vensato-text-main">Precio de Compra</label>
                      <Input type="number" value={form.purchasePrice} onChange={f("purchasePrice")} placeholder="280000000" className="bg-vensato-base border-vensato-border-subtle h-10" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-vensato-text-main">Canon de Arriendo *</label>
                      <Input type="number" value={form.currentRent} onChange={f("currentRent")} placeholder="2800000" className="bg-vensato-base border-vensato-border-subtle h-10" required />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-vensato-text-main">Administración (mensual)</label>
                      <Input type="number" value={form.adminFee} onChange={f("adminFee")} placeholder="250000" className="bg-vensato-base border-vensato-border-subtle h-10" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-vensato-text-main">Predial (anual)</label>
                      <Input type="number" value={form.predialAnnual} onChange={f("predialAnnual")} placeholder="1200000" className="bg-vensato-base border-vensato-border-subtle h-10" />
                    </div>
                  </div>
                  {form.purchasePrice && form.currentRent && (
                    <p className="text-xs text-vensato-brand-primary font-semibold mt-2">
                      Cap Rate estimado (neto): {(((Number(form.currentRent) * 12 - Number(form.adminFee) * 12 - Number(form.predialAnnual)) / Number(form.purchasePrice)) * 100).toFixed(2)}%
                    </p>
                  )}
                </div>

                {/* Notas */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-vensato-text-main">Notas</label>
                  <textarea value={form.notes} onChange={f("notes")} rows={2}
                    placeholder="Observaciones adicionales..."
                    className="w-full rounded-md border border-vensato-border-subtle bg-vensato-base px-3 py-2 text-sm text-vensato-text-main placeholder:text-vensato-text-secondary focus:outline-none focus:ring-2 focus:ring-vensato-brand-primary resize-none"
                  />
                </div>
              </div>

              <div className="p-6 pt-0 flex space-x-3">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1 border-vensato-border-subtle">Cancelar</Button>
                <Button type="submit" className="flex-1 bg-vensato-brand-primary hover:bg-[#5C7D6E] text-white">
                  {editTarget ? "Guardar Cambios" : "Crear Propiedad"}
                  {saving && <span className="ml-2">...</span>}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Card className="rounded-xl shadow-sm border-vensato-border-subtle bg-vensato-surface overflow-hidden">
        <Table>
          <TableHeader className="bg-vensato-base border-b border-vensato-border-subtle">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-medium text-vensato-text-secondary h-12">Propiedad</TableHead>
              <TableHead className="font-medium text-vensato-text-secondary hidden md:table-cell h-12">Tipo / Ciudad</TableHead>
              <TableHead className="font-medium text-vensato-text-secondary h-12">Canon</TableHead>
              <TableHead className="font-medium text-vensato-text-secondary hidden lg:table-cell h-12">Precio Compra</TableHead>
              <TableHead className="font-medium text-vensato-text-secondary hidden lg:table-cell h-12">Cap Rate</TableHead>
              <TableHead className="font-medium text-vensato-text-secondary h-12">Estado</TableHead>
              <TableHead className="w-[50px] h-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {props.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-vensato-text-secondary">No hay propiedades registradas.</TableCell>
              </TableRow>
            )}
            {props.map((p) => (
              <TableRow key={p.id} className="hover:bg-vensato-base/50 transition-colors border-vensato-border-subtle">
                <TableCell className="py-4">
                  <div className="font-medium text-vensato-text-main">{p.alias}</div>
                  {p.tenant && <div className="text-xs text-vensato-text-secondary mt-0.5">Inquilino: {p.tenant}</div>}
                </TableCell>
                <TableCell className="hidden md:table-cell py-4 text-vensato-text-secondary">{p.type} · {p.city}</TableCell>
                <TableCell className="font-medium tabular-nums py-4 text-vensato-text-main">{formatCOP(p.currentRent)}</TableCell>
                <TableCell className="hidden lg:table-cell py-4 text-vensato-text-secondary tabular-nums">{p.purchasePrice ? formatCOP(p.purchasePrice) : "—"}</TableCell>
                <TableCell className="hidden lg:table-cell py-4 font-semibold text-vensato-brand-primary">{p.capRate}%</TableCell>
                <TableCell className="py-4">
                  {p.status === "occupied"
                    ? <Badge variant="outline" className="bg-vensato-success/10 text-vensato-success border-vensato-success/20">Ocupada</Badge>
                    : <Badge variant="outline" className="bg-vensato-warning/10 text-vensato-warning border-vensato-warning/20">Vacante</Badge>
                  }
                </TableCell>
                <TableCell className="py-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-full text-vensato-text-secondary hover:text-vensato-text-main hover:bg-vensato-border-subtle/50 transition-colors">
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="bottom" align="end" className="min-w-[160px]">
                      <DropdownMenuItem onClick={() => openEdit(p)}>
                        <Pencil className="h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onClick={() => handleDelete(p.id, p.alias)}>
                        <Trash2 className="h-4 w-4" /> Eliminar
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
