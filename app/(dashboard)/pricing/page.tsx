"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePlan } from "@/hooks/usePlan";
import { PLANS, Tier } from "@/lib/plans";

const TIER_ORDER: Tier[] = ["base", "inicio", "portafolio", "patrimonio"];
const TIER_RANK: Record<Tier, number> = { base: 0, inicio: 1, portafolio: 2, patrimonio: 3 };

const TIER_LABELS: Record<Tier, string> = {
  base: "Base",
  inicio: "Inicio",
  portafolio: "Portafolio",
  patrimonio: "Patrimonio",
};

const TIER_DESC: Record<Tier, string> = {
  base: "Para empezar a gestionar tu portafolio",
  inicio: "Ideal para propietarios con hasta 5 inmuebles",
  portafolio: "Para portafolios en crecimiento activo",
  patrimonio: "Gestión patrimonial completa y multi-usuario",
};

type PricingFeature = {
  label: string;
  enabled: (tier: Tier) => boolean;
  value?: (tier: Tier) => string | null;
};

const FEATURES: PricingFeature[] = [
  {
    label: "Propiedades",
    enabled: () => true,
    value: (tier) => (PLANS[tier].maxProperties === -1 ? "Ilimitadas" : String(PLANS[tier].maxProperties)),
  },
  { label: "Gestión de propiedades", enabled: () => true },
  { label: "Gestión de inquilinos", enabled: () => true },
  { label: "Gestión de contratos", enabled: () => true },
  { label: "Gestión de cobros", enabled: () => true },
  {
    label: "Dashboard",
    enabled: () => true,
    value: (tier) => (tier === "portafolio" || tier === "patrimonio" ? "Premium" : "Básico"),
  },
  { label: "Bóveda documental", enabled: (tier) => tier !== "base" },
  { label: "Envío manual de cuentas de cobro por email", enabled: (tier) => tier !== "base" },
  { label: "Envío automático de cuentas de cobro por email", enabled: (tier) => tier === "portafolio" || tier === "patrimonio" },
  { label: "NOI y rentabilidad", enabled: (tier) => tier === "portafolio" || tier === "patrimonio" },
  { label: "Reportes financieros", enabled: (tier) => tier === "patrimonio" },
  { label: "Operación premium para escalar tu portafolio", enabled: (tier) => tier === "patrimonio" },
];

