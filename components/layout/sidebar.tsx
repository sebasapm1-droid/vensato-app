import Link from "next/link";
import {
  LayoutDashboard,
  Building2,
  Users,
  Wallet,
  FileText,
  FolderOpen,
  PieChart,
  Settings,
} from "lucide-react";

export function Sidebar() {
  return (
    <aside className="w-64 bg-vensato-surface shadow-sm hidden lg:flex flex-col border-r border-vensato-border-subtle">
      <div className="p-6">
        <Link href="/">
          <h1 className="font-heading font-bold text-2xl text-vensato-text-main">
            Vensato
          </h1>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-1">
        <SidebarLink href="/" icon={<LayoutDashboard size={20} />} label="Dashboard" />
        <SidebarLink href="/propiedades" icon={<Building2 size={20} />} label="Propiedades" />
        <SidebarLink href="/inquilinos" icon={<Users size={20} />} label="Inquilinos" />
        <SidebarLink
          href="/cobros"
          icon={<Wallet size={20} />}
          label="Cobros"
          badge="3"
        />
        <SidebarLink href="/contratos" icon={<FileText size={20} />} label="Contratos" />
        <SidebarLink href="/documentos" icon={<FolderOpen size={20} />} label="Documentos" />
        <SidebarLink href="/reportes" icon={<PieChart size={20} />} label="Reportes" />
      </nav>

      <div className="p-4 border-t border-vensato-border-subtle">
        <SidebarLink href="/configuracion" icon={<Settings size={20} />} label="Configuración" />
        <div className="mt-4 flex items-center space-x-3 px-2">
          <div className="w-8 h-8 rounded-full bg-vensato-brand-primary flex items-center justify-center text-vensato-surface font-ui text-sm font-medium">
            SA
          </div>
          <div>
            <p className="text-sm font-medium text-vensato-text-main">Sebastián A.</p>
            <p className="text-xs text-vensato-text-secondary">Plan Portafolio</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function SidebarLink({
  href,
  icon,
  label,
  badge,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between px-3 py-2.5 rounded-lg text-vensato-text-secondary hover:bg-vensato-base hover:text-vensato-text-main transition-colors group"
    >
      <div className="flex items-center space-x-3">
        <span className="text-vensato-text-secondary group-hover:text-vensato-brand-primary transition-colors">
          {icon}
        </span>
        <span className="font-ui font-medium text-sm">{label}</span>
      </div>
      {badge && (
        <span className="bg-vensato-accent-punch text-white text-xs font-bold px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </Link>
  );
}
