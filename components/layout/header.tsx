"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Plus, X, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store/app-store";
import { formatCOP } from "@/lib/utils/mock-data";

export default function Header({ user }: { user?: any }) {
  const { charges } = useAppStore();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // Compute notifications: pending + overdue charges not yet dismissed
  const notifications = charges
    .filter(c => (c.status === "pending" || c.status === "overdue") && !dismissed.has(c.id))
    .sort((a, b) => {
      // Overdue first, then by due date
      if (a.status === "overdue" && b.status !== "overdue") return -1;
      if (b.status === "overdue" && a.status !== "overdue") return 1;
      return a.dueDate.localeCompare(b.dueDate);
    })
    .slice(0, 10); // cap at 10

  function dismiss(id: string) {
    setDismissed(prev => new Set([...prev, id]));
  }

  function dismissAll() {
    setDismissed(new Set(charges.map(c => c.id)));
    setOpen(false);
  }

  function daysLabel(dueDateStr: string, status: string): { label: string; urgent: boolean } {
    if (status === "overdue") return { label: "Vencido", urgent: true };
    const due = new Date(dueDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (days < 0) return { label: "Vencido", urgent: true };
    if (days === 0) return { label: "Vence hoy", urgent: true };
    if (days <= 3) return { label: `Vence en ${days} día${days !== 1 ? "s" : ""}`, urgent: true };
    return { label: `Vence en ${days} días`, urgent: false };
  }

  return (
    <header className="h-16 bg-vensato-surface border-b border-vensato-border-subtle sticky top-0 z-10 flex items-center justify-between px-8 shadow-sm">
      <div className="flex flex-col">
        <h2 className="font-heading font-bold text-xl text-vensato-text-main">
          Resumen del Portafolio
        </h2>
        {user && (
          <span className="text-xs text-vensato-text-secondary">
            Bienvenido, {user.user_metadata?.full_name || user.email}
          </span>
        )}
      </div>

      <div className="flex items-center space-x-4">
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setOpen(o => !o)}
            className="relative p-2 text-vensato-text-secondary hover:bg-vensato-base rounded-full transition-colors cursor-pointer"
            title="Centro de notificaciones"
          >
            <Bell size={20} />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-vensato-accent-punch rounded-full border border-vensato-surface animate-pulse" />
            )}
          </button>

          {/* Dropdown */}
          {open && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
              <div className="absolute right-0 top-11 z-30 w-80 bg-vensato-surface rounded-2xl shadow-2xl border border-vensato-border-subtle overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-vensato-border-subtle">
                  <div className="flex items-center space-x-2">
                    <Bell size={15} className="text-vensato-brand-primary" />
                    <span className="font-semibold text-sm text-vensato-text-main">Notificaciones</span>
                    {notifications.length > 0 && (
                      <span className="bg-vensato-accent-punch text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                        {notifications.length}
                      </span>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <button
                      onClick={dismissAll}
                      className="text-xs text-vensato-text-secondary hover:text-vensato-text-main underline"
                    >
                      Ignorar todas
                    </button>
                  )}
                </div>

                {/* Notification list */}
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                      <Bell size={32} className="text-vensato-border-subtle mb-3" />
                      <p className="text-sm font-semibold text-vensato-text-main">Sin notificaciones</p>
                      <p className="text-xs text-vensato-text-secondary mt-1">
                        Las alertas de cobros aparecerán aquí.
                      </p>
                    </div>
                  ) : (
                    notifications.map(c => {
                      const { label, urgent } = daysLabel(c.dueDate, c.status);
                      return (
                        <div
                          key={c.id}
                          className="flex items-start px-4 py-3 border-b border-vensato-border-subtle last:border-0 hover:bg-vensato-base/50 transition-colors group"
                        >
                          <div className="mt-0.5 mr-3 shrink-0">
                            {urgent
                              ? <AlertCircle size={16} className="text-vensato-accent-punch" />
                              : <Clock size={16} className="text-vensato-warning" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-vensato-text-main truncate">
                              {c.concept}
                            </p>
                            <p className="text-xs text-vensato-text-secondary truncate mt-0.5">
                              {c.tenant} · {c.property}
                            </p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs font-bold text-vensato-text-main">{formatCOP(c.amount)}</span>
                              <span className={`text-xs font-semibold ${urgent ? "text-vensato-accent-punch" : "text-vensato-warning"}`}>
                                {label}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => dismiss(c.id)}
                            title="Ignorar esta notificación"
                            className="ml-2 mt-0.5 shrink-0 text-vensato-text-secondary hover:text-vensato-text-main opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="px-4 py-2 border-t border-vensato-border-subtle bg-vensato-base/30">
                    <Link
                      href="/cobros"
                      onClick={() => setOpen(false)}
                      className="text-xs font-semibold text-vensato-brand-primary hover:underline block text-center"
                    >
                      Ver todos los cobros →
                    </Link>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <Link href="/propiedades">
          <Button
            className="bg-vensato-brand-primary hover:bg-[#5C7D6E] text-white rounded-lg px-4 font-ui shadow-sm flex items-center"
            title="Ir a Propiedades y añadir un nuevo inmueble al portafolio."
          >
            <Plus className="h-4 w-4 mr-1.5" /> Nueva Propiedad
          </Button>
        </Link>
      </div>
    </header>
  );
}
