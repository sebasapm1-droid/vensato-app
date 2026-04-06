"use client";

import { useState } from "react";
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
  useAppStore,
  type AdditionalContact,
  type Property,
} from "@/lib/store/app-store";
import { formatCOP } from "@/lib/utils/mock-data";
import { Plus, MoreHorizontal, X, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { usePlan } from "@/hooks/usePlan";
import { UpgradeModal } from "@/components/UpgradeModal";

const propertyTypes = [
  "Apartamento",
  "Casa",
  "Local",
  "Bodega",
  "Oficina",
  "Lote",
  "Finca",
];

const emptyForm = {
  alias: "",
  type: "Apartamento",
  city: "",
  neighborhood: "",
  address: "",
  areaMt2: "",
  bedrooms: "",
  bathrooms: "",
  estrato: "",
  purchasePrice: "",
  currentRent: "",
  adminFee: "",
  predialAnnual: "",
  notes: "",
  additionalContacts: [] as AdditionalContact[],
};

export default function PropiedadesPage() {
  const { properties: props, addProperty, updateProperty, deleteProperty } =
    useAppStore();
  const { canAddProperty } = usePlan();
  const [showModal, setShowModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Property | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  function openCreate() {
    if (!canAddProperty(props.length)) {
      setShowUpgradeModal(true);
      return;
    }
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
      additionalContacts: p.additionalContacts ?? [],
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
      toast.error("Completa los campos obligatorios.");
      return;
    }
    setSaving(true);
    try {
      const cleanedContacts = form.additionalContacts
        .map((contact) => ({
          ...contact,
          label: contact.label.trim(),
          name: contact.name.trim(),
          phone: contact.phone.trim(),
          email: contact.email.trim(),
        }))
        .filter(
          (contact) =>
            contact.label || contact.name || contact.phone || contact.email
        );

      const parsed = {
        areaMt2: Number(form.areaMt2),
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        estrato: Number(form.estrato),
        purchasePrice: Number(form.purchasePrice),
        currentRent: Number(form.currentRent),
        adminFee: Number(form.adminFee),
        predialAnnual: Number(form.predialAnnual),
      };

      if (editTarget) {
        await updateProperty(editTarget.id, {
          ...form,
          additionalContacts: cleanedContacts,
          ...parsed,
        });
        toast.success(`Propiedad "${form.alias}" actualizada.`);
      } else {
        await addProperty({
          id: "",
          ...form,
          additionalContacts: cleanedContacts,
          ...parsed,
          capRate: 0,
          status: "vacant",
          tenant: null,
        } as Property);
        toast.success(`Propiedad "${form.alias}" creada.`);
      }
      setShowModal(false);
    } catch {
      toast.error("Error al guardar la propiedad. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  const f =
    (field: string) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  function updateContact(index: number, field: keyof AdditionalContact, value: string) {
    setForm((prev) => ({
      ...prev,
      additionalContacts: prev.additionalContacts.map((contact, contactIndex) =>
        contactIndex === index ? { ...contact, [field]: value } : contact
      ),
    }));
  }

  function addAdditionalContact() {
    setForm((prev) => ({
      ...prev,
      additionalContacts: [
        ...prev.additionalContacts,
        {
          id: `contact-${Date.now()}-${prev.additionalContacts.length}`,
          label: "",
          name: "",
          phone: "",
          email: "",
        },
      ],
    }));
  }

  function removeAdditionalContact(index: number) {
    setForm((prev) => ({
      ...prev,
      additionalContacts: prev.additionalContacts.filter(
        (_, contactIndex) => contactIndex !== index
      ),
    }));
  }

  return (
    <div className="space-y-6">
      {showUpgradeModal && (
        <UpgradeModal
          feature="maxProperties"
          onClose={() => setShowUpgradeModal(false)}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-vensato-text-main">
            Propiedades
          </h1>
          <p className="mt-1 text-sm text-vensato-text-secondary">
            Gestión de tu portafolio inmobiliario
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="flex items-center bg-vensato-brand-primary font-ui text-white hover:bg-[#5C7D6E]"
        >
          <Plus className="mr-2 h-4 w-4" /> Nueva Propiedad
        </Button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-vensato-border-subtle bg-vensato-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-vensato-border-subtle p-6">
              <h3 className="font-heading text-xl font-bold text-vensato-text-main">
                {editTarget ? "Editar Propiedad" : "Nueva Propiedad"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-vensato-text-secondary hover:text-vensato-text-main"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto">
              <div className="space-y-5 p-6">
                <div>
                  <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-vensato-text-secondary">
                    Identificación
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-1.5">
                      <label className="text-sm font-semibold text-vensato-text-main">
                        Alias / Nombre *
                      </label>
                      <Input
                        value={form.alias}
                        onChange={f("alias")}
                        placeholder="Apt 301 - Laureles"
                        className="h-10 border-vensato-border-subtle bg-vensato-base"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-vensato-text-main">
                        Tipo *
                      </label>
                      <select
                        value={form.type}
                        onChange={f("type")}
                        className="h-10 w-full rounded-md border border-vensato-border-subtle bg-vensato-base px-3 text-sm text-vensato-text-main focus:outline-none focus:ring-2 focus:ring-vensato-brand-primary"
                      >
                        {propertyTypes.map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-vensato-text-main">
                        Estrato
                      </label>
                      <Input
                        type="number"
                        min={1}
                        max={6}
                        value={form.estrato}
                        onChange={f("estrato")}
                        placeholder="4"
                        className="h-10 border-vensato-border-subtle bg-vensato-base"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-vensato-text-main">
                        Ciudad *
                      </label>
                      <Input
                        value={form.city}
                        onChange={f("city")}
                        placeholder="Medellín"
                        className="h-10 border-vensato-border-subtle bg-vensato-base"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-vensato-text-main">
                        Barrio
                      </label>
                      <Input
                        value={form.neighborhood}
                        onChange={f("neighborhood")}
                        placeholder="Laureles"
                        className="h-10 border-vensato-border-subtle bg-vensato-base"
                      />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <label className="text-sm font-semibold text-vensato-text-main">
                        Dirección
                      </label>
                      <Input
                        value={form.address}
                        onChange={f("address")}
                        placeholder="Cra 76 # 34-21 Apt 301"
                        className="h-10 border-vensato-border-subtle bg-vensato-base"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-vensato-text-secondary">
                    Características
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-vensato-text-main">
                        Área m²
                      </label>
                      <Input
                        type="number"
                        value={form.areaMt2}
                        onChange={f("areaMt2")}
                        placeholder="72"
                        className="h-10 border-vensato-border-subtle bg-vensato-base"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-vensato-text-main">
                        Habitaciones
                      </label>
                      <Input
                        type="number"
                        value={form.bedrooms}
                        onChange={f("bedrooms")}
                        placeholder="2"
                        className="h-10 border-vensato-border-subtle bg-vensato-base"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-vensato-text-main">
                        Baños
                      </label>
                      <Input
                        type="number"
                        value={form.bathrooms}
                        onChange={f("bathrooms")}
                        placeholder="2"
                        className="h-10 border-vensato-border-subtle bg-vensato-base"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-vensato-text-secondary">
                    Información Financiera (COP)
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-vensato-text-main">
                        Precio de Compra
                      </label>
                      <Input
                        type="number"
                        value={form.purchasePrice}
                        onChange={f("purchasePrice")}
                        placeholder="280000000"
                        className="h-10 border-vensato-border-subtle bg-vensato-base"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-vensato-text-main">
                        Canon de Arriendo *
                      </label>
                      <Input
                        type="number"
                        value={form.currentRent}
                        onChange={f("currentRent")}
                        placeholder="2800000"
                        className="h-10 border-vensato-border-subtle bg-vensato-base"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-vensato-text-main">
                        Administración (mensual)
                      </label>
                      <Input
                        type="number"
                        value={form.adminFee}
                        onChange={f("adminFee")}
                        placeholder="250000"
                        className="h-10 border-vensato-border-subtle bg-vensato-base"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-vensato-text-main">
                        Predial (anual)
                      </label>
                      <Input
                        type="number"
                        value={form.predialAnnual}
                        onChange={f("predialAnnual")}
                        placeholder="1200000"
                        className="h-10 border-vensato-border-subtle bg-vensato-base"
                      />
                    </div>
                  </div>
                  {form.purchasePrice && form.currentRent && (
                    <p className="mt-2 text-xs font-semibold text-vensato-brand-primary">
                      Cap Rate estimado (neto):{" "}
                      {(
                        ((Number(form.currentRent) * 12 -
                          Number(form.adminFee) * 12 -
                          Number(form.predialAnnual)) /
                          Number(form.purchasePrice)) *
                        100
                      ).toFixed(2)}
                      %
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-vensato-text-main">
                    Notas
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={f("notes")}
                    rows={2}
                    placeholder="Observaciones adicionales..."
                    className="w-full resize-none rounded-md border border-vensato-border-subtle bg-vensato-base px-3 py-2 text-sm text-vensato-text-main placeholder:text-vensato-text-secondary focus:outline-none focus:ring-2 focus:ring-vensato-brand-primary"
                  />
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-vensato-text-secondary">
                        Contactos adicionales
                      </h4>
                      <p className="mt-1 text-xs text-vensato-text-secondary">
                        Agrega contactos como administración, portería o
                        mantenimiento.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addAdditionalContact}
                      className="border-vensato-border-subtle"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar contacto
                    </Button>
                  </div>

                  {form.additionalContacts.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-vensato-border-subtle bg-vensato-base/50 px-4 py-4 text-sm text-vensato-text-secondary">
                      Esta propiedad no tiene contactos adicionales todavía.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {form.additionalContacts.map((contact, index) => (
                        <div
                          key={contact.id}
                          className="grid grid-cols-1 gap-3 rounded-xl border border-vensato-border-subtle bg-vensato-base/40 p-4 md:grid-cols-[1fr_1.2fr_1fr_1.2fr_auto]"
                        >
                          <Input
                            value={contact.label}
                            onChange={(event) =>
                              updateContact(index, "label", event.target.value)
                            }
                            placeholder="Tipo de contacto"
                            className="h-10 border-vensato-border-subtle bg-vensato-base"
                          />
                          <Input
                            value={contact.name}
                            onChange={(event) =>
                              updateContact(index, "name", event.target.value)
                            }
                            placeholder="Nombre del contacto"
                            className="h-10 border-vensato-border-subtle bg-vensato-base"
                          />
                          <Input
                            value={contact.phone}
                            onChange={(event) =>
                              updateContact(index, "phone", event.target.value)
                            }
                            placeholder="Teléfono"
                            className="h-10 border-vensato-border-subtle bg-vensato-base"
                          />
                          <Input
                            value={contact.email}
                            onChange={(event) =>
                              updateContact(index, "email", event.target.value)
                            }
                            placeholder="Correo"
                            className="h-10 border-vensato-border-subtle bg-vensato-base"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => removeAdditionalContact(index)}
                            className="h-10 text-red-500 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-3 p-6 pt-0">
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
                  {editTarget ? "Guardar Cambios" : "Crear Propiedad"}
                  {saving && <span className="ml-2">...</span>}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Card className="overflow-hidden rounded-xl border-vensato-border-subtle bg-vensato-surface shadow-sm">
        <Table>
          <TableHeader className="border-b border-vensato-border-subtle bg-vensato-base">
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-12 font-medium text-vensato-text-secondary">
                Propiedad
              </TableHead>
              <TableHead className="hidden h-12 font-medium text-vensato-text-secondary md:table-cell">
                Tipo / Ciudad
              </TableHead>
              <TableHead className="h-12 font-medium text-vensato-text-secondary">
                Canon
              </TableHead>
              <TableHead className="hidden h-12 font-medium text-vensato-text-secondary lg:table-cell">
                Precio Compra
              </TableHead>
              <TableHead className="hidden h-12 font-medium text-vensato-text-secondary lg:table-cell">
                Cap Rate
              </TableHead>
              <TableHead className="h-12 font-medium text-vensato-text-secondary">
                Estado
              </TableHead>
              <TableHead className="h-12 w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {props.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-12 text-center text-vensato-text-secondary"
                >
                  No hay propiedades registradas.
                </TableCell>
              </TableRow>
            )}

            {props.map((p) => (
              <TableRow
                key={p.id}
                className="border-vensato-border-subtle transition-colors hover:bg-vensato-base/50"
              >
                <TableCell className="py-4">
                  <div className="font-medium text-vensato-text-main">
                    {p.alias}
                  </div>
                  {p.tenant && (
                    <div className="mt-0.5 text-xs text-vensato-text-secondary">
                      Inquilino: {p.tenant}
                    </div>
                  )}
                  {p.additionalContacts.length > 0 && (
                    <div className="mt-1 space-y-1">
                      {p.additionalContacts.slice(0, 2).map((contact) => (
                        <div
                          key={contact.id}
                          className="text-xs text-vensato-text-secondary"
                        >
                          {contact.label}: {contact.name}
                          {contact.phone ? ` · ${contact.phone}` : ""}
                          {contact.email ? ` · ${contact.email}` : ""}
                        </div>
                      ))}
                      {p.additionalContacts.length > 2 && (
                        <div className="text-xs text-vensato-text-secondary">
                          + {p.additionalContacts.length - 2} contactos más
                        </div>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell className="hidden py-4 text-vensato-text-secondary md:table-cell">
                  {p.type} · {p.city}
                </TableCell>
                <TableCell className="py-4 font-medium tabular-nums text-vensato-text-main">
                  {formatCOP(p.currentRent)}
                </TableCell>
                <TableCell className="hidden py-4 tabular-nums text-vensato-text-secondary lg:table-cell">
                  {p.purchasePrice ? formatCOP(p.purchasePrice) : "—"}
                </TableCell>
                <TableCell className="hidden py-4 font-semibold text-vensato-brand-primary lg:table-cell">
                  {p.capRate}%
                </TableCell>
                <TableCell className="py-4">
                  {p.status === "occupied" ? (
                    <Badge
                      variant="outline"
                      className="border-vensato-success/20 bg-vensato-success/10 text-vensato-success"
                    >
                      Ocupada
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-vensato-warning/20 bg-vensato-warning/10 text-vensato-warning"
                    >
                      Vacante
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="py-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-full text-vensato-text-secondary transition-colors hover:bg-vensato-border-subtle/50 hover:text-vensato-text-main">
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      side="bottom"
                      align="end"
                      className="min-w-[160px]"
                    >
                      <DropdownMenuItem onClick={() => openEdit(p)}>
                        <Pencil className="h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => handleDelete(p.id, p.alias)}
                      >
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
