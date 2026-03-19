"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { KeyRound, Eye, EyeOff } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    if (password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast.error("No se pudo actualizar la contraseña.", { description: error.message });
      setLoading(false);
      return;
    }

    setDone(true);
    toast.success("Contraseña actualizada", {
      description: "Te hemos enviado una confirmación a tu correo.",
    });
    setTimeout(() => router.push("/"), 2000);
  }

  if (done) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto w-16 h-16 bg-vensato-brand-primary/10 rounded-full flex items-center justify-center">
          <KeyRound className="h-8 w-8 text-vensato-brand-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="font-heading font-bold text-2xl text-vensato-text-main">¡Contraseña actualizada!</h2>
          <p className="text-sm text-vensato-text-secondary">
            Recibirás una confirmación en tu correo. Redirigiendo...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="font-heading font-bold text-2xl text-vensato-text-main">Nueva Contraseña</h2>
        <p className="text-sm text-vensato-text-secondary">
          Ingresa tu nueva contraseña para continuar.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-vensato-text-main block">Nueva contraseña</label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Mínimo 8 caracteres"
              className="bg-vensato-base border-vensato-border-subtle focus-visible:ring-vensato-brand-primary h-11 pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-vensato-text-secondary hover:text-vensato-text-main"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-vensato-text-main block">Confirmar contraseña</label>
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Repite la contraseña"
            className="bg-vensato-base border-vensato-border-subtle focus-visible:ring-vensato-brand-primary h-11"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={loading}
            autoComplete="new-password"
          />
        </div>

        <Button
          type="submit"
          disabled={loading || !password || !confirm}
          className="w-full bg-vensato-brand-primary hover:bg-[#5C7D6E] text-white h-11 font-ui font-bold text-sm transition-all disabled:opacity-70"
        >
          {loading ? (
            <span className="flex items-center space-x-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Guardando...</span>
            </span>
          ) : (
            "Guardar nueva contraseña"
          )}
        </Button>
      </form>
    </div>
  );
}
