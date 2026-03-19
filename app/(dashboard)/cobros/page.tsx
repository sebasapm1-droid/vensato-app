"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAppStore } from "@/lib/store/app-store";
import { Plus, ArrowDownToLine, Send, MoreHorizontal, X, Loader2, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { downloadPDF } from "@/lib/utils/pdf-download";
import { CuentaDeCobro } from "@/components/pdf/CuentaDeCobro";
import React from "react";

type Tab = "pending" | "overdue" | "paid" | "all";
const STATUS_LABELS = { pending: "Pendiente", paid: "Pagado", overdue: "Vencido" };
const STATUS_STYLES = {
  paid: "bg-vensato-success/10 text-vensato-success border-vensato-success/20",
  pending: "bg-vensato-border-subtle/50 text-vensato-text-main border-vensato-border-subtle",
  overdue: "bg-red-100 text-red-700 border-red-200",
};

export default function CobrosPage() {
  const { charges, addCharge, updateChargeStatus, deleteCharge, tenants, userConfig } = useAppStore();
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [showModal, setShowModal] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [form, setForm] = useState({ tenantId: "", concept: "", amount: "", dueDate: "" });

  const filtered = charges.filter(c => activeTab === "all" ? true : c.status === activeTab);
  const tabs: { key: Tab; label: string }[] = [
    { key: "pending", label: `Pendientes (${charges.filter(c => c.status === "pending").length})` },
    { key: "overdue", label: `Vencidos (${charges.filter(c => c.status === "overdue").length})` },
    { key: "paid", label: "Pagados" },
    { key: "all", label: "Todos" },
  ];

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const tenant = tenants.find(t => t.id === form.tenantId);
    if (!tenant) { toast.error("Selecciona un inquilino."); return; }
    addCharge({
      tenantId: tenant.id, tenant: tenant.fullName, property: tenant.property,
      concept: form.concept, amount: Number(form.amount), dueDate: form.dueDate, status: "pending",
    });
    toast.success("Cobro creado exitosamente.");
    setShowModal(false);
    setForm({ tenantId: "", concept: "", amount: "", dueDate: "" });
  }

  async function handleDownload(c: typeof charges[0]) {
    const tenantData = tenants.find(t => t.id === c.tenantId);
    setDownloading(c.id);
    try {
      await downloadPDF(
        React.createElement(CuentaDeCobro, {
          charge: c,
          tenant: { cedula: tenantData?.cedula, email: tenantData?.email, phone: tenantData?.phone },
          owner: userConfig,
        }),
        `CuentaCobro_${c.tenant.replace(/\s+/g, "_")}_${c.dueDate}.pdf`
      );
      toast.success("Cuenta de cobro descargada.");
    } catch (err) {
      toast.error("Error al generar el PDF.");
      console.error(err);
    } finally {
      setDownloading(null);
    }
  }

  const formatCOP = (v: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v);

  async function handleDelete(id: string) {
    try {
      await deleteCharge(id);
      toast.success("Cobro eliminado.");
    } catch {
      toast.error("No se pudo eliminar el cobro.");
    }
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-vensato-surface rounded-2xl p-8 w-full max-w-md shadow-2xl border border-vensato-border-subtle">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-heading font-bold text-xl text-vensato-text-main">Nuevo Cobro</h3>
              <button onClick={() => setShowModal(false)}><X className="h-5 w-5 text-vensato-text-secondary" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-vensato-text-main">Inquilino *</label>
                <select value={form.tenantId} onChange={e => setForm(f => ({ ...f, tenantId: e.target.value }))} required
                  className="w-full h-10 rounded-md border border-vensato-border-subtle bg-vensato-base px-3 text-sm text-vensato-text-main focus:outline-none focus:ring-2 focus:ring-vensato-brand-primary">
                  <option value="">— Seleccionar inquilino —</option>
                  {tenants.map(t => <option key={t.id} value={t.id}>{t.fullName} · {t.property}</option>)}
                </select>
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

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-vensato-border-subtle pb-px overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 font-medium text-sm whitespace-nowrap transition-colors ${activeTab === tab.key ? "text-vensato-brand-primary border-b-2 border-vensato-brand-primary" : "text-vensato-text-secondary hover:text-vensato-text-main"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <Card className="rounded-xl shadow-sm border-vensato-border-subtle bg-vensato-surface overflow-hidden">
        <Table>
          <TableHeader className="bg-vensato-base border-b border-vensato-border-subtle">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-medium text-vensato-text-secondary h-12">Concepto</TableHead>
              <TableHead className="font-medium text-vensato-text-secondary hidden md:table-cell h-12">Inquilino</TableHead>
              <TableHead className="font-medium text-vensato-text-secondary h-12">Monto</TableHead>
              <TableHead className="font-medium text-vensato-text-secondary hidden lg:table-cell h-12">Vencimiento</TableHead>
              <TableHead className="font-medium text-vensato-text-secondary h-12">Estado</TableHead>
              <TableHead className="w-[130px] h-12 text-right">Acciones</TableHead>
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
                  <Badge variant="outline" className={`font-medium ${STATUS_STYLES[c.status]}`}>{STATUS_LABELS[c.status]}</Badge>
                </TableCell>
                <TableCell className="py-4 text-right" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-end items-center space-x-1">
                    {/* Send reminder */}
                    <Button variant="ghost" size="icon" title="Enviar recordatorio"
                      onClick={() => toast.info("Recordatorio enviado.", { description: `Se notificará a ${c.tenant}.` })}
                      className="text-vensato-brand-primary hover:bg-vensato-brand-primary/10 rounded-full h-8 w-8">
                      <Send className="h-4 w-4" />
                    </Button>
                    {/* PDF Download */}
                    <Button variant="ghost" size="icon" title="Descargar cuenta de cobro"
                      disabled={downloading === c.id}
                      onClick={() => handleDownload(c)}
                      className="text-vensato-text-secondary hover:text-vensato-text-main rounded-full h-8 w-8 hover:bg-vensato-border-subtle/50">
                      {downloading === c.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <ArrowDownToLine className="h-4 w-4" />
                      }
                    </Button>
                    {/* Status menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-full text-vensato-text-secondary hover:text-vensato-text-main hover:bg-vensato-border-subtle/50 transition-colors">
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="bottom" align="end" className="min-w-[200px]">
                        {(["paid", "pending", "overdue"] as const).map(s => (
                          <DropdownMenuItem key={s}
                            onClick={() => { updateChargeStatus(c.id, s); toast.success(`Cobro marcado como ${STATUS_LABELS[s]}.`); }}
                            className={c.status === s ? "font-bold text-vensato-brand-primary" : ""}>
                            Marcar como {STATUS_LABELS[s]}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onClick={() => handleDelete(c.id)}>
                          <Trash2 className="h-4 w-4" /> Eliminar cobro
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
