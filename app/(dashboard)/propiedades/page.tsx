"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { mockProperties, formatCOP } from "@/lib/utils/mock-data";
import { Plus, MoreHorizontal, X } from "lucide-react";
import { toast } from "sonner";

export default function PropiedadesPage() {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ alias: "", type: "", city: "", rent: "" });

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    toast.success(`Propiedad "${form.alias}" registrada.`, {
      description: "Pendiente de integración con base de datos.",
    });
    setShowModal(false);
    setForm({ alias: "", type: "", city: "", rent: "" });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-heading font-bold text-2xl text-vensato-text-main">Propiedades</h1>
          <p className="text-vensato-text-secondary text-sm mt-1">Gestión de tu portafolio inmobiliario</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="bg-vensato-brand-primary hover:bg-[#5C7D6E] text-white font-ui flex items-center">
          <Plus className="mr-2 h-4 w-4" /> Nueva Propiedad
        </Button>
      </div>

      {/* ─── Modal ─── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-vensato-surface rounded-2xl p-8 w-full max-w-md shadow-2xl border border-vensato-border-subtle">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-heading font-bold text-xl text-vensato-text-main">Nueva Propiedad</h3>
              <button onClick={() => setShowModal(false)} className="text-vensato-text-secondary hover:text-vensato-text-main"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-vensato-text-main">Alias / Nombre *</label>
                <Input value={form.alias} onChange={e => setForm(f => ({ ...f, alias: e.target.value }))}
                  placeholder="Ej. Apt 301 - Laureles" className="bg-vensato-base border-vensato-border-subtle h-10" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-vensato-text-main">Tipo *</label>
                <Input value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  placeholder="Apartamento, Casa, Local..." className="bg-vensato-base border-vensato-border-subtle h-10" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-vensato-text-main">Ciudad *</label>
                <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                  placeholder="Medellín, Bogotá..." className="bg-vensato-base border-vensato-border-subtle h-10" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-vensato-text-main">Canon de Arrendamiento (COP) *</label>
                <Input type="number" value={form.rent} onChange={e => setForm(f => ({ ...f, rent: e.target.value }))}
                  placeholder="2800000" className="bg-vensato-base border-vensato-border-subtle h-10" required />
              </div>
              <div className="flex space-x-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1 border-vensato-border-subtle">Cancelar</Button>
                <Button type="submit" className="flex-1 bg-vensato-brand-primary hover:bg-[#5C7D6E] text-white">Guardar Propiedad</Button>
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
              <TableHead className="font-medium text-vensato-text-secondary hidden lg:table-cell h-12">Cap Rate</TableHead>
              <TableHead className="font-medium text-vensato-text-secondary h-12">Estado</TableHead>
              <TableHead className="w-[50px] h-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockProperties.map((p) => (
              <TableRow key={p.id} className="hover:bg-vensato-base/50 transition-colors border-vensato-border-subtle">
                <TableCell className="py-4">
                  <div className="font-medium text-vensato-text-main">{p.alias}</div>
                  {p.tenant && <div className="text-xs text-vensato-text-secondary mt-0.5">Inquilino: {p.tenant}</div>}
                </TableCell>
                <TableCell className="hidden md:table-cell py-4 text-vensato-text-secondary">{p.type} · {p.city}</TableCell>
                <TableCell className="font-medium tabular-nums py-4 text-vensato-text-main">{formatCOP(p.currentRent)}</TableCell>
                <TableCell className="hidden lg:table-cell py-4 font-semibold text-vensato-brand-primary">{p.capRate}%</TableCell>
                <TableCell className="py-4">
                  {p.status === "occupied"
                    ? <Badge variant="outline" className="bg-vensato-success/10 text-vensato-success border-vensato-success/20">Ocupada</Badge>
                    : <Badge variant="outline" className="bg-vensato-warning/10 text-vensato-warning border-vensato-warning/20">Vacante</Badge>
                  }
                </TableCell>
                <TableCell className="py-4">
                  <Button variant="ghost" size="icon"
                    onClick={() => toast.info("Detalle de propiedad próximamente.")}
                    className="text-vensato-text-secondary hover:text-vensato-text-main rounded-full h-8 w-8 hover:bg-vensato-border-subtle/50">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
