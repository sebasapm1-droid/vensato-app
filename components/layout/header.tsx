import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Header({ user }: { user?: any }) {
  return (
    <header className="h-16 bg-vensato-surface border-b border-vensato-border-subtle sticky top-0 z-10 flex items-center justify-between px-8 shadow-sm">
      <div className="flex flex-col">
        <h2 className="font-heading font-bold text-xl text-vensato-text-main">
          Resumen del Portafolio
        </h2>
        {user && (
           <span className="text-xs text-vensato-text-secondary">Bienvenido, {user.user_metadata?.full_name || user.email}</span>
        )}
      </div>

      <div className="flex items-center space-x-4">
        <button 
           className="relative p-2 text-vensato-text-secondary hover:bg-vensato-base rounded-full transition-colors cursor-pointer"
           title="Centro de notificaciones: Aquí verás alertas de contratos por vencer."
        >
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-vensato-accent-punch rounded-full border border-vensato-surface" />
        </button>
        <Button 
           className="bg-vensato-brand-primary hover:bg-[#5C7D6E] text-white rounded-lg px-4 font-ui shadow-sm"
           title="Acción rápida: Genera un nuevo comprobante de recaudo para un inquilino al instante."
        >
          + Nuevo Cobro
        </Button>
      </div>
    </header>
  );
}
