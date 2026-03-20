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
  const { tier: currentTier, isLoading } = usePlan();
  const searchParams = useSearchParams();
  const [loadingTier, setLoadingTier] = useState<Tier | null>(null);

  // Show success toast when returning from Wompi
  const paymentDone = searchParams.get("payment") === "done";
  if (paymentDone && typeof window !== "undefined") {
    // Only fire once by checking that we haven't shown it yet
    const key = "wompi_toast_shown";
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "1");
      toast.success("¡Pago recibido!", {
        description: "Tu plan se actualizará en unos segundos. Si no cambia, recarga la página.",
      });
    }
  }

  async function handleUpgrade(tier: Tier) {
    if (tier === "base") return;
    setLoadingTier(tier);
    try {
      const res = await fetch("/api/subscriptions/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        toast.error("No se pudo crear el link de pago", {
          description: data.error ?? "Intenta de nuevo.",
        });
        return;
      }
      window.location.href = data.url;
    } catch {
      toast.error("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoadingTier(null);
    }
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="font-heading font-bold text-2xl text-vensato-text-main">Planes y Precios</h1>
        <p className="text-vensato-text-secondary text-sm mt-1">
          Elige el plan que mejor se adapte a tu portafolio. Sin permanencia, cancela cuando quieras.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-4">
        {TIER_ORDER.map((tier) => {
          const plan = PLANS[tier];
          const isCurrent = !isLoading && currentTier === tier;
          const isPopular = tier === "portafolio";

          return (
            <Card
              key={tier}
              className={`relative overflow-visible p-6 flex flex-col rounded-2xl border shadow-sm ${
                isCurrent
                  ? "border-vensato-brand-primary ring-2 ring-vensato-brand-primary bg-vensato-surface"
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
                onClick={() => handleUpgrade(tier)}
                disabled={isCurrent || tier === "base" || loadingTier !== null}
                className={`w-full font-semibold ${
                  isCurrent
                    ? "bg-vensato-brand-primary/20 text-vensato-brand-primary cursor-default"
                    : tier === "base"
                    ? "bg-vensato-base text-vensato-text-secondary cursor-default border border-vensato-border-subtle"
                    : "bg-vensato-brand-primary hover:bg-[#5C7D6E] text-white"
                }`}
              >
                {loadingTier === tier
                  ? "Redirigiendo..."
                  : isCurrent
                  ? "Plan actual"
                  : tier === "base"
                  ? "Plan gratuito"
                  : "Actualizar plan"}
              </Button>
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-vensato-text-secondary text-center">
        Los pagos se procesan de forma segura mediante Wompi
      </p>
    </div>
  );
}
