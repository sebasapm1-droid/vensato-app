"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login } from "@/app/actions/auth";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const result = await login({ email, password });
    if (result?.error) {
      toast.error(result.error);
      setLoading(false);
    } else if (result?.success) {
      toast.success(result.message);
      // Breve pausa para que se vea el toast antes de saltar a la app
      setTimeout(() => {
         router.refresh();
         router.push("/");
      }, 500);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="font-heading font-bold text-2xl text-vensato-text-main">Iniciar Sesión</h2>
        <p className="text-sm text-vensato-text-secondary">Ingresa a tu cuenta para gestionar tu portafolio.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-vensato-text-main block text-left">Correo Electrónico</label>
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
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-vensato-text-main block">Contraseña</label>
            <Link href="/forgot-password" className="text-xs font-semibold text-vensato-brand-primary hover:underline">
               ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <div className="relative">
            <Input 
              type={showPassword ? "text" : "password"} 
              placeholder="••••••••" 
              className="bg-vensato-base border-vensato-border-subtle focus-visible:ring-vensato-brand-primary h-11 pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
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

        <Button disabled={loading} className="w-full bg-vensato-brand-primary hover:bg-[#5C7D6E] text-white h-11 font-ui font-bold text-sm mt-2 transition-all">
          {loading ? "Validando credenciales..." : "Entrar a Vensato"}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-vensato-border-subtle" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-vensato-surface px-2 text-vensato-text-secondary font-semibold">
            O
          </span>
        </div>
      </div>

      <Button variant="outline" className="w-full border-vensato-border-subtle hover:bg-vensato-base text-vensato-text-main h-11 font-ui font-semibold">
        Ingresar con Enlace Mágico
      </Button>

      <p className="text-center text-sm text-vensato-text-secondary mt-6">
        ¿Aún no tienes cuenta?{" "}
        <Link href="/register" className="font-semibold text-vensato-accent-punch hover:underline">
          Regístrate gratis
        </Link>
      </p>
    </div>
  );
}
