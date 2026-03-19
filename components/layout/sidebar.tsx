"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  Wallet,
  FileText,
  FolderOpen,
  PieChart,
  Settings,
  LogOut,
} from "lucide-react";
import { logout } from "@/app/actions/auth";
import { toast } from "sonner";

export function Sidebar() {
  const router = useRouter();

  async function handleLogout() {
    await logout();
    toast.success("Sesión cerrada. ¡Hasta pronto!");
    router.push("/login");
  }

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
        <SidebarLink href="/cobros" icon={<Wallet size={20} />} label="Cobros" badge="3" />
        <SidebarLink href="/contratos" icon={<FileText size={20} />} label="Contratos" />
        <SidebarLink href="/documentos" icon={<FolderOpen size={20} />} label="Documentos" />
        <SidebarLink href="/reportes" icon={<PieChart size={20} />} label="Reportes" />
      </nav>

      <div className="p-4 border-t border-vensato-border-subtle space-y-1">
        <SidebarLink href="/configuracion" icon={<Settings size={20} />} label="Configuración" />
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-vensato-text-secondary hover:bg-red-50 hover:text-red-600 transition-colors group"
          title="Cerrar sesión de forma segura"
        >
          <LogOut size={20} className="group-hover:text-red-500 transition-colors" />
          <span className="font-ui font-medium text-sm">Cerrar Sesión</span>
        </button>

        <div className="mt-3 flex items-center space-x-3 px-2 pt-3 border-t border-vensato-border-subtle">
          <div className="w-8 h-8 rounded-full bg-vensato-brand-primary flex items-center justify-center text-vensato-surface font-ui text-sm font-medium shrink-0">
            SA
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-vensato-text-main truncate">Sebastián A.</p>
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
