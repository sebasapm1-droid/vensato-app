"use client";

import { useAppStore } from "@/lib/store/app-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCOP } from "@/lib/utils/mock-data";
import { ArrowUpRight, Building2, Wallet, AlertCircle, FileText } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { properties, charges, tenants, contracts } = useAppStore();

  // Live KPIs derived from store
  const monthlyIncome = properties.reduce((s, p) => s + p.currentRent, 0);
  const pendingCharges = charges.filter(c => c.status === "pending");
  const overdueCharges = charges.filter(c => c.status === "overdue");
  const occupiedCount = properties.filter(p => p.status === "occupied").length;
  const vacantCount = properties.filter(p => p.status === "vacant").length;
  const avgCapRate = properties.length
    ? (properties.reduce((s, p) => s + p.capRate, 0) / properties.length).toFixed(1)
    : "0.0";

  // Upcoming charges (pending, sorted by due date, max 5)
  const upcomingCharges = [...charges]
    .filter(c => c.status === "pending" || c.status === "overdue")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);

  // Days until due calculation
  function daysUntilDue(dueDateStr: string): number {
    const due = new Date(dueDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  const isEmpty = properties.length === 0;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-xl shadow-sm border-vensato-border-subtle bg-vensato-surface">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-vensato-text-secondary">Ingresos Totales (Mes)</CardTitle>
            <Wallet className="h-4 w-4 text-vensato-brand-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-vensato-text-main">{formatCOP(monthlyIncome)}</div>
            <p className="text-xs text-vensato-text-secondary mt-1">Suma de cánones del portafolio</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm border-vensato-border-subtle bg-vensato-surface">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-vensato-text-secondary">Cobros Pendientes</CardTitle>
            <AlertCircle className={`h-4 w-4 ${overdueCharges.length > 0 ? "text-red-500" : "text-vensato-warning"}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-vensato-text-main">{pendingCharges.length + overdueCharges.length}</div>
            <p className="text-xs text-vensato-text-secondary mt-1">
              {overdueCharges.length > 0
                ? <span className="text-red-500 font-semibold">{overdueCharges.length} vencidos</span>
                : "Sin cobros vencidos"}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm border-vensato-border-subtle bg-vensato-surface">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-vensato-text-secondary">Cap Rate Promedio</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-vensato-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-vensato-text-main">{avgCapRate}%</div>
            <p className="text-xs text-vensato-text-secondary mt-1">Del portafolio actual</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm border-vensato-border-subtle bg-vensato-surface">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-vensato-text-secondary">Propiedades</CardTitle>
            <Building2 className="h-4 w-4 text-vensato-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-vensato-text-main">{properties.length}</div>
            <p className="text-xs text-vensato-text-secondary mt-1">
              {occupiedCount} ocupadas · {vacantCount} vacantes
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Properties list */}
        <Card className="col-span-1 lg:col-span-2 rounded-xl shadow-sm border-vensato-border-subtle bg-vensato-surface">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-heading text-lg">Portafolio de Propiedades</CardTitle>
            <Link href="/propiedades" className="text-xs font-semibold text-vensato-brand-primary hover:underline">Ver todas →</Link>
          </CardHeader>
          <CardContent>
            {isEmpty ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Building2 className="h-12 w-12 text-vensato-border-subtle mb-4" />
                <p className="font-semibold text-vensato-text-main mb-1">Aún no tienes propiedades</p>
                <p className="text-sm text-vensato-text-secondary mb-4">Crea tu primera propiedad para empezar a gestionar tu portafolio.</p>
                <Link href="/propiedades"
                  className="bg-vensato-brand-primary text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#5C7D6E] transition-colors">
                  + Nueva Propiedad
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {properties.slice(0, 4).map(p => (
                  <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-vensato-border-subtle last:border-0">
                    <div>
                      <p className="font-medium text-sm text-vensato-text-main">{p.alias}</p>
                      <p className="text-xs text-vensato-text-secondary mt-0.5">{p.type} · {p.city}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-vensato-text-main">{formatCOP(p.currentRent)}</p>
                      <Badge variant="outline" className={`text-xs mt-0.5 ${p.status === "occupied" ? "bg-vensato-success/10 text-vensato-success border-vensato-success/20" : "bg-vensato-warning/10 text-vensato-warning border-vensato-warning/20"}`}>
                        {p.status === "occupied" ? "Ocupada" : "Vacante"}
                      </Badge>
                    </div>
                  </div>
                ))}
                {properties.length > 4 && (
                  <Link href="/propiedades" className="text-xs text-vensato-brand-primary hover:underline block text-center pt-1">
                    Ver {properties.length - 4} más →
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming charges */}
        <Card className="rounded-xl shadow-sm border-vensato-border-subtle bg-vensato-surface">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-heading text-lg">Próximos Cobros</CardTitle>
            <Link href="/cobros" className="text-xs font-semibold text-vensato-brand-primary hover:underline">Ver todos →</Link>
          </CardHeader>
          <CardContent>
            {upcomingCharges.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="h-10 w-10 text-vensato-border-subtle mb-3" />
                <p className="text-sm font-semibold text-vensato-text-main">Sin cobros pendientes</p>
                <p className="text-xs text-vensato-text-secondary mt-1">Los cobros aparecerán aquí cuando crees inquilinos.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingCharges.map(c => {
                  const days = daysUntilDue(c.dueDate);
                  return (
                    <div key={c.id} className="flex justify-between items-center border-b border-vensato-border-subtle pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium text-sm text-vensato-text-main">{c.property}</p>
                        <p className="text-xs text-vensato-text-secondary mt-0.5">{c.tenant} · {c.concept}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm text-vensato-text-main">{formatCOP(c.amount)}</p>
                        <p className={`text-xs mt-0.5 ${c.status === "overdue" || days < 0 ? "text-red-500 font-semibold" : days <= 3 ? "text-vensato-warning font-semibold" : "text-vensato-text-secondary"}`}>
                          {c.status === "overdue" || days < 0
                            ? `Vencido hace ${Math.abs(days)} día${Math.abs(days) !== 1 ? "s" : ""}`
                            : days === 0 ? "Vence hoy"
                            : `Vence en ${days} día${days !== 1 ? "s" : ""}`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
