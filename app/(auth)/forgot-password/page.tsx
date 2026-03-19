"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { forgotPassword } from "@/app/actions/auth";
import { toast } from "sonner";
import { ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const result = await forgotPassword({ email });

      if (!result.success) {
        toast.error(result.error ?? "Ocurrió un error.");
        setLoading(false);
        return;
      }

      setSent(true);
      toast.success("Correo enviado", { description: result.message });
    } catch (err) {
      console.error("Forgot password error:", err);
      toast.error("Error inesperado. Inténtalo de nuevo.");
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto w-16 h-16 bg-vensato-brand-primary/10 rounded-full flex items-center justify-center">
          <Mail className="h-8 w-8 text-vensato-brand-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="font-heading font-bold text-2xl text-vensato-text-main">Revisa tu correo</h2>
          <p className="text-sm text-vensato-text-secondary">
            Si el correo <span className="font-semibold text-vensato-text-main">{email}</span> está registrado,
            recibirás un enlace para restablecer tu contraseña.
          </p>
        </div>
        <p className="text-xs text-vensato-text-secondary">
          ¿No llegó nada? Revisa tu carpeta de spam.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center text-sm font-semibold text-vensato-brand-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver al inicio de sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="font-heading font-bold text-2xl text-vensato-text-main">Restablecer Contraseña</h2>
        <p className="text-sm text-vensato-text-secondary">
          Ingresa tu correo y te enviaremos un enlace para crear una nueva contraseña.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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

        <Button
          type="submit"
          disabled={loading || !email}
          className="w-full bg-vensato-brand-primary hover:bg-[#5C7D6E] text-white h-11 font-ui font-bold text-sm transition-all disabled:opacity-70"
        >
          {loading ? (
            <span className="flex items-center space-x-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Enviando...</span>
            </span>
          ) : (
            "Enviar enlace de recuperación"
          )}
        </Button>
      </form>

      <Link
        href="/login"
        className="flex items-center justify-center text-sm font-semibold text-vensato-text-secondary hover:text-vensato-text-main transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Volver al inicio de sesión
      </Link>
    </div>
  );
}
