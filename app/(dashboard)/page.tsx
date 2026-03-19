import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockKpis, formatCOP } from "@/lib/utils/mock-data";
import { ArrowUpRight, Building2, Wallet, AlertCircle } from "lucide-react";

export default function DashboardPage() {
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
            <div className="text-2xl font-bold tabular-nums text-vensato-text-main">{formatCOP(mockKpis.monthlyIncome)}</div>
            <p className="text-xs text-vensato-success flex items-center mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" /> +2.5% vs mes anterior
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm border-vensato-border-subtle bg-vensato-surface">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-vensato-text-secondary">Pagos Pendientes</CardTitle>
            <AlertCircle className="h-4 w-4 text-vensato-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-vensato-text-main">{mockKpis.pendingPayments}</div>
            <p className="text-xs text-vensato-text-secondary mt-1">Cobros próximos a vencer</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm border-vensato-border-subtle bg-vensato-surface">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-vensato-text-secondary">Cap Rate Promedio</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-vensato-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-vensato-text-main">{mockKpis.capRate}%</div>
            <p className="text-xs text-vensato-text-secondary mt-1">Del portafolio actual</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm border-vensato-border-subtle bg-vensato-surface">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-vensato-text-secondary">Propiedades Activas</CardTitle>
            <Building2 className="h-4 w-4 text-vensato-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-vensato-text-main">{mockKpis.activeProperties}</div>
            <p className="text-xs text-vensato-text-secondary mt-1">1 vacante</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2 rounded-xl shadow-sm border-vensato-border-subtle bg-vensato-surface">
           <CardHeader>
             <CardTitle className="font-heading text-lg">Ingresos Históricos</CardTitle>
           </CardHeader>
           <CardContent className="h-72 flex flex-col items-center justify-center border-t border-vensato-border-subtle bg-vensato-base/50 rounded-b-xl relative">
             <div className="w-full h-full p-6 flex items-end justify-around space-x-2">
                {[40, 70, 45, 90, 65, 100].map((h, i) => (
                  <div key={i} className="w-12 bg-vensato-brand-primary/80 rounded-t-sm transition-all hover:bg-vensato-brand-primary" style={{ height: `${h}%` }}></div>
                ))}
             </div>
             <p className="text-sm font-medium text-vensato-text-secondary absolute mb-8 bg-white/80 px-4 py-2 rounded-lg shadow-sm border border-vensato-border-subtle backdrop-blur-sm">Gráfico Recharts renderizado aquí</p>
           </CardContent>
        </Card>
        
        <Card className="rounded-xl shadow-sm border-vensato-border-subtle bg-vensato-surface">
           <CardHeader>
             <CardTitle className="font-heading text-lg">Próximos Cobros</CardTitle>
           </CardHeader>
           <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-vensato-border-subtle pb-3">
                  <div>
                    <p className="font-medium text-sm text-vensato-text-main">Apt 301 - Laureles</p>
                    <p className="text-xs text-vensato-text-secondary mt-0.5">Carlos M. - Arriendo</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-vensato-text-main">{formatCOP(2800000)}</p>
                    <p className="text-xs text-vensato-warning mt-0.5">Vence en 2 días</p>
                  </div>
                </div>
                 <div className="flex justify-between items-center pb-2">
                  <div>
                    <p className="font-medium text-sm text-vensato-text-main">Local Comercial</p>
                    <p className="text-xs text-vensato-text-secondary mt-0.5">Tech Store - Arriendo</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-vensato-text-main">{formatCOP(4500000)}</p>
                    <p className="text-xs text-vensato-text-secondary mt-0.5">Vence en 5 días</p>
                  </div>
                </div>
              </div>
           </CardContent>
        </Card>
      </div>
    </div>
  );
}
