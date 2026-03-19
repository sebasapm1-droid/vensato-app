import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function ReportesPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-heading font-bold text-2xl text-vensato-text-main">Reportes</h1>
          <p className="text-vensato-text-secondary text-sm mt-1">Análisis financiero y rentabilidad del portafolio</p>
        </div>
        <Button variant="outline" className="border-vensato-border-subtle text-vensato-text-main hover:bg-vensato-base font-ui items-center">
          <Download className="mr-2 h-4 w-4" /> Exportar Reporte
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
         <Card className="rounded-xl shadow-sm border-vensato-border-subtle bg-vensato-surface">
           <CardHeader>
             <CardTitle className="font-heading text-lg">Resumen de Rentabilidad</CardTitle>
           </CardHeader>
           <CardContent className="h-[400px] flex items-center justify-center bg-vensato-base/50 rounded-b-xl border-t border-vensato-border-subtle">
              <div className="text-center space-y-2">
                 <p className="text-vensato-text-secondary font-medium">Módulo de visualización en desarrollo.</p>
                 <p className="text-sm text-vensato-brand-primary">Espacio reservado para flujo de caja y gráficas (NOI / Cap Rate).</p>
              </div>
           </CardContent>
         </Card>
      </div>
    </div>
  );
}
