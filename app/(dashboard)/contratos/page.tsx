"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { mockContracts, formatCOP } from "@/lib/utils/mock-data";
import { Plus, MoreHorizontal, FileText, AlertTriangle, X } from "lucide-react";
import { toast } from "sonner";

export default function ContratosPage() {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ property: "", tenant: "", startDate: "", endDate: "", rent: "" });

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    toast.success("Contrato registrado.", { description: "Pendiente de integración con base de datos." });
    setShowModal(false);
    setForm({ property: "", tenant: "", startDate: "", endDate: "", rent: "" });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-heading font-bold text-2xl text-vensato-text-main">Contratos</h1>
          <p className="text-vensato-text-secondary text-sm mt-1">Gestión del ciclo de vida contractual y renovaciones</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="bg-vensato-brand-primary hover:bg-[#5C7D6E] text-white font-ui flex items-center">
          <Plus className="mr-2 h-4 w-4" /> Nuevo Contrato
        </Button>
      </div>

      {/* ─── Alert ─── */}
      <div className="bg-vensato-warning/10 border border-vensato-warning/20 rounded-xl p-4 flex items-start space-x-3">
        <AlertTriangle className="h-5 w-5 text-vensato-warning shrink-0" />
        <div className="flex-1">
          <h4 className="text-sm font-bold text-vensato-text-main">Alerta de Renovación</h4>
          <p className="text-sm text-vensato-text-secondary mt-0.5">El contrato de <strong>María Fernanda López</strong> (Apt 502 - Chicó) vence en 30 días.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => toast.info("Flujo de renovación próximamente disponible.")}
          className="ml-auto mt-0.5 shrink-0 bg-white hover:bg-vensato-base border-vensato-border-subtle text-vensato-text-main">
          Gestionar
        </Button>
      </div>

      {/* ─── Modal ─── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-vensato-surface rounded-2xl p-8 w-full max-w-md shadow-2xl border border-vensato-border-subtle">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-heading font-bold text-xl text-vensato-text-main">Nuevo Contrato</h3>
              <button onClick={() => setShowModal(false)} className="text-vensato-text-secondary hover:text-vensato-text-main"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-vensato-text-main">Propiedad *</label>
                <Input value={form.property} onChange={e => setForm(f => ({ ...f, property: e.target.value }))}
                  placeholder="Apt 301 - Laureles" className="bg-vensato-base border-vensato-border-subtle h-10" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-vensato-text-main">Inquilino *</label>
                <Input value={form.tenant} onChange={e => setForm(f => ({ ...f, tenant: e.target.value }))}
                  placeholder="Nombre del inquilino" className="bg-vensato-base border-vensato-border-subtle h-10" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-vensato-text-main">Inicio *</label>
                  <Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    className="bg-vensato-base border-vensato-border-subtle h-10" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-vensato-text-main">Fin *</label>
                  <Input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                    className="bg-vensato-base border-vensato-border-subtle h-10" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-vensato-text-main">Canon mensual (COP) *</label>
                <Input type="number" value={form.rent} onChange={e => setForm(f => ({ ...f, rent: e.target.value }))}
                  placeholder="2800000" className="bg-vensato-base border-vensato-border-subtle h-10" required />
              </div>
              <div className="flex space-x-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1 border-vensato-border-subtle">Cancelar</Button>
                <Button type="submit" className="flex-1 bg-vensato-brand-primary hover:bg-[#5C7D6E] text-white">Guardar Contrato</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Card className="rounded-xl shadow-sm border-vensato-border-subtle bg-vensato-surface overflow-hidden">
        <Table>
          <TableHeader className="bg-vensato-base border-b border-vensato-border-subtle">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-medium text-vensato-text-secondary h-12">Propiedad e Inquilino</TableHead>
              <TableHead className="font-medium text-vensato-text-secondary hidden md:table-cell h-12">Vigencia</TableHead>
              <TableHead className="font-medium text-vensato-text-secondary h-12">Canon Actual</TableHead>
              <TableHead className="font-medium text-vensato-text-secondary hidden lg:table-cell h-12">Incremento</TableHead>
              <TableHead className="font-medium text-vensato-text-secondary h-12">Estado</TableHead>
              <TableHead className="w-[50px] h-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockContracts.map((c) => (
              <TableRow key={c.id} className="hover:bg-vensato-base/50 transition-colors border-vensato-border-subtle">
                <TableCell className="py-4">
                  <div className="font-medium text-vensato-text-main flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-vensato-text-secondary" /> {c.property}
                  </div>
                  <div className="text-xs text-vensato-text-secondary mt-1 ml-6">{c.tenant}</div>
                </TableCell>
                <TableCell className="hidden md:table-cell py-4 text-sm text-vensato-text-secondary">{c.startDate} al {c.endDate}</TableCell>
                <TableCell className="font-medium tabular-nums py-4 text-vensato-text-main">{formatCOP(c.rentAmount)}</TableCell>
                <TableCell className="hidden lg:table-cell py-4 text-sm text-vensato-text-secondary">{c.incrementType}</TableCell>
                <TableCell className="py-4">
                  {c.status === "active"
                    ? <Badge variant="outline" className="bg-vensato-success/10 text-vensato-success border-vensato-success/20">Vigente</Badge>
                    : <Badge variant="outline" className="text-vensato-warning border-vensato-warning bg-vensato-warning/10">Por Vencer</Badge>
                  }
                </TableCell>
                <TableCell className="py-4">
                  <Button variant="ghost" size="icon"
                    onClick={() => toast.info("Detalle de contrato próximamente.")}
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
