"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store/app-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Building2, Bell, Link, Save } from "lucide-react";
import { toast } from "sonner";

const BANKS = ["Bancolombia", "Davivienda", "BBVA", "Banco de Bogotá", "Banco Popular", "Itaú", "Colpatria", "Lulo Bank", "Nu Bank", "Nequi", "Daviplata", "Ualá", "Otro"];
const ACCOUNT_TYPES = ["Ahorros", "Corriente"];

export default function ConfiguracionPage() {
  const { userConfig, updateUserConfig } = useAppStore();
  const [active, setActive] = useState("profile");
  const [form, setForm] = useState({ ...userConfig });
  const [notifs, setNotifs] = useState({ rentDue: true, contractExpiry: true, maintenance: false, reports: true });
  const [saving, setSaving] = useState(false);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateUserConfig(form);
      toast.success("Perfil y datos financieros guardados.", { description: "Esta información se usará en tus cuentas de cobro." });
    } catch {
      toast.error("Error al guardar. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  const tabs = [
    { key: "profile", label: "Perfil y Facturación", icon: <User className="h-4 w-4" /> },
    { key: "bank", label: "Datos Bancarios", icon: <Building2 className="h-4 w-4" /> },
    { key: "notifs", label: "Notificaciones", icon: <Bell className="h-4 w-4" /> },
    { key: "integrations", label: "Integraciones", icon: <Link className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-heading font-bold text-2xl text-vensato-text-main">Configuración</h1>
        <p className="text-vensato-text-secondary text-sm mt-1">Gestiona tu perfil, datos bancarios y preferencias</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-vensato-border-subtle pb-px overflow-x-auto">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActive(t.key)}
            className={`flex items-center space-x-2 px-4 py-2 font-medium text-sm whitespace-nowrap transition-colors ${active === t.key ? "text-vensato-brand-primary border-b-2 border-vensato-brand-primary" : "text-vensato-text-secondary hover:text-vensato-text-main"}`}>
            {t.icon}<span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {active === "profile" && (
        <Card className="p-6 border-vensato-border-subtle bg-vensato-surface shadow-sm rounded-xl">
          <h3 className="font-heading font-bold text-lg text-vensato-text-main mb-5">Información del Propietario</h3>
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <label className="text-sm font-semibold text-vensato-text-main">Nombre Completo *</label>
                <Input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                  placeholder="Tu nombre completo" className="bg-vensato-base border-vensato-border-subtle h-10" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-vensato-text-main">CC / NIT</label>
                <Input value={form.nit} onChange={e => setForm(f => ({ ...f, nit: e.target.value }))}
                  placeholder="1020304050" className="bg-vensato-base border-vensato-border-subtle h-10" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-vensato-text-main">Teléfono</label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+57 300 000 0000" className="bg-vensato-base border-vensato-border-subtle h-10" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <label className="text-sm font-semibold text-vensato-text-main">Correo electrónico</label>
                <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="tu@email.com" className="bg-vensato-base border-vensato-border-subtle h-10" />
              </div>
            </div>
            <div className="bg-vensato-base rounded-xl p-4 border border-vensato-border-subtle">
              <p className="text-xs font-bold uppercase tracking-widest text-vensato-text-secondary mb-3">Datos para Pago (aparecen en tus cuentas de cobro)</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-vensato-text-main">Banco</label>
                  <select value={form.bankName} onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))}
                    className="w-full h-10 rounded-md border border-vensato-border-subtle bg-vensato-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-vensato-brand-primary">
                    <option value="">— Seleccionar banco —</option>
                    {BANKS.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-vensato-text-main">Tipo de cuenta</label>
                  <select value={form.accountType} onChange={e => setForm(f => ({ ...f, accountType: e.target.value }))}
                    className="w-full h-10 rounded-md border border-vensato-border-subtle bg-vensato-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-vensato-brand-primary">
                    {ACCOUNT_TYPES.map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-vensato-text-main">Número de cuenta</label>
                  <Input value={form.accountNumber} onChange={e => setForm(f => ({ ...f, accountNumber: e.target.value }))}
                    placeholder="1234567890" className="bg-vensato-surface border-vensato-border-subtle h-10" />
                </div>
                <div className="space-y-1.5 flex flex-col justify-end">
                  <label className="text-sm font-semibold text-vensato-text-main">Llave (Opcional)</label>
                  <Input value={form.bankAccountKey || ""} onChange={e => setForm(f => ({ ...f, bankAccountKey: e.target.value }))}
                    placeholder="Ej. Número de celular" className="bg-vensato-surface border-vensato-border-subtle h-10" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-sm font-semibold text-vensato-text-main">Titular de la cuenta</label>
                  <Input value={form.accountHolder} onChange={e => setForm(f => ({ ...f, accountHolder: e.target.value }))}
                    placeholder="Mismo que el perfil si es igual" className="bg-vensato-surface border-vensato-border-subtle h-10" />
                </div>
              </div>
            </div>
            <Button type="submit" className="bg-vensato-brand-primary hover:bg-[#5C7D6E] text-white flex items-center">
              <Save className="mr-2 h-4 w-4" /> Guardar Cambios
            </Button>
          </form>
        </Card>
      )}

      {/* Bank Tab */}
      {active === "bank" && (
        <Card className="p-6 border-vensato-border-subtle bg-vensato-surface shadow-sm rounded-xl">
          <h3 className="font-heading font-bold text-lg text-vensato-text-main mb-2">Datos Bancarios</h3>
          <p className="text-sm text-vensato-text-secondary mb-5">Esta información se imprime automáticamente en tus cuentas de cobro PDF.</p>
          {userConfig.bankName ? (
            <div className="space-y-4">
              <div className="bg-vensato-base rounded-xl p-5 border border-vensato-border-subtle space-y-3">
                {[
                  { l: "Banco", v: userConfig.bankName },
                  { l: "Tipo de cuenta", v: userConfig.accountType },
                  { l: "Número", v: userConfig.accountNumber || "—" },
                  { l: "Llave", v: userConfig.bankAccountKey || "—" },
                  { l: "Titular", v: userConfig.accountHolder || userConfig.fullName || "—" },
                ].map(r => (
                  <div key={r.l} className="flex items-center justify-between text-sm">
                    <span className="text-vensato-text-secondary">{r.l}</span>
                    <span className="font-semibold text-vensato-text-main">{r.v}</span>
                  </div>
                ))}
              </div>
              <Button onClick={() => setActive("profile")} className="bg-vensato-brand-primary hover:bg-[#5C7D6E] text-white">Editar en Perfil</Button>
            </div>
          ) : (
            <div className="text-center py-10">
              <Building2 className="h-10 w-10 text-vensato-text-secondary mx-auto mb-3" />
              <p className="text-vensato-text-secondary">No has configurado tus datos bancarios aún.</p>
              <Button onClick={() => setActive("profile")} className="mt-4 bg-vensato-brand-primary hover:bg-[#5C7D6E] text-white">Ir a Perfil</Button>
            </div>
          )}
        </Card>
      )}

      {/* Notifications Tab */}
      {active === "notifs" && (
        <Card className="p-6 border-vensato-border-subtle bg-vensato-surface shadow-sm rounded-xl">
          <h3 className="font-heading font-bold text-lg text-vensato-text-main mb-5">Preferencias de Notificación</h3>
          <div className="space-y-4">
            {[
              { key: "rentDue", label: "Recordatorio de vencimiento de cobros", desc: "5 días antes de la fecha de vencimiento" },
              { key: "contractExpiry", label: "Alertas de contratos por vencer", desc: "30 días antes del vencimiento" },
              { key: "maintenance", label: "Solicitudes de mantenimiento", desc: "Cuando los inquilinos reporten novedades" },
              { key: "reports", label: "Resumen mensual del portafolio", desc: "Primer día del mes" },
            ].map(n => (
              <div key={n.key} className="flex items-center justify-between py-3 border-b border-vensato-border-subtle last:border-0">
                <div>
                  <p className="text-sm font-semibold text-vensato-text-main">{n.label}</p>
                  <p className="text-xs text-vensato-text-secondary mt-0.5">{n.desc}</p>
                </div>
                <button onClick={() => setNotifs(prev => ({ ...prev, [n.key]: !prev[n.key as keyof typeof notifs] }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifs[n.key as keyof typeof notifs] ? "bg-vensato-brand-primary" : "bg-gray-300"}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifs[n.key as keyof typeof notifs] ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
            ))}
          </div>
          <Button onClick={() => toast.success("Preferencias guardadas.")} className="mt-5 bg-vensato-brand-primary hover:bg-[#5C7D6E] text-white flex items-center">
            <Save className="mr-2 h-4 w-4" /> Guardar Preferencias
          </Button>
        </Card>
      )}

      {/* Integrations Tab */}
      {active === "integrations" && (
        <Card className="p-6 border-vensato-border-subtle bg-vensato-surface shadow-sm rounded-xl">
          <h3 className="font-heading font-bold text-lg text-vensato-text-main mb-5">Integraciones</h3>
          <div className="space-y-3">
            {[
              { name: "Wompi", desc: "Pasarela de pagos · Recibe pagos de arriendo en línea", status: "Próximamente" },
              { name: "Resend", desc: "Email transaccional · Envía cuentas de cobro por correo", status: "Próximamente" },
              { name: "Google Calendar", desc: "Sincroniza vencimientos y alertas con tu calendario", status: "Próximamente" },
            ].map(i => (
              <div key={i.name} className="flex items-center justify-between p-4 rounded-xl border border-vensato-border-subtle bg-vensato-base">
                <div>
                  <p className="text-sm font-bold text-vensato-text-main">{i.name}</p>
                  <p className="text-xs text-vensato-text-secondary mt-0.5">{i.desc}</p>
                </div>
                <span className="text-xs font-semibold text-vensato-text-secondary bg-vensato-surface border border-vensato-border-subtle px-3 py-1 rounded-full">{i.status}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
