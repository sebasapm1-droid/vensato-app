import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { mockContracts, formatCOP } from "@/lib/utils/mock-data";
import { Plus, MoreHorizontal, FileText, AlertTriangle } from "lucide-react";

export default function ContratosPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-heading font-bold text-2xl text-vensato-text-main">Contratos</h1>
          <p className="text-vensato-text-secondary text-sm mt-1">Gestión del ciclo de vida contractual y renovaciones</p>
        </div>
        <Button className="bg-vensato-brand-primary hover:bg-[#5C7D6E] text-white font-ui items-center">
          <Plus className="mr-2 h-4 w-4" /> Nuevo Contrato
        </Button>
      </div>

      <div className="bg-vensato-warning/10 border border-vensato-warning/20 rounded-xl p-4 flex items-start space-x-3">
         <AlertTriangle className="h-5 w-5 text-vensato-warning shrink-0" />
         <div>
            <h4 className="text-sm font-bold text-vensato-text-main">Alerta de Renovación</h4>
            <p className="text-sm text-vensato-text-secondary mt-0.5">El contrato de <strong>María Fernanda López</strong> (Apt 502 - Chicó) vence en 30 días. Te recomendamos iniciar la gestión de renovación.</p>
         </div>
         <Button variant="outline" size="sm" className="ml-auto mt-0.5 shrink-0 bg-white hover:bg-vensato-base border-vensato-border-subtle text-vensato-text-main">
           Gestionar
         </Button>
      </div>

      <Card className="rounded-xl shadow-sm border-vensato-border-subtle bg-vensato-surface overflow-hidden">
        <Table>
          <TableHeader className="bg-vensato-base border-b border-vensato-border-subtle">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-medium text-vensato-text-secondary h-12">Propiedad e Inquilino</TableHead>
              <TableHead className="font-medium text-vensato-text-secondary hidden md:table-cell h-12">Vigencia</TableHead>
              <TableHead className="font-medium text-vensato-text-secondary h-12">Canon Actual</TableHead>
              <TableHead className="font-medium text-vensato-text-secondary hidden lg:table-cell h-12">Incremento</TableHead>
              <TableHead className="font-medium text-vensato-text-secondary h-12">Estado</TableHead>
              <TableHead className="w-[50px] h-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockContracts.map((c) => (
              <TableRow key={c.id} className="hover:bg-vensato-base/50 transition-colors border-vensato-border-subtle">
                <TableCell className="py-4">
                  <div className="font-medium text-vensato-text-main flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-vensato-text-secondary" /> {c.property}
                  </div>
                  <div className="text-xs text-vensato-text-secondary mt-1 ml-6">{c.tenant}</div>
                </TableCell>
                <TableCell className="hidden md:table-cell py-4 text-sm text-vensato-text-secondary font-medium">
                  {c.startDate} al {c.endDate}
                </TableCell>
                <TableCell className="font-medium tabular-nums py-4 text-vensato-text-main">{formatCOP(c.rentAmount)}</TableCell>
                <TableCell className="hidden lg:table-cell py-4 text-sm font-medium text-vensato-text-secondary">
                  {c.incrementType}
                </TableCell>
                <TableCell className="py-4">
                  {c.status === "active" ? (
                    <Badge variant="outline" className="bg-vensato-success/10 text-vensato-success border-vensato-success/20">Vigente</Badge>
                  ) : (
                    <Badge variant="outline" className="text-vensato-warning border-vensato-warning bg-vensato-warning/10">Por Vencer</Badge>
                  )}
                </TableCell>
                <TableCell className="py-4">
                  <Button variant="ghost" size="icon" className="text-vensato-text-secondary hover:text-vensato-text-main rounded-full h-8 w-8 hover:bg-vensato-border-subtle/50">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
