"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login } from "@/app/actions/auth";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { GoogleButton } from "@/components/auth/google-button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (loading) return;
    setLoading(true);

    try {
      const result = await login({ email, password });

      if (!result) {
        toast.error("No se recibió respuesta. Recarga e intenta de nuevo.");
        setLoading(false);
        return;
      }

      if (!result.success) {
        toast.error(result.error ?? "Error al iniciar sesión.");
        setLoading(false);
        return;
      }

      toast.success("Bienvenido de vuelta", { description: result.message });
      setTimeout(() => {
        router.refresh();
        router.push("/");
      }, 500);
    } catch (err) {
      console.error("Login form error:", err);
      toast.error("Error inesperado. Recarga la página e intenta de nuevo.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="font-heading font-bold text-2xl text-vensato-text-main">Iniciar Sesión</h2>
        <p className="text-sm text-vensato-text-secondary">Ingresa a tu cuenta para gestionar tu portafolio.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-vensato-text-main block text-left">Correo Electrónico</label>
          <Input
            type="email"
            placeholder="tu@email.com"
            className="bg-vensato-base border-vensato-border-subtle focus-visible:ring-vensato-brand-primary h-11"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            autoComplete="email"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-vensato-text-main">Contraseña</label>
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
              disabled={loading}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-vensato-text-secondary hover:text-vensato-text-main transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-vensato-brand-primary hover:bg-[#5C7D6E] text-white h-11 font-ui font-bold text-sm mt-2 transition-all disabled:opacity-70"
        >
          {loading ? (
            <span className="flex items-center space-x-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Verificando...</span>
            </span>
          ) : (
            "Entrar a Vensato"
          )}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-vensato-border-subtle" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-vensato-surface px-2 text-vensato-text-secondary">o</span>
        </div>
      </div>

      <GoogleButton label="Continuar con Google" />

      <p className="text-center text-sm text-vensato-text-secondary mt-6">
        ¿Aún no tienes cuenta?{" "}
        <Link href="/register" className="font-semibold text-vensato-accent-punch hover:underline">
          Regístrate gratis
        </Link>
      </p>
    </div>
  );
}
