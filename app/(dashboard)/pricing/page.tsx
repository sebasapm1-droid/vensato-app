"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Zap } from "lucide-react";
import { usePlan } from "@/hooks/usePlan";
import { PLANS, Tier } from "@/lib/plans";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

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

const FEATURES: { label: string; key: keyof typeof PLANS["base"] }[] = [
  { label: "Propiedades", key: "maxProperties" },
  { label: "Usuarios", key: "maxUsers" },
  { label: "Bóveda de documentos", key: "hasBovedaDocs" },
  { label: "Cobros automáticos (Wompi)", key: "hasWompiCobros" },
  { label: "Reportes avanzados", key: "hasReportesAvanzados" },
  { label: "Recordatorios por email", key: "hasEmailRecordatorios" },
  { label: "NOI y rentabilidad", key: "hasNOI" },
  { label: "Recordatorios por WhatsApp", key: "hasWhatsappRecordatorios" },
  { label: "Facturación DIAN", key: "hasDIAN" },
  { label: "Copropiedad", key: "hasCopropiedad" },
  { label: "Exportación contable", key: "hasExportacionContable" },
  { label: "Multi-usuario", key: "hasMultiUsuario" },
];

function featureValue(tier: Tier, key: keyof typeof PLANS["base"]): string | boolean {
  const val = PLANS[tier][key];
  if (key === "maxProperties") return val === -1 ? "Ilimitadas" : String(val);
  if (key === "maxUsers") return String(val);
  if (key === "bovedaStorageGB") return `${val} GB`;
  return val as boolean;
}

