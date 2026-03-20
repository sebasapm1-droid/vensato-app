"use client";

import { useAppStore } from "@/lib/store/app-store";
import { Card } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import { TrendingUp, Building2, AlertCircle, Lock } from "lucide-react";
import { PlanGate } from "@/components/PlanGate";
import { Button } from "@/components/ui/button";

const COLORS = ["#6B9080", "#E07A5F", "#F2CC8F", "#81B29A", "#3D405B"];

const formatCOP = (v: number) => {
  if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `$${(v / 1000).toFixed(0)}K`;
  return `$${v}`;
};

const MONTHS = ["Oct", "Nov", "Dic", "Ene", "Feb", "Mar"];

export default function ReportesPage() {
  const { properties, charges } = useAppStore();

  // KPIs
  const totalRent = properties.reduce((s, p) => s + p.currentRent, 0);
  const totalMonthlyExpenses = properties.reduce((s, p) => s + p.adminFee + p.predialAnnual / 12, 0);
  const netMonthlyIncome = totalRent - totalMonthlyExpenses;
  const occupiedCount = properties.filter(p => p.status === "occupied").length;
  const occupancyRate = properties.length ? Math.round((occupiedCount / properties.length) * 100) : 0;
  const avgCapRate = properties.length ? (properties.reduce((s, p) => s + p.capRate, 0) / properties.length).toFixed(1) : "0";
  const overdueTotal = charges.filter(c => c.status === "overdue").reduce((s, c) => s + c.amount, 0);

  // Gráfica: ingresos y gastos actuales planos por mes (sin incremento artificial)
  // El incremento real ocurre cada 12 meses según IPC del contrato
  const monthlyData = MONTHS.map((m) => ({
    mes: m,
    ingresos: totalRent,
    gastos: totalMonthlyExpenses,
  }));

  // Cap rate per property
  const capRateData = properties.map(p => ({ name: p.alias.split(" - ")[0], capRate: p.capRate }));

  // Occupancy Pie
  const occupancyPie = [
    { name: "Ocupadas", value: occupiedCount },
    { name: "Vacantes", value: properties.length - occupiedCount },
  ];

  const fmt = (v: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v);
  const kpis = [
    { label: "Ingreso Neto Mensual", value: fmt(netMonthlyIncome), icon: <TrendingUp className="h-5 w-5 text-vensato-brand-primary" />, sub: "Cánones − admin − predial/12" },
    { label: "Ingreso Bruto Mensual", value: fmt(totalRent), icon: <TrendingUp className="h-5 w-5 text-vensato-brand-primary" />, sub: "Suma de cánones activos" },
    { label: "Tasa de Ocupación", value: `${occupancyRate}%`, icon: <Building2 className="h-5 w-5 text-vensato-brand-primary" />, sub: `${occupiedCount} de ${properties.length} propiedades` },
    { label: "Cap Rate Promedio (neto)", value: `${avgCapRate}%`, icon: <TrendingUp className="h-5 w-5 text-vensato-brand-primary" />, sub: "NOI anual / precio de compra" },
    { label: "Saldo en Mora", value: fmt(overdueTotal), icon: <AlertCircle className="h-5 w-5 text-red-500" />, sub: `${charges.filter(c => c.status === "overdue").length} cobros vencidos` },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading font-bold text-2xl text-vensato-text-main">Reportes Financieros</h1>
        <p className="text-vensato-text-secondary text-sm mt-1">Análisis de rentabilidad y flujo de caja del portafolio</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map(k => (
          <Card key={k.label} className="p-5 border-vensato-border-subtle bg-vensato-surface shadow-sm rounded-xl">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 bg-vensato-base rounded-lg">{k.icon}</div>
            </div>
            <p className="text-xl font-bold font-heading text-vensato-text-main">{k.value}</p>
            <p className="text-xs font-semibold text-vensato-text-main mt-0.5">{k.label}</p>
            <p className="text-xs text-vensato-text-secondary mt-0.5">{k.sub}</p>
          </Card>
        ))}
      </div>

      <PlanGate
        feature="hasReportesAvanzados"
        fallback={
          <Card className="p-12 border-vensato-border-subtle bg-vensato-surface shadow-sm rounded-xl flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-vensato-brand-primary/10 flex items-center justify-center">
              <Lock className="h-6 w-6 text-vensato-brand-primary" />
            </div>
            <div className="space-y-1">
              <p className="font-heading font-bold text-lg text-vensato-text-main">Reportes avanzados bloqueados</p>
              <p className="text-sm text-vensato-text-secondary max-w-sm">
                Las gráficas de ingresos, gastos, ocupación y cap rate están disponibles desde el plan{" "}
                <span className="font-semibold text-vensato-brand-primary">Portafolio</span>.
              </p>
            </div>
            <Button onClick={() => window.location.href = "/pricing"} className="bg-vensato-brand-primary hover:bg-[#5C7D6E] text-white">
              Ver planes
            </Button>
          </Card>
        }
      >
        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="col-span-2 p-6 border-vensato-border-subtle bg-vensato-surface shadow-sm rounded-xl">
            <h3 className="font-heading font-bold text-base text-vensato-text-main mb-1">Ingresos vs Gastos</h3>
            <p className="text-xs text-vensato-text-secondary mb-5">Últimos 6 meses</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={formatCOP} tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: any) => [new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Number(v))]} />
                <Legend />
                <Line type="monotone" dataKey="ingresos" name="Ingresos" stroke="#6B9080" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="gastos" name="Gastos" stroke="#E07A5F" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6 border-vensato-border-subtle bg-vensato-surface shadow-sm rounded-xl">
            <h3 className="font-heading font-bold text-base text-vensato-text-main mb-1">Ocupación</h3>
            <p className="text-xs text-vensato-text-secondary mb-5">Del portafolio completo</p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={occupancyPie} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value"
                  label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                  {occupancyPie.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Cap Rate per property */}
        <Card className="p-6 border-vensato-border-subtle bg-vensato-surface shadow-sm rounded-xl">
          <h3 className="font-heading font-bold text-base text-vensato-text-main mb-1">Cap Rate por Propiedad</h3>
          <p className="text-xs text-vensato-text-secondary mb-5">Retorno anual neto sobre precio de compra (%)</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={capRateData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <YAxis unit="%" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: any) => [`${Number(v).toFixed(1)}%`, "Cap Rate"]} />
              <Bar dataKey="capRate" name="Cap Rate" fill="#6B9080" radius={[6, 6, 0, 0]}>
                {capRateData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </PlanGate>
    </div>
  );
}