export default function PricingPage() {
  const {
    tier: currentTier,
    isLoading,
    subscriptionStatus,
    subscriptionValidUntil,
    hasPaymentToken,
    pendingTier,
  } = usePlan();
  const searchParams = useSearchParams();
  const [loadingTier, setLoadingTier] = useState<Tier | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const paymentDone = searchParams.get("payment") === "done";
  if (paymentDone && typeof window !== "undefined") {
    const key = "wompi_toast_shown";
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "1");
      toast.success("Pago recibido", {
        description: "Tu plan se actualizara en unos segundos. Si no cambia, recarga la pagina.",
      });
    }
  }

  async function handleCancel() {
    if (!confirm("Seguro que quieres cancelar? Mantendras el acceso hasta que venza el periodo actual.")) return;

    setCancelling(true);
    try {
      const res = await fetch("/api/subscriptions/cancel", { method: "POST" });
      if (res.ok) {
        toast.success("Suscripcion cancelada", {
          description: "Mantendras acceso hasta que venza el periodo actual.",
        });
        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast.error("No se pudo cancelar. Intenta de nuevo.");
      }
    } catch {
      toast.error("Error de conexion.");
    } finally {
      setCancelling(false);
    }
  }

  async function handleTierChange(tier: Tier) {
    if (tier === "base") return;
    setLoadingTier(tier);

    try {
      if (tier === currentTier && subscriptionStatus === "cancelled") {
        const res = await fetch("/api/subscriptions/reactivate", { method: "POST" });
        const data = (await res.json()) as { error?: string };
        if (res.ok) {
          toast.success("Plan reactivado", {
            description: "Tu suscripcion sigue activa hasta el fin del periodo.",
          });
          setTimeout(() => window.location.reload(), 1500);
        } else {
          if (data.error?.includes("vencio")) {
            await checkoutUpgrade(tier);
          } else {
            toast.error(data.error ?? "No se pudo reactivar.");
          }
        }
        return;
      }

      const isUpgrade =
        TIER_RANK[tier] > TIER_RANK[currentTier] ||
        (subscriptionStatus === "cancelled" && tier !== currentTier);

      if (isUpgrade) {
        await checkoutUpgrade(tier);
      } else {
        const res = await fetch("/api/subscriptions/schedule-downgrade", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tier }),
        });
        if (res.ok) {
          toast.success(`Cambio programado a ${TIER_LABELS[tier]}`, {
            description: "Al vencer tu periodo actual se aplicara el cambio y se cobrara el nuevo precio.",
          });
          setTimeout(() => window.location.reload(), 1500);
        } else {
          toast.error("No se pudo programar el cambio. Intenta de nuevo.");
        }
      }
    } catch {
      toast.error("Error de conexion.");
    } finally {
      setLoadingTier(null);
    }
  }

  async function checkoutUpgrade(tier: Tier) {
    const res = await fetch("/api/subscriptions/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier }),
    });
    const data = (await res.json()) as { url?: string; error?: string };
    if (!res.ok || !data.url) {
      toast.error("No se pudo crear el link de pago", {
        description: data.error ?? "Intenta de nuevo.",
      });
      return;
    }
    window.location.href = data.url;
  }

  function getButtonLabel(tier: Tier): string {
    if (loadingTier === tier) return "Procesando...";
    if (tier === "base") return "Plan gratuito";
    if (tier === pendingTier) return "Cambio programado";
    if (tier === currentTier && subscriptionStatus === "active") return "Plan actual";
    if (tier === currentTier && subscriptionStatus === "cancelled") return "Reactivar plan";
    if (TIER_RANK[tier] > TIER_RANK[currentTier] || subscriptionStatus === "cancelled") return "Actualizar plan";
    return "Cambiar al proximo ciclo";
  }

  function isButtonDisabled(tier: Tier): boolean {
    if (loadingTier !== null) return true;
    if (tier === "base") return true;
    if (tier === pendingTier) return true;
    if (tier === currentTier && subscriptionStatus === "active") return true;
    return false;
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="font-heading font-bold text-2xl text-vensato-text-main">Planes y Precios</h1>
        <p className="text-vensato-text-secondary text-sm mt-1">
          Elige el plan que mejor se adapte a tu portafolio. Sin permanencia, cancela cuando quieras.
        </p>
      </div>

      {!isLoading && pendingTier && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
          <span className="text-amber-800">
            Cambio programado a <span className="font-semibold">{TIER_LABELS[pendingTier]}</span> - se aplicara al
            vencer tu periodo actual.
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 text-amber-700 hover:bg-amber-100"
            onClick={async () => {
              await fetch("/api/subscriptions/cancel-downgrade", { method: "POST" });
              toast.success("Cambio cancelado");
              setTimeout(() => window.location.reload(), 1000);
            }}
          >
            Cancelar cambio
          </Button>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 pt-4 md:grid-cols-2 lg:grid-cols-4">
        {TIER_ORDER.map((tier) => {
          const plan = PLANS[tier];
          const isCurrent = !isLoading && currentTier === tier && subscriptionStatus !== "cancelled";
          const isPending = tier === pendingTier;
          const isPopular = tier === "portafolio";

          return (
            <Card
              key={tier}
              className={`relative flex flex-col overflow-visible rounded-2xl border p-6 shadow-sm ${isCurrent
                  ? "border-vensato-brand-primary ring-2 ring-vensato-brand-primary bg-vensato-surface"
                  : isPending
                    ? "border-amber-300 bg-vensato-surface"
                    : "border-vensato-border-subtle bg-vensato-surface"
                }`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="flex items-center gap-1 rounded-full bg-vensato-brand-primary px-3 py-1 text-xs font-bold text-white">
                    <Zap className="h-3 w-3" /> Popular
                  </span>
                </div>
              )}

              {isCurrent && (
                <div className="absolute -top-3 right-4">
                  <span className="rounded-full bg-vensato-accent-punch px-3 py-1 text-xs font-bold text-white">
                    Tu plan
                  </span>
                </div>
              )}

              {isPending && (
                <div className="absolute -top-3 right-4">
                  <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-white">
                    Proximo ciclo
                  </span>
                </div>
              )}

              <div className="mb-5 space-y-1">
                <h2 className="font-heading text-lg font-bold text-vensato-text-main">{TIER_LABELS[tier]}</h2>
                <p className="text-xs text-vensato-text-secondary">{TIER_DESC[tier]}</p>
              </div>

              <div className="mb-6">
                {plan.precioMensualCOP === 0 ? (
                  <span className="font-heading text-3xl font-bold text-vensato-text-main">Gratis</span>
                ) : (
                  <div>
                    <span className="font-heading text-3xl font-bold text-vensato-text-main">
                      ${plan.precioMensualCOP.toLocaleString("es-CO")}
                    </span>
                    <span className="ml-1 text-sm text-vensato-text-secondary">COP/mes</span>
                  </div>
                )}
              </div>

              <div className="mb-6 flex-1 space-y-2.5">
                {FEATURES.map(({ label, enabled, value }) => {
                  const active = enabled(tier);
                  const featureValue = value?.(tier) ?? null;

                  return (
                    <div
                      key={label}
                      className={`flex items-center gap-2 text-sm ${active ? "text-vensato-text-main" : "text-vensato-text-secondary opacity-40"
                        }`}
                    >
                      <Check className={`h-4 w-4 shrink-0 ${active ? "text-vensato-brand-primary" : "opacity-30"}`} />
                      <span>
                        {featureValue ? (
                          <>
                            <span className="font-semibold">{featureValue}</span> {label}
                          </>
                        ) : (
                          label
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>

              <Button
                onClick={() => handleTierChange(tier)}
                disabled={isButtonDisabled(tier)}
                className={`w-full font-semibold ${isCurrent
                    ? "cursor-default bg-vensato-brand-primary/20 text-vensato-brand-primary"
                    : isPending
                      ? "cursor-default bg-amber-100 text-amber-700"
                      : tier === "base"
                        ? "cursor-default border border-vensato-border-subtle bg-vensato-base text-vensato-text-secondary"
                        : "bg-vensato-brand-primary text-white hover:bg-[#5C7D6E]"
                  }`}
              >
                {getButtonLabel(tier)}
              </Button>
            </Card>
          );
        })}
      </div>

      {!isLoading && currentTier !== "base" && (
        <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-vensato-border-subtle bg-vensato-surface p-4 sm:flex-row sm:items-center">
          <div className="text-sm text-vensato-text-secondary">
            {subscriptionStatus === "cancelled" ? (
              <span>
                Tu plan <span className="font-semibold text-vensato-text-main">{TIER_LABELS[currentTier]}</span> esta
                cancelado.
                {subscriptionValidUntil && (
                  <>
                    {" "}
                    Acceso hasta el{" "}
                    <span className="font-semibold text-vensato-text-main">
                      {new Date(subscriptionValidUntil).toLocaleDateString("es-CO")}
                    </span>
                    .
                  </>
                )}
              </span>
            ) : subscriptionStatus === "past_due" ? (
              <span className="text-red-500">
                El ultimo cobro fallo. Actualiza tu metodo de pago para no perder el acceso.
              </span>
            ) : (
              <span>
                {hasPaymentToken ? "Renovacion automatica" : "Renovacion manual"} ·{" "}
                {subscriptionValidUntil && (
                  <>
                    Proximo cobro el{" "}
                    <span className="font-semibold text-vensato-text-main">
                      {new Date(subscriptionValidUntil).toLocaleDateString("es-CO")}
                    </span>
                  </>
                )}
              </span>
            )}
          </div>
          {subscriptionStatus === "active" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={cancelling}
              className="shrink-0 text-red-500 hover:bg-red-50 hover:text-red-600"
            >
              {cancelling ? "Cancelando..." : "Cancelar plan"}
            </Button>
          )}
        </div>
      )}

      <p className="text-center text-xs text-vensato-text-secondary">
        Los pagos se procesan de forma segura mediante Wompi
      </p>
    </div>
  );
}
