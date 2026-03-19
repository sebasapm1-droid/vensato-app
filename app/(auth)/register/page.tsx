"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { register } from "@/app/actions/auth";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const result = await register({ fullName, email, password });
    if (result?.error) {
      toast.error(result.error);
      setLoading(false);
    } else if (result?.success) {
      if (result.requiresVerification) {
         toast.info("¡Casi listo!", { description: result.message, duration: 8000 });
         setTimeout(() => router.push("/login"), 3000);
      } else {
         toast.success("¡Bienvenido!", { description: result.message });
         setTimeout(() => {
            router.refresh();
            router.push("/");
         }, 500);
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="font-heading font-bold text-2xl text-vensato-text-main">Crear Cuenta</h2>
        <p className="text-sm text-vensato-text-secondary">Automatiza y escala tu portafolio inmobiliario.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-vensato-text-main block">Nombre Completo</label>
          <Input 
            type="text" 
            placeholder="Ej. Juan Pérez" 
            className="bg-vensato-base border-vensato-border-subtle focus-visible:ring-vensato-brand-primary h-11"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            minLength={2}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-vensato-text-main block">Correo Electrónico</label>
          <Input 
            type="email" 
            placeholder="tu@email.com" 
            className="bg-vensato-base border-vensato-border-subtle focus-visible:ring-vensato-brand-primary h-11"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-vensato-text-main block">Contraseña</label>
          <div className="relative">
            <Input 
              type={showPassword ? "text" : "password"} 
              placeholder="Mínimo 8 caracteres" 
              className="bg-vensato-base border-vensato-border-subtle focus-visible:ring-vensato-brand-primary h-11 pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-vensato-text-secondary hover:text-vensato-text-main transition-colors"
              title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button disabled={loading} className="w-full bg-vensato-accent-punch hover:bg-[#c7654a] text-white h-11 font-ui font-bold text-sm mt-2 transition-all">
          {loading ? "Creando cuenta segura..." : "Crear mi cuenta"}
        </Button>
      </form>

      <p className="text-center text-xs text-vensato-text-secondary px-4 mt-4">
        Al registrarte, aceptas nuestros <Link href="#" className="underline hover:text-vensato-text-main">Términos</Link> y <Link href="#" className="underline hover:text-vensato-text-main">Privacidad</Link>.
      </p>

      <p className="text-center text-sm text-vensato-text-secondary pt-4 border-t border-vensato-border-subtle">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-semibold text-vensato-brand-primary hover:underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
