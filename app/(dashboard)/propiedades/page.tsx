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
import { mockProperties, formatCOP } from "@/lib/utils/mock-data";
import { Plus, MoreHorizontal } from "lucide-react";

export default function PropiedadesPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-heading font-bold text-2xl text-vensato-text-main">Tus Propiedades</h1>
          <p className="text-vensato-text-secondary text-sm mt-1">Gestiona tu portafolio de inversión</p>
        </div>
        <Button className="bg-vensato-brand-primary hover:bg-[#5C7D6E] text-white font-ui items-center">
          <Plus className="mr-2 h-4 w-4" /> Nueva Propiedad
        </Button>
      </div>

      <Card className="rounded-xl shadow-sm border-vensato-border-subtle bg-vensato-surface overflow-hidden">
        <Table>
          <TableHeader className="bg-vensato-base border-b border-vensato-border-subtle">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-medium text-vensato-text-secondary h-12">Alias / Propiedad</TableHead>
              <TableHead className="font-medium text-vensato-text-secondary hidden md:table-cell h-12">Ciudad</TableHead>
              <TableHead className="font-medium text-vensato-text-secondary hidden lg:table-cell h-12">Inquilino</TableHead>
              <TableHead className="font-medium text-vensato-text-secondary h-12">Canon Actual</TableHead>
              <TableHead className="font-medium text-vensato-text-secondary h-12">Cap Rate</TableHead>
              <TableHead className="font-medium text-vensato-text-secondary h-12">Estado</TableHead>
              <TableHead className="w-[50px] h-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockProperties.map((prop) => (
              <TableRow key={prop.id} className="hover:bg-vensato-base/50 transition-colors border-vensato-border-subtle">
                <TableCell className="py-4">
                  <div className="font-medium text-vensato-text-main">{prop.alias}</div>
                  <div className="text-xs text-vensato-text-secondary mt-0.5">{prop.type}</div>
                </TableCell>
                <TableCell className="hidden md:table-cell text-vensato-text-secondary py-4">{prop.city}</TableCell>
                <TableCell className="hidden lg:table-cell text-vensato-text-secondary py-4">
                  {prop.tenant || "—"}
                </TableCell>
                <TableCell className="font-medium tabular-nums py-4 text-vensato-text-main">{formatCOP(prop.currentRent)}</TableCell>
                <TableCell className="py-4">
                  <Badge variant="outline" className="bg-vensato-success/10 text-vensato-success border-vensato-success/20 font-bold tabular-nums">
                    {prop.capRate}%
                  </Badge>
                </TableCell>
                <TableCell className="py-4">
                  {prop.status === "occupied" ? (
                    <Badge className="bg-vensato-success hover:bg-vensato-success text-white border-transparent">Ocupada</Badge>
                  ) : (
                    <Badge variant="outline" className="text-vensato-warning border-vensato-warning bg-vensato-warning/10">Vacante</Badge>
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