export default function PricingPage() {
  const {
    tier: currentTier, isLoading,
    subscriptionStatus, subscriptionValidUntil,
    hasPaymentToken, pendingTier,
  } = usePlan();
  const searchParams = useSearchParams();
  const [loadingTier, setLoadingTier] = useState<Tier | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // Toast when returning from Wompi checkout
  const paymentDone = searchParams.get("payment") === "done";
  if (paymentDone && typeof window !== "undefined") {
    const key = "wompi_toast_shown";
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "1");
      toast.success("¡Pago recibido!", {
        description: "Tu plan se actualizará en unos segundos. Si no cambia, recarga la página.",
      });
    }
  }

  async function handleCancel() {
    if (!confirm("¿Seguro que quieres cancelar? Mantendrás el acceso hasta que venza el período actual.")) return;
    setCancelling(true);
    try {
      const res = await fetch("/api/subscriptions/cancel", { method: "POST" });
      if (res.ok) {
        toast.success("Suscripción cancelada", { description: "Mantendrás acceso hasta que venza el período actual." });
        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast.error("No se pudo cancelar. Intenta de nuevo.");
      }
    } catch {
      toast.error("Error de conexión.");
    } finally {
      setCancelling(false);
    }
  }

  async function handleTierChange(tier: Tier) {
    if (tier === "base") return;
    setLoadingTier(tier);

    try {
      // Caso 1: reactivar el mismo tier dentro del período vigente
      if (tier === currentTier && subscriptionStatus === "cancelled") {
        const res = await fetch("/api/subscriptions/reactivate", { method: "POST" });
        const data = await res.json();
        if (res.ok) {
          toast.success("Plan reactivado", { description: "Tu suscripción sigue activa hasta el fin del período." });
          setTimeout(() => window.location.reload(), 1500);
        } else {
          // Período vencido: mandar al checkout
          if (data.error?.includes("venció")) {
            await checkoutUpgrade(tier);
          } else {
            toast.error(data.error ?? "No se pudo reactivar.");
          }
        }
        return;
      }

      const isUpgrade = TIER_RANK[tier] > TIER_RANK[currentTier] ||
        (subscriptionStatus === "cancelled" && tier !== currentTier);

      if (isUpgrade) {
        await checkoutUpgrade(tier);
      } else {
        // Downgrade: programar para el próximo ciclo
        const res = await fetch("/api/subscriptions/schedule-downgrade", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tier }),
        });
        if (res.ok) {
          toast.success(`Cambio programado a ${TIER_LABELS[tier]}`, {
            description: "Al vencer tu período actual se aplicará el cambio y se cobrará el nuevo precio.",
          });
          setTimeout(() => window.location.reload(), 1500);
        } else {
          toast.error("No se pudo programar el cambio. Intenta de nuevo.");
        }
      }
    } catch {
      toast.error("Error de conexión.");
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
    const data = await res.json();
    if (!res.ok || !data.url) {
      toast.error("No se pudo crear el link de pago", { description: data.error ?? "Intenta de nuevo." });
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
    return "Cambiar al próximo ciclo";
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

      {/* Banner de cambio pendiente */}
      {!isLoading && pendingTier && (
        <div className="flex items-center justify-between gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50 text-sm">
          <span className="text-amber-800">
            Cambio programado a <span className="font-semibold">{TIER_LABELS[pendingTier]}</span> — se aplicará al vencer tu período actual.
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="text-amber-700 hover:bg-amber-100 shrink-0"
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-4">
        {TIER_ORDER.map((tier) => {
          const plan = PLANS[tier];
          const isCurrent = !isLoading && currentTier === tier && subscriptionStatus !== "cancelled";
          const isPending = tier === pendingTier;
          const isPopular = tier === "portafolio";

          return (
            <Card
              key={tier}
              className={`relative overflow-visible p-6 flex flex-col rounded-2xl border shadow-sm ${
                isCurrent
                  ? "border-vensato-brand-primary ring-2 ring-vensato-brand-primary bg-vensato-surface"
                  : isPending
                  ? "border-amber-300 bg-vensato-surface"
                  : "border-vensato-border-subtle bg-vensato-surface"
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-vensato-brand-primary text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <Zap className="h-3 w-3" /> Popular
                  </span>
                </div>
              )}

              {isCurrent && (
                <div className="absolute -top-3 right-4">
                  <span className="bg-vensato-accent-punch text-white text-xs font-bold px-3 py-1 rounded-full">
                    Tu plan
                  </span>
                </div>
              )}

              {isPending && (
                <div className="absolute -top-3 right-4">
                  <span className="bg-amber-400 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Próximo ciclo
                  </span>
                </div>
              )}

              <div className="space-y-1 mb-5">
                <h2 className="font-heading font-bold text-lg text-vensato-text-main">{TIER_LABELS[tier]}</h2>
                <p className="text-xs text-vensato-text-secondary">{TIER_DESC[tier]}</p>
              </div>

              <div className="mb-6">
                {plan.precioMensualCOP === 0 ? (
                  <span className="text-3xl font-heading font-bold text-vensato-text-main">Gratis</span>
                ) : (
                  <div>
                    <span className="text-3xl font-heading font-bold text-vensato-text-main">
                      ${plan.precioMensualCOP.toLocaleString("es-CO")}
                    </span>
                    <span className="text-sm text-vensato-text-secondary ml-1">COP/mes</span>
                  </div>
                )}
              </div>

              <div className="space-y-2.5 flex-1 mb-6">
                {FEATURES.map(({ label, key }) => {
                  const val = featureValue(tier, key);
                  const active = typeof val === "boolean" ? val : true;
                  return (
                    <div key={key} className={`flex items-center gap-2 text-sm ${active ? "text-vensato-text-main" : "text-vensato-text-secondary opacity-40"}`}>
                      <Check className={`h-4 w-4 shrink-0 ${active ? "text-vensato-brand-primary" : "opacity-30"}`} />
                      <span>
                        {typeof val === "string" ? (
                          <><span className="font-semibold">{val}</span> {label.toLowerCase()}</>
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
                className={`w-full font-semibold ${
                  isCurrent
                    ? "bg-vensato-brand-primary/20 text-vensato-brand-primary cursor-default"
                    : isPending
                    ? "bg-amber-100 text-amber-700 cursor-default"
                    : tier === "base"
                    ? "bg-vensato-base text-vensato-text-secondary cursor-default border border-vensato-border-subtle"
                    : "bg-vensato-brand-primary hover:bg-[#5C7D6E] text-white"
                }`}
              >
                {getButtonLabel(tier)}
              </Button>
            </Card>
          );
        })}
      </div>

      {/* Banner de estado de suscripción */}
      {!isLoading && currentTier !== "base" && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border border-vensato-border-subtle bg-vensato-surface">
          <div className="text-sm text-vensato-text-secondary">
            {subscriptionStatus === "cancelled" ? (
              <span>
                Tu plan <span className="font-semibold text-vensato-text-main">{TIER_LABELS[currentTier]}</span> está cancelado.
                {subscriptionValidUntil && (
                  <> Acceso hasta el <span className="font-semibold text-vensato-text-main">{new Date(subscriptionValidUntil).toLocaleDateString("es-CO")}</span>.</>
                )}
              </span>
            ) : subscriptionStatus === "past_due" ? (
              <span className="text-red-500">
                El último cobro falló. Actualiza tu método de pago para no perder el acceso.
              </span>
            ) : (
              <span>
                {hasPaymentToken ? "Renovación automática" : "Renovación manual"} ·{" "}
                {subscriptionValidUntil && (
                  <>Próximo cobro el <span className="font-semibold text-vensato-text-main">{new Date(subscriptionValidUntil).toLocaleDateString("es-CO")}</span></>
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
              className="text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
            >
              {cancelling ? "Cancelando..." : "Cancelar plan"}
            </Button>
          )}
        </div>
      )}

      <p className="text-xs text-vensato-text-secondary text-center">
        Los pagos se procesan de forma segura mediante Wompi
      </p>
    </div>
  );
}
