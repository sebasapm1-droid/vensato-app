"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { mockCharges, formatCOP } from "@/lib/utils/mock-data";
import { Plus, MoreHorizontal, ArrowDownToLine, Send, X } from "lucide-react";
import { toast } from "sonner";

type Tab = "pending" | "overdue" | "paid" | "all";

export default function CobrosPage() {
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ tenant: "", concept: "", amount: "", dueDate: "" });

  const filtered = mockCharges.filter(c => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return c.status === "pending";
    if (activeTab === "overdue") return c.status === "overdue";
    if (activeTab === "paid") return c.status === "paid";
    return true;
  });

  const tabs: { key: Tab; label: string }[] = [
    { key: "pending", label: "Pendientes" },
    { key: "overdue", label: `Vencidos (${mockCharges.filter(c => c.status === "overdue").length})` },
    { key: "paid", label: "Pagados" },
    { key: "all", label: "Todos" },
  ];

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    toast.success("Cobro registrado.", { description: "Pendiente de integración con base de datos." });
    setShowModal(false);
    setForm({ tenant: "", concept: "", amount: "", dueDate: "" });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-heading font-bold text-2xl text-vensato-text-main">Cobros y Recaudo</h1>
          <p className="text-vensato-text-secondary text-sm mt-1">Control de pagos, vencimientos y facturación</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="bg-vensato-brand-primary hover:bg-[#5C7D6E] text-white font-ui flex items-center">
          <Plus className="mr-2 h-4 w-4" /> Crear Cobro
        </Button>
      </div>

      {/* ─── Modal ─── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-vensato-surface rounded-2xl p-8 w-full max-w-md shadow-2xl border border-vensato-border-subtle">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-heading font-bold text-xl text-vensato-text-main">Nuevo Cobro</h3>
              <button onClick={() => setShowModal(false)} className="text-vensato-text-secondary hover:text-vensato-text-main"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-vensato-text-main">Inquilino *</label>
                <Input value={form.tenant} onChange={e => setForm(f => ({ ...f, tenant: e.target.value }))}
                  placeholder="Nombre del inquilino" className="bg-vensato-base border-vensato-border-subtle h-10" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-vensato-text-main">Concepto *</label>
                <Input value={form.concept} onChange={e => setForm(f => ({ ...f, concept: e.target.value }))}
                  placeholder="Ej. Arriendo Abril 2026" className="bg-vensato-base border-vensato-border-subtle h-10" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-vensato-text-main">Monto (COP) *</label>
                <Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="2800000" className="bg-vensato-base border-vensato-border-subtle h-10" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-vensato-text-main">Fecha de Vencimiento *</label>
                <Input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                  className="bg-vensato-base border-vensato-border-subtle h-10" required />
              </div>
              <div className="flex space-x-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1 border-vensato-border-subtle">Cancelar</Button>
                <Button type="submit" className="flex-1 bg-vensato-brand-primary hover:bg-[#5C7D6E] text-white">Guardar Cobro</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Tabs ─── */}
      <div className="flex space-x-1 border-b border-vensato-border-subtle pb-px overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 font-medium text-sm whitespace-nowrap transition-colors ${activeTab === tab.key
              ? "text-vensato-brand-primary border-b-2 border-vensato-brand-primary"
              : "text-vensato-text-secondary hover:text-vensato-text-main"}`}
          >{tab.label}</button>
        ))}
      </div>

      <Card className="rounded-xl shadow-sm border-vensato-border-subtle bg-vensato-surface overflow-hidden">
        <Table>
          <TableHeader className="bg-vensato-base border-b border-vensato-border-subtle">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-medium text-vensato-text-secondary h-12">Concepto / Detalles</TableHead>
              <TableHead className="font-medium text-vensato-text-secondary hidden md:table-cell h-12">Inquilino</TableHead>
              <TableHead className="font-medium text-vensato-text-secondary h-12">Monto</TableHead>
              <TableHead className="font-medium text-vensato-text-secondary hidden lg:table-cell h-12">Vencimiento</TableHead>
              <TableHead className="font-medium text-vensato-text-secondary h-12">Estado</TableHead>
              <TableHead className="w-[120px] h-12 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-12 text-vensato-text-secondary">No hay cobros en esta categoría.</TableCell></TableRow>
            ) : filtered.map((c) => (
              <TableRow key={c.id} className="hover:bg-vensato-base/50 transition-colors border-vensato-border-subtle">
                <TableCell className="py-4">
                  <div className="font-medium text-vensato-text-main">{c.concept}</div>
                  <div className="text-xs text-vensato-text-secondary mt-0.5">{c.property}</div>
                </TableCell>
                <TableCell className="hidden md:table-cell py-4 text-vensato-text-main">{c.tenant}</TableCell>
                <TableCell className="font-medium tabular-nums py-4 text-vensato-text-main">{formatCOP(c.amount)}</TableCell>
                <TableCell className="hidden lg:table-cell py-4 text-vensato-text-secondary tabular-nums">{c.dueDate}</TableCell>
                <TableCell className="py-4">
                  {c.status === "paid" && <Badge variant="outline" className="bg-vensato-success/10 text-vensato-success border-vensato-success/20">Pagado</Badge>}
                  {c.status === "pending" && <Badge variant="outline" className="bg-vensato-border-subtle/50 text-vensato-text-main border-vensato-border-subtle">Pendiente</Badge>}
                  {c.status === "overdue" && <Badge className="bg-vensato-danger text-white hover:bg-vensato-danger border-transparent">Vencido</Badge>}
                </TableCell>
                <TableCell className="py-4 text-right space-x-1">
                  <Button variant="ghost" size="icon"
                    onClick={() => toast.info("Recordatorio enviado.", { description: `Se notificará a ${c.tenant} sobre el pago pendiente.` })}
                    className="text-vensato-brand-primary hover:bg-vensato-brand-primary/10 rounded-full h-8 w-8" title="Enviar Recordatorio">
                    <Send className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon"
                    onClick={() => toast.info("Descarga de PDF próximamente.", { description: "Generación de PDFs disponible en la siguiente versión." })}
                    className="text-vensato-text-secondary hover:text-vensato-text-main rounded-full h-8 w-8 hover:bg-vensato-border-subtle/50" title="Descargar PDF">
                    <ArrowDownToLine className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon"
                    onClick={() => toast.info("Opciones adicionales próximamente.")}
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
