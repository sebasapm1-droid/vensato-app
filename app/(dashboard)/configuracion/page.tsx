import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ConfiguracionPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-heading font-bold text-2xl text-vensato-text-main">Configuración</h1>
        <p className="text-vensato-text-secondary text-sm mt-1">Preferencias de cuenta y facturación</p>
      </div>

      <div className="flex space-x-1 border-b border-vensato-border-subtle pb-px overflow-x-auto">
         <button className="px-4 py-2 font-medium text-sm text-vensato-brand-primary border-b-2 border-vensato-brand-primary whitespace-nowrap">Perfil</button>
         <button className="px-4 py-2 font-medium text-sm text-vensato-text-secondary hover:text-vensato-text-main transition-colors whitespace-nowrap">Plan y Facturación</button>
         <button className="px-4 py-2 font-medium text-sm text-vensato-text-secondary hover:text-vensato-text-main transition-colors whitespace-nowrap">Notificaciones</button>
         <button className="px-4 py-2 font-medium text-sm text-vensato-text-secondary hover:text-vensato-text-main transition-colors whitespace-nowrap">Integraciones</button>
      </div>

      <Card className="rounded-xl shadow-sm border-vensato-border-subtle bg-vensato-surface">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Datos Personales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                 <label className="text-xs font-semibold uppercase text-vensato-text-secondary">Nombre Completo</label>
                 <Input defaultValue="Sebastián Aristizábal" className="bg-vensato-base border-vensato-border-subtle focus-visible:ring-vensato-brand-primary h-10" />
              </div>
              <div className="space-y-1.5">
                 <label className="text-xs font-semibold uppercase text-vensato-text-secondary">Cédula / NIT</label>
                 <Input defaultValue="1020304050" className="bg-vensato-base border-vensato-border-subtle focus-visible:ring-vensato-brand-primary h-10" />
              </div>
              <div className="space-y-1.5">
                 <label className="text-xs font-semibold uppercase text-vensato-text-secondary">Email de Contacto</label>
                 <Input defaultValue="admin@vensato.com" type="email" className="bg-vensato-base border-vensato-border-subtle focus-visible:ring-vensato-brand-primary h-10" />
              </div>
              <div className="space-y-1.5">
                 <label className="text-xs font-semibold uppercase text-vensato-text-secondary">Teléfono</label>
                 <Input defaultValue="+57 320 000 0000" className="bg-vensato-base border-vensato-border-subtle focus-visible:ring-vensato-brand-primary h-10" />
              </div>
           </div>
           
           <div className="pt-5 border-t border-vensato-border-subtle flex justify-end">
              <Button className="bg-vensato-brand-primary hover:bg-[#5C7D6E] text-white">Guardar Cambios</Button>
           </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-sm border-vensato-border-subtle bg-vensato-surface">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Datos Bancarios para Recaudo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                 <label className="text-xs font-semibold uppercase text-vensato-text-secondary">Banco</label>
                 <Input defaultValue="Bancolombia" className="bg-vensato-base border-vensato-border-subtle focus-visible:ring-vensato-brand-primary h-10" />
              </div>
              <div className="space-y-1.5">
                 <label className="text-xs font-semibold uppercase text-vensato-text-secondary">Tipo de Cuenta</label>
                 <Input defaultValue="Ahorros" className="bg-vensato-base border-vensato-border-subtle focus-visible:ring-vensato-brand-primary h-10" />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                 <label className="text-xs font-semibold uppercase text-vensato-text-secondary">Número de Cuenta</label>
                 <Input defaultValue="0000-0000-0000-0000" className="bg-vensato-base border-vensato-border-subtle focus-visible:ring-vensato-brand-primary h-10" />
              </div>
           </div>
           
           <div className="pt-5 border-t border-vensato-border-subtle flex justify-end">
              <Button className="bg-vensato-brand-primary hover:bg-[#5C7D6E] text-white">Actualizar Datos</Button>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
