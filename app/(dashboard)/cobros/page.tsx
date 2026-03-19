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
import { mockCharges, formatCOP } from "@/lib/utils/mock-data";
import { Plus, MoreHorizontal, ArrowDownToLine, Send } from "lucide-react";

export default function CobrosPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-heading font-bold text-2xl text-vensato-text-main">Cobros y Recaudo</h1>
          <p className="text-vensato-text-secondary text-sm mt-1">Control de pagos, vencimientos y facturación</p>
        </div>
        <Button className="bg-vensato-brand-primary hover:bg-[#5C7D6E] text-white font-ui items-center">
          <Plus className="mr-2 h-4 w-4" /> Crear Cobro
        </Button>
      </div>

      <div className="flex space-x-1 border-b border-vensato-border-subtle pb-px">
         <button className="px-4 py-2 font-medium text-sm text-vensato-brand-primary border-b-2 border-vensato-brand-primary">Pendientes</button>
         <button className="px-4 py-2 font-medium text-sm text-vensato-text-secondary hover:text-vensato-text-main transition-colors">Vencidos (1)</button>
         <button className="px-4 py-2 font-medium text-sm text-vensato-text-secondary hover:text-vensato-text-main transition-colors">Pagados</button>
         <button className="px-4 py-2 font-medium text-sm text-vensato-text-secondary hover:text-vensato-text-main transition-colors">Todos</button>
      </div>

      <Card className="rounded-xl shadow-sm border-vensato-border-subtle bg-vensato-surface overflow-hidden">
        <Table>
          <TableHeader className="bg-vensato-base border-b border-vensato-border-subtle">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-medium text-vensato-text-secondary h-12">Concepto / Detalles</TableHead>
              <TableHead className="font-medium text-vensato-text-secondary hidden md:table-cell h-12">Inquilino</TableHead>
              <TableHead className="font-medium text-vensato-text-secondary h-12">Monto</TableHead>
              <TableHead className="font-medium text-vensato-text-secondary hidden lg:table-cell h-12">Vencimiento</TableHead>
              <TableHead className="font-medium text-vensato-text-secondary h-12">Estado</TableHead>
              <TableHead className="w-[120px] h-12 block text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockCharges.map((c) => (
              <TableRow key={c.id} className="hover:bg-vensato-base/50 transition-colors border-vensato-border-subtle">
                <TableCell className="py-4">
                  <div className="font-medium text-vensato-text-main">{c.concept}</div>
                  <div className="text-xs text-vensato-text-secondary mt-0.5">{c.property}</div>
                </TableCell>
                <TableCell className="hidden md:table-cell py-4 text-vensato-text-main">{c.tenant}</TableCell>
                <TableCell className="font-medium tabular-nums py-4 text-vensato-text-main">{formatCOP(c.amount)}</TableCell>
                <TableCell className="hidden lg:table-cell py-4 tabular-nums text-vensato-text-secondary">{c.dueDate}</TableCell>
                <TableCell className="py-4">
                  {c.status === "paid" && <Badge variant="outline" className="bg-vensato-success/10 text-vensato-success border-vensato-success/20">Pagado</Badge>}
                  {c.status === "pending" && <Badge variant="outline" className="bg-vensato-border-subtle/50 text-vensato-text-main border-vensato-border-subtle">Pendiente</Badge>}
                  {c.status === "overdue" && <Badge className="bg-vensato-danger text-white hover:bg-vensato-danger border-transparent">Vencido</Badge>}
                </TableCell>
                <TableCell className="py-4 text-right space-x-1">
                   <Button variant="ghost" size="icon" className="text-vensato-brand-primary hover:bg-vensato-brand-primary/10 rounded-full h-8 w-8" title="Enviar Recordatorio">
                    <Send className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-vensato-text-secondary hover:text-vensato-text-main rounded-full h-8 w-8 hover:bg-vensato-border-subtle/50" title="Descargar PDF">
                    <ArrowDownToLine className="h-4 w-4" />
                  </Button>
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
