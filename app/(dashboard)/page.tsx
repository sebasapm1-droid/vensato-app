export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* KPI Cards Placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-vensato-surface p-6 rounded-xl shadow-sm border border-vensato-border-subtle">
          <p className="text-sm text-vensato-text-secondary">Ingresos del Mes</p>
          <p className="text-2xl font-bold mt-2 tabular-nums">$0</p>
        </div>
        <div className="bg-vensato-surface p-6 rounded-xl shadow-sm border border-vensato-border-subtle">
          <p className="text-sm text-vensato-text-secondary">Pagos Pendientes</p>
          <p className="text-2xl font-bold mt-2 tabular-nums text-vensato-warning">0</p>
        </div>
        <div className="bg-vensato-surface p-6 rounded-xl shadow-sm border border-vensato-border-subtle">
          <p className="text-sm text-vensato-text-secondary">Cap Rate Promedio</p>
          <p className="text-2xl font-bold mt-2 tabular-nums text-vensato-success">0.0%</p>
        </div>
        <div className="bg-vensato-surface p-6 rounded-xl shadow-sm border border-vensato-border-subtle">
          <p className="text-sm text-vensato-text-secondary">Propiedades Activas</p>
          <p className="text-2xl font-bold mt-2 tabular-nums">0</p>
        </div>
      </div>

      <div className="bg-vensato-surface p-6 rounded-xl shadow-sm border border-vensato-border-subtle min-h-64 flex items-center justify-center">
        <p className="text-vensato-text-secondary">Gráfico de ingresos (Próximamente)</p>
      </div>
    </div>
  );
}
