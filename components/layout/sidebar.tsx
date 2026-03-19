"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Building2, Users, Wallet,
  FileText, FolderOpen, PieChart, Settings, LogOut,
} from "lucide-react";
import { logout } from "@/app/actions/auth";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store/app-store";

export function Sidebar() {
  const router = useRouter();
  const { charges, userConfig } = useAppStore();

  // Live badge: count pending + overdue charges
  const alertCharges = charges.filter(c => c.status === "pending" || c.status === "overdue").length;

  async function handleLogout() {
    await logout();
    toast.success("Sesión cerrada. ¡Hasta pronto!");
    router.push("/login");
  }

  // User initials from config or default
  const initials = userConfig.fullName
    ? userConfig.fullName.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()
    : "SA";
  const displayName = userConfig.fullName || "Mi cuenta";

  return (
    <aside className="w-64 bg-vensato-surface shadow-sm hidden lg:flex flex-col border-r border-vensato-border-subtle">
      <div className="p-6">
        <Link href="/">
          <h1 className="font-heading font-bold text-2xl text-vensato-text-main">Vensato</h1>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-1">
        <SidebarLink href="/" icon={<LayoutDashboard size={20} />} label="Dashboard" />
        <SidebarLink href="/propiedades" icon={<Building2 size={20} />} label="Propiedades" />
        <SidebarLink href="/inquilinos" icon={<Users size={20} />} label="Inquilinos" />
        <SidebarLink href="/cobros" icon={<Wallet size={20} />} label="Cobros" badge={alertCharges > 0 ? String(alertCharges) : undefined} />
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
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-vensato-text-main truncate">{displayName}</p>
            <p className="text-xs text-vensato-text-secondary">Plan Base</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function SidebarLink({
  href, icon, label, badge,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: string;
}) {
  const pathname = usePathname();
  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors group ${
        isActive
          ? "bg-vensato-brand-primary/10 text-vensato-brand-primary"
          : "text-vensato-text-secondary hover:bg-vensato-base hover:text-vensato-text-main"
      }`}
    >
      <div className="flex items-center space-x-3">
        <span className={`transition-colors ${isActive ? "text-vensato-brand-primary" : "text-vensato-text-secondary group-hover:text-vensato-brand-primary"}`}>
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
