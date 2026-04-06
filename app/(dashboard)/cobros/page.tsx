"use client";

import { useState } from "react";
import React from "react";
import {
  Plus,
  ArrowDownToLine,
  Send,
  MoreHorizontal,
  X,
  Loader2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { CuentaDeCobro } from "@/components/pdf/CuentaDeCobro";
import { UpgradeModal } from "@/components/UpgradeModal";
import { useAppStore } from "@/lib/store/app-store";
import { downloadPDF } from "@/lib/utils/pdf-download";
import { usePlan } from "@/hooks/usePlan";

type Tab = "pending" | "overdue" | "paid" | "all";

const STATUS_LABELS = {
  pending: "Pendiente",
  paid: "Pagado",
  overdue: "Vencido",
};

const STATUS_STYLES = {
  paid: "bg-vensato-success/10 text-vensato-success border-vensato-success/20",
  pending:
    "bg-vensato-border-subtle/50 text-vensato-text-main border-vensato-border-subtle",
  overdue: "bg-red-100 text-red-700 border-red-200",
};

export default function CobrosPage() {
  const {
    charges,
    addCharge,
    updateChargeStatus,
    deleteCharge,
    tenants,
    userConfig,
  } = useAppStore();
  const { can } = usePlan();

  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [showModal, setShowModal] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [form, setForm] = useState({
    tenantId: "",
    concept: "",
    amount: "",
    dueDate: "",
  });

  const canSendChargeEmail = can("hasChargeEmailManual");

  const filtered = charges.filter((charge) =>
    activeTab === "all" ? true : charge.status === activeTab
  );

  const tabs: Array<{ key: Tab; label: string }> = [
    {
      key: "pending",
      label: `Pendientes (${charges.filter((charge) => charge.status === "pending").length})`,
    },
    {
      key: "overdue",
      label: `Vencidos (${charges.filter((charge) => charge.status === "overdue").length})`,
    },
    { key: "paid", label: "Pagados" },
    { key: "all", label: "Todos" },
  ];

  function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    const tenant = tenants.find((item) => item.id === form.tenantId);

    if (!tenant) {
      toast.error("Selecciona un inquilino.");
      return;
    }

    void addCharge({
      tenantId: tenant.id,
      tenant: tenant.fullName,
      property: tenant.property,
      concept: form.concept,
      amount: Number(form.amount),
      dueDate: form.dueDate,
      status: "pending",
    });

    toast.success("Cobro creado exitosamente.");
    setShowModal(false);
    setForm({ tenantId: "", concept: "", amount: "", dueDate: "" });
  }

  async function handleDownload(charge: (typeof charges)[number]) {
    const tenantData = tenants.find((item) => item.id === charge.tenantId);
    setDownloading(charge.id);

    try {
      await downloadPDF(
        React.createElement(CuentaDeCobro, {
          charge,
          tenant: {
            cedula: tenantData?.cedula,
            email: tenantData?.email,
            phone: tenantData?.phone,
          },
          owner: userConfig,
        }),
        `CuentaCobro_${charge.tenant.replace(/\s+/g, "_")}_${charge.dueDate}.pdf`
      );
      toast.success("Cuenta de cobro descargada.");
    } catch (error) {
      toast.error("Error al generar el PDF.");
      console.error(error);
    } finally {
      setDownloading(null);
    }
  }

  async function handleSendCharge(chargeId: string) {
    if (!canSendChargeEmail) {
      setShowUpgrade(true);
      return;
    }

    setSendingId(chargeId);

    try {
      const response = await fetch(`/api/charges/${chargeId}/send`, {
        method: "POST",
      });
      const data = (await response.json().catch(() => null)) as
        | { recipientEmail?: string; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "No se pudo enviar la cuenta de cobro.");
      }

      toast.success("Cuenta de cobro enviada.", {
        description: data?.recipientEmail
          ? `Se envio a ${data.recipientEmail}.`
          : "El correo fue enviado correctamente.",
      });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo enviar la cuenta de cobro."
      );
    } finally {
      setSendingId(null);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteCharge(id);
      toast.success("Cobro eliminado.");
    } catch {
      toast.error("No se pudo eliminar el cobro.");
    }
  }

  const formatCOP = (value: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div className="space-y-6">
      {showUpgrade ? (
        <UpgradeModal
          feature="hasChargeEmailManual"
          onClose={() => setShowUpgrade(false)}
        />
      ) : null}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-vensato-text-main">
            Cobros y Recaudo
          </h1>
          <p className="mt-1 text-sm text-vensato-text-secondary">
            Control de pagos, vencimientos y facturacion
          </p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="flex items-center bg-vensato-brand-primary font-ui text-white hover:bg-[#5C7D6E]"
        >
          <Plus className="mr-2 h-4 w-4" /> Crear Cobro
        </Button>
      </div>

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-vensato-border-subtle bg-vensato-surface p-8 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="font-heading text-xl font-bold text-vensato-text-main">
                Nuevo Cobro
              </h3>
              <button type="button" onClick={() => setShowModal(false)}>
                <X className="h-5 w-5 text-vensato-text-secondary" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-vensato-text-main">
                  Inquilino *
                </label>
                <select
                  value={form.tenantId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      tenantId: event.target.value,
                    }))
                  }
                  required
                  className="h-10 w-full rounded-md border border-vensato-border-subtle bg-vensato-base px-3 text-sm text-vensato-text-main focus:outline-none focus:ring-2 focus:ring-vensato-brand-primary"
                >
                  <option value="">Seleccionar inquilino</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.fullName} · {tenant.property}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-vensato-text-main">
                  Concepto *
                </label>
                <Input
                  value={form.concept}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      concept: event.target.value,
                    }))
                  }
                  placeholder="Ej. Arriendo Abril 2026"
                  className="h-10 border-vensato-border-subtle bg-vensato-base"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-vensato-text-main">
                  Monto (COP) *
                </label>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      amount: event.target.value,
                    }))
                  }
                  placeholder="2800000"
                  className="h-10 border-vensato-border-subtle bg-vensato-base"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-vensato-text-main">
                  Fecha de Vencimiento *
                </label>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      dueDate: event.target.value,
                    }))
                  }
                  className="h-10 border-vensato-border-subtle bg-vensato-base"
                  required
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border-vensato-border-subtle"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-vensato-brand-primary text-white hover:bg-[#5C7D6E]"
                >
                  Guardar Cobro
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <div className="flex space-x-1 overflow-x-auto border-b border-vensato-border-subtle pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`whitespace-nowrap px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "border-b-2 border-vensato-brand-primary text-vensato-brand-primary"
                : "text-vensato-text-secondary hover:text-vensato-text-main"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden rounded-xl border-vensato-border-subtle bg-vensato-surface shadow-sm">
        <Table>
          <TableHeader className="border-b border-vensato-border-subtle bg-vensato-base">
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-12 font-medium text-vensato-text-secondary">
                Concepto
              </TableHead>
              <TableHead className="hidden h-12 font-medium text-vensato-text-secondary md:table-cell">
                Inquilino
              </TableHead>
              <TableHead className="h-12 font-medium text-vensato-text-secondary">
                Monto
              </TableHead>
              <TableHead className="hidden h-12 font-medium text-vensato-text-secondary lg:table-cell">
                Vencimiento
              </TableHead>
              <TableHead className="h-12 font-medium text-vensato-text-secondary">
                Estado
              </TableHead>
              <TableHead className="h-12 w-[130px] text-right">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-vensato-text-secondary"
                >
                  No hay cobros en esta categoria.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((charge) => (
                <TableRow
                  key={charge.id}
                  className="border-vensato-border-subtle transition-colors hover:bg-vensato-base/50"
                >
                  <TableCell className="py-4">
                    <div className="font-medium text-vensato-text-main">
                      {charge.concept}
                    </div>
                    <div className="mt-0.5 text-xs text-vensato-text-secondary">
                      {charge.property}
                    </div>
                  </TableCell>

                  <TableCell className="hidden py-4 text-vensato-text-main md:table-cell">
                    {charge.tenant}
                  </TableCell>

                  <TableCell className="py-4 font-medium tabular-nums text-vensato-text-main">
                    {formatCOP(charge.amount)}
                  </TableCell>

                  <TableCell className="hidden py-4 tabular-nums text-vensato-text-secondary lg:table-cell">
                    {charge.dueDate}
                  </TableCell>

                  <TableCell className="py-4">
                    <Badge
                      variant="outline"
                      className={`font-medium ${STATUS_STYLES[charge.status]}`}
                    >
                      {STATUS_LABELS[charge.status]}
                    </Badge>
                  </TableCell>

                  <TableCell
                    className="py-4 text-right"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Enviar cuenta de cobro"
                        disabled={sendingId === charge.id || charge.status === "paid"}
                        onClick={() => void handleSendCharge(charge.id)}
                        className="h-8 w-8 rounded-full text-vensato-brand-primary hover:bg-vensato-brand-primary/10"
                      >
                        {sendingId === charge.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        title="Descargar cuenta de cobro"
                        disabled={downloading === charge.id}
                        onClick={() => void handleDownload(charge)}
                        className="h-8 w-8 rounded-full text-vensato-text-secondary hover:bg-vensato-border-subtle/50 hover:text-vensato-text-main"
                      >
                        {downloading === charge.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ArrowDownToLine className="h-4 w-4" />
                        )}
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-full text-vensato-text-secondary transition-colors hover:bg-vensato-border-subtle/50 hover:text-vensato-text-main">
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          side="bottom"
                          align="end"
                          className="min-w-[200px]"
                        >
                          {(["paid", "pending", "overdue"] as const).map((status) => (
                            <DropdownMenuItem
                              key={status}
                              onClick={() => {
                                void updateChargeStatus(charge.id, status);
                                toast.success(
                                  `Cobro marcado como ${STATUS_LABELS[status]}.`
                                );
                              }}
                              className={
                                charge.status === status
                                  ? "font-bold text-vensato-brand-primary"
                                  : ""
                              }
                            >
                              Marcar como {STATUS_LABELS[status]}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => void handleDelete(charge.id)}
                          >
                            <Trash2 className="h-4 w-4" /> Eliminar cobro
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
