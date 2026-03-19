import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { mockDocuments } from "@/lib/utils/mock-data";
import { UploadCloud, FileText, File, Download, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function DocumentosPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-heading font-bold text-2xl text-vensato-text-main">Bóveda Documental</h1>
          <p className="text-vensato-text-secondary text-sm mt-1">Almacenamiento centralizado de contratos y archivos</p>
        </div>
        <Button className="bg-vensato-brand-primary hover:bg-[#5C7D6E] text-white font-ui items-center">
          <UploadCloud className="mr-2 h-4 w-4" /> Subir Documento
        </Button>
      </div>

      <div className="flex space-x-3">
        <div className="relative flex-1 max-w-sm">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-vensato-text-secondary" />
           <Input placeholder="Buscar por propiedad o tipo..." className="pl-9 bg-vensato-surface border-vensato-border-subtle focus-visible:ring-vensato-brand-primary h-10" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
         {mockDocuments.map(doc => (
           <Card key={doc.id} className="rounded-xl shadow-sm border-vensato-border-subtle bg-vensato-surface hover:shadow-md transition-shadow group flex flex-col p-5 cursor-pointer">
              <div className="flex justify-between items-start mb-4">
                 <div className="p-3 bg-vensato-base rounded-lg group-hover:bg-vensato-brand-primary/10 transition-colors">
                    {doc.type === "Contrato" ? <FileText className="h-6 w-6 text-vensato-brand-primary" /> : <File className="h-6 w-6 text-vensato-brand-primary" />}
                 </div>
                 <Button variant="ghost" size="icon" className="h-8 w-8 text-vensato-text-secondary opacity-0 group-hover:opacity-100 transition-opacity hover:bg-vensato-base hover:text-vensato-text-main">
                    <Download className="h-4 w-4" />
                 </Button>
              </div>
              <p className="font-medium text-sm text-vensato-text-main truncate" title={doc.name}>{doc.name}</p>
              <p className="text-xs text-vensato-text-secondary mt-1">{doc.property}</p>
              <div className="flex items-center justify-between mt-5">
                 <span className="text-[10px] uppercase font-bold text-vensato-text-secondary px-2 py-0.5 rounded-full bg-vensato-base border border-vensato-border-subtle">{doc.type}</span>
                 <span className="text-xs font-medium text-vensato-text-secondary">{doc.size}</span>
              </div>
           </Card>
         ))}
      </div>
    </div>
  );
}
