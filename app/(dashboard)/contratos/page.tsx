"use client";

import { useState } from "react";
import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAppStore } from "@/lib/store/app-store";
import { Plus, FileText, Trash2, ArrowDownToLine, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { downloadPDF } from "@/lib/utils/pdf-download";
import { ContratoArrendamiento } from "@/components/pdf/ContratoArrendamiento";

const INCREMENT_TYPES = ["IPC (Ley 820/2003)", "IPC + 1%", "IPC + 2%", "Fijo 5%", "Fijo 10%", "Sin incremento"];

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split("T")[0];
}

export default function ContratosPage() {
  const { contracts, addContract, deleteContract, tenants, properties, userConfig } = useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [form, setForm] = useState({
    tenantId: "", propertyId: "", startDate: new Date().toISOString().split("T")[0],
    vigencyMonths: "12", rentAmount: "", incrementType: "IPC (Ley 820/2003)",
  });

  const formatCOP = (v: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v);

  const selectedTenant = tenants.find(t => t.id === form.tenantId);
  const selectedProperty = properties.find(p => p.id === (form.propertyId || selectedTenant?.propertyId));

  function onTenantChange(tenantId: string) {
    const t = tenants.find(t => t.id === tenantId);
    setForm(f => ({
      ...f, tenantId,
      propertyId: t?.propertyId ?? "",
      rentAmount: t ? String(properties.find(p => p.id === t.propertyId)?.currentRent ?? "") : "",
    }));
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTenant) { toast.error("Selecciona un inquilino."); return; }
    const endDate = addMonths(form.startDate, Number(form.vigencyMonths));
    addContract({
      propertyId: selectedProperty?.id ?? "",
      tenantId: selectedTenant.id,
      property: selectedProperty?.alias ?? selectedTenant.property,
      tenant: selectedTenant.fullName,
      cedula: selectedTenant.cedula,
      startDate: form.startDate,
      endDate,
      vigencyMonths: Number(form.vigencyMonths),
      rentAmount: Number(form.rentAmount),
      incrementType: form.incrementType,
      status: "active",
      generatedAt: new Date().toISOString(),
      savedToVault: true,
    });
    toast.success("Contrato creado y guardado en la Bóveda Documental.", { duration: 4000 });
    setShowModal(false);
    setForm({ tenantId: "", propertyId: "", startDate: new Date().toISOString().split("T")[0], vigencyMonths: "12", rentAmount: "", incrementType: "IPC (Ley 820/2003)" });
  }

  async function handleDownload(c: typeof contracts[0]) {
    setDownloading(c.id);
    try {
      await downloadPDF(
        React.createElement(ContratoArrendamiento, { contract: c, owner: userConfig }),
        `Contrato_${c.tenant.replace(/\s+/g, "_")}.pdf`
      );
      toast.success("Contrato descargado en PDF.");
    } catch (err) {
      toast.error("Error al generar el PDF del contrato.");
      console.error(err);
    } finally {
      setDownloading(null);
    }
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-vensato-surface rounded-2xl w-full max-w-lg shadow-2xl border border-vensato-border-subtle flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-vensato-border-subtle">
              <div>
                <h3 className="font-heading font-bold text-xl text-vensato-text-main">Nuevo Contrato</h3>
                <p className="text-sm text-vensato-text-secondary mt-0.5">Se generará un PDF y se guardará en la Bóveda.</p>
              </div>
              <button onClick={() => setShowModal(false)}><X className="h-5 w-5 text-vensato-text-secondary" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-vensato-text-main">Inquilino *</label>
                <select value={form.tenantId} onChange={e => onTenantChange(e.target.value)} required
                  className="w-full h-10 rounded-md border border-vensato-border-subtle bg-vensato-base px-3 text-sm text-vensato-text-main focus:outline-none focus:ring-2 focus:ring-vensato-brand-primary">
                  <option value="">— Seleccionar inquilino —</option>
                  {tenants.map(t => <option key={t.id} value={t.id}>{t.fullName} · CC {t.cedula || "—"}</option>)}
                </select>
              </div>
              {selectedTenant && (
                <div className="bg-vensato-base rounded-lg p-3 text-sm text-vensato-text-secondary">
                  Propiedad: <span className="font-semibold text-vensato-text-main">{selectedProperty?.alias ?? selectedTenant.property}</span>
                  {selectedTenant.cedula && <span> · CC: <span className="font-semibold text-vensato-text-main">{selectedTenant.cedula}</span></span>}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-vensato-text-main">Fecha de inicio *</label>
                  <Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    className="bg-vensato-base border-vensato-border-subtle h-10" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-vensato-text-main">Vigencia *</label>
                  <select value={form.vigencyMonths} onChange={e => setForm(f => ({ ...f, vigencyMonths: e.target.value }))}
                    className="w-full h-10 rounded-md border border-vensato-border-subtle bg-vensato-base px-3 text-sm text-vensato-text-main focus:outline-none focus:ring-2 focus:ring-vensato-brand-primary">
                    {[6, 12, 18, 24, 36].map(m => <option key={m} value={m}>{m} meses</option>)}
                  </select>
                </div>
              </div>
              {form.startDate && (
                <p className="text-xs text-vensato-text-secondary">
                  Fecha fin estimada: <span className="font-semibold">{addMonths(form.startDate, Number(form.vigencyMonths))}</span>
                </p>
              )}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-vensato-text-main">Canon mensual (COP) *</label>
                <Input type="number" value={form.rentAmount} onChange={e => setForm(f => ({ ...f, rentAmount: e.target.value }))}
                  placeholder="2800000" className="bg-vensato-base border-vensato-border-subtle h-10" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-vensato-text-main">Tipo de incremento anual</label>
                <select value={form.incrementType} onChange={e => setForm(f => ({ ...f, incrementType: e.target.value }))}
                  className="w-full h-10 rounded-md border border-vensato-border-subtle bg-vensato-base px-3 text-sm text-vensato-text-main focus:outline-none focus:ring-2 focus:ring-vensato-brand-primary">
                  {INCREMENT_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex space-x-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1 border-vensato-border-subtle">Cancelar</Button>
                <Button type="submit" className="flex-1 bg-vensato-brand-primary hover:bg-[#5C7D6E] text-white">Generar Contrato</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contracts table */}
      <Card className="rounded-xl shadow-sm border-vensato-border-subtle bg-vensato-surface overflow-hidden">
        <Table>
          <TableHeader className="bg-vensato-base border-b border-vensato-border-subtle">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-medium text-vensato-text-secondary h-12">Propiedad e Inquilino</TableHead>
              <TableHead className="font-medium text-vensato-text-secondary hidden md:table-cell h-12">Vigencia</TableHead>
              <TableHead className="font-medium text-vensato-text-secondary h-12">Canon</TableHead>
              <TableHead className="font-medium text-vensato-text-secondary hidden lg:table-cell h-12">Incremento</TableHead>
              <TableHead className="font-medium text-vensato-text-secondary h-12">Estado</TableHead>
              <TableHead className="w-[100px] h-12 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-12 text-vensato-text-secondary">No hay contratos registrados.</TableCell></TableRow>
            ) : contracts.map((c: any) => (
              <TableRow key={c.id} className="hover:bg-vensato-base/50 transition-colors border-vensato-border-subtle">
                <TableCell className="py-4">
                  <div className="font-medium text-vensato-text-main flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-vensato-text-secondary shrink-0" />{c.property}
                  </div>
                  <div className="text-xs text-vensato-text-secondary mt-1 ml-6">{c.tenant}</div>
                </TableCell>
                <TableCell className="hidden md:table-cell py-4 text-sm text-vensato-text-secondary">{c.startDate} → {c.endDate}</TableCell>
                <TableCell className="font-medium tabular-nums py-4 text-vensato-text-main">{formatCOP(c.rentAmount)}</TableCell>
                <TableCell className="hidden lg:table-cell py-4 text-sm text-vensato-text-secondary">{c.incrementType}</TableCell>
                <TableCell className="py-4">
                  {c.status === "active"
                    ? <Badge variant="outline" className="bg-vensato-success/10 text-vensato-success border-vensato-success/20">Vigente</Badge>
                    : <Badge variant="outline" className="text-vensato-warning border-vensato-warning bg-vensato-warning/10">Por Vencer</Badge>
                  }
                </TableCell>
                <TableCell className="py-4 text-right">
                  <div className="flex justify-end items-center space-x-1">
                    <Button variant="ghost" size="icon" title="Descargar contrato en PDF"
                      disabled={downloading === c.id}
                      onClick={() => handleDownload(c)}
                      className="text-vensato-text-secondary hover:text-vensato-text-main rounded-full h-8 w-8 hover:bg-vensato-border-subtle/50">
                      {downloading === c.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <ArrowDownToLine className="h-4 w-4" />
                      }
                    </Button>
                    <Button variant="ghost" size="icon" title="Eliminar contrato"
                      onClick={() => { deleteContract(c.id); toast.success("Contrato eliminado."); }}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full h-8 w-8">
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
