"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { register } from "@/app/actions/auth";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { GoogleButton } from "@/components/auth/google-button";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
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
      const result = await register({ fullName, email, password });

      if (!result) {
        toast.error("No se recibió respuesta del servidor. Recarga e intenta de nuevo.");
        setLoading(false);
        return;
      }

      if (!result.success) {
        toast.error(result.error ?? "Ocurrió un error al crear la cuenta.");
        setLoading(false);
        return;
      }

      // SUCCESS
      if (result.requiresVerification) {
        toast.info("Confirma tu correo", {
          description: result.message,
          duration: 10000,
        });
        setTimeout(() => router.push("/login"), 4000);
      } else {
        toast.success("¡Cuenta creada!", {
          description: result.message,
        });
        // Small delay to let the toast show, then navigate
        setTimeout(() => {
          router.refresh();
          router.push("/");
        }, 700);
      }
    } catch (err) {
      console.error("Register form error:", err);
      toast.error("Error inesperado. Recarga la página e intenta de nuevo.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="font-heading font-bold text-2xl text-vensato-text-main">Crear Cuenta</h2>
        <p className="text-sm text-vensato-text-secondary">Automatiza y escala tu portafolio inmobiliario.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-left" noValidate>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-vensato-text-main block">Nombre Completo</label>
          <Input
            type="text"
            placeholder="Ej. Juan Pérez"
            className="bg-vensato-base border-vensato-border-subtle focus-visible:ring-vensato-brand-primary h-11"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={loading}
            autoComplete="name"
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
            disabled={loading}
            autoComplete="email"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-vensato-text-main block">
            Contraseña <span className="text-vensato-text-secondary font-normal">(mínimo 8 caracteres)</span>
          </label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="bg-vensato-base border-vensato-border-subtle focus-visible:ring-vensato-brand-primary h-11 pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="new-password"
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
          className="w-full bg-vensato-accent-punch hover:bg-[#c7654a] text-white h-11 font-ui font-bold text-sm mt-2 transition-all disabled:opacity-70"
        >
          {loading ? (
            <span className="flex items-center space-x-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Creando cuenta segura...</span>
            </span>
          ) : (
            "Crear mi cuenta"
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

      <GoogleButton label="Registrarse con Google" />

      <p className="text-center text-xs text-vensato-text-secondary px-4">
        Al registrarte, aceptas nuestros{" "}
        <Link href="#" className="underline hover:text-vensato-text-main">Términos</Link>{" "}y{" "}
        <Link href="#" className="underline hover:text-vensato-text-main">Privacidad</Link>.
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
