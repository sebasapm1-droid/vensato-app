import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-vensato-base flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
           <Link href="/">
             <h1 className="font-heading font-bold text-4xl text-vensato-text-main">Vensato</h1>
           </Link>
        </div>
        <div className="bg-vensato-surface shadow-xl rounded-2xl p-8 border border-vensato-border-subtle">
           {children}
        </div>
        <div className="mt-8 text-center">
           <Link href="https://vensato.com" className="text-sm font-medium text-vensato-text-secondary hover:text-vensato-brand-primary transition-colors">
              Volver a Vensato.com
           </Link>
        </div>
      </div>
    </div>
  );
}
