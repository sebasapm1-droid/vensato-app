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
import { mockTenants } from "@/lib/utils/mock-data";
import { UserPlus, MoreHorizontal, Mail, Phone } from "lucide-react";

export default function InquilinosPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-heading font-bold text-2xl text-vensato-text-main">Inquilinos</h1>
          <p className="text-vensato-text-secondary text-sm mt-1">Directorio de arrendatarios y contactos</p>
        </div>
        <Button className="bg-vensato-brand-primary hover:bg-[#5C7D6E] text-white font-ui items-center">
          <UserPlus className="mr-2 h-4 w-4" /> Nuevo Inquilino
        </Button>
      </div>

      <Card className="rounded-xl shadow-sm border-vensato-border-subtle bg-vensato-surface overflow-hidden">
        <Table>
          <TableHeader className="bg-vensato-base border-b border-vensato-border-subtle">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-medium text-vensato-text-secondary h-12">Nombre y Contacto</TableHead>
              <TableHead className="font-medium text-vensato-text-secondary h-12">Propiedad Asignada</TableHead>
              <TableHead className="font-medium text-vensato-text-secondary hidden md:table-cell h-12">Estado Contrato</TableHead>
              <TableHead className="font-medium text-vensato-text-secondary hidden lg:table-cell h-12">Último Pago</TableHead>
              <TableHead className="w-[50px] h-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockTenants.map((t) => (
              <TableRow key={t.id} className="hover:bg-vensato-base/50 transition-colors border-vensato-border-subtle">
                <TableCell className="py-4">
                  <div className="font-medium text-vensato-text-main">{t.fullName}</div>
                  <div className="flex items-center space-x-3 mt-1 text-xs text-vensato-text-secondary">
                    <span className="flex items-center"><Mail className="w-3 h-3 mr-1" /> {t.email}</span>
                    <span className="flex items-center"><Phone className="w-3 h-3 mr-1" /> {t.phone}</span>
                  </div>
                </TableCell>
                <TableCell className="py-4 text-vensato-text-main font-medium">{t.property}</TableCell>
                <TableCell className="hidden md:table-cell py-4">
                  {t.contractStatus === "active" ? (
                    <Badge variant="outline" className="bg-vensato-success/10 text-vensato-success border-vensato-success/20 font-medium">Activo</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-vensato-warning/10 text-vensato-warning border-vensato-warning/20 font-medium">Por Vencer</Badge>
                  )}
                </TableCell>
                <TableCell className="hidden lg:table-cell py-4 text-vensato-text-secondary">
                  {t.lastPaymentDate}
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
