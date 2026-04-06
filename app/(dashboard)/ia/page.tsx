import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";

const USD_TO_COP = 4000;

type UsageRow = {
  id: string;
  message_count: number;
  tool_calls_count: number;
  input_tokens: number;
  output_tokens: number;
  estimated_cost_usd: number;
  model: string;
  stop_reason: string | null;
  had_error: boolean;
  created_at: string;
};

function formatInteger(value: number): string {
  return new Intl.NumberFormat("es-CO").format(value);
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(value);
}

function formatCop(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function IAPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!isAdminEmail(user.email)) {
    redirect("/");
  }

  const serviceSupabase = createServiceClient();
  const { data, error } = await serviceSupabase
    .from("agent_usage_events")
    .select(
      "id, message_count, tool_calls_count, input_tokens, output_tokens, estimated_cost_usd, model, stop_reason, had_error, created_at"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-vensato-text-main">
            Uso de IA
          </h1>
          <p className="mt-1 text-sm text-vensato-text-secondary">
            No pude cargar las métricas del asistente.
          </p>
        </div>
      </div>
    );
  }

  const rows = ((data ?? []) as UsageRow[]);
  const totalInputTokens = rows.reduce((sum, row) => sum + row.input_tokens, 0);
  const totalOutputTokens = rows.reduce((sum, row) => sum + row.output_tokens, 0);
  const totalCostUsd = rows.reduce((sum, row) => sum + Number(row.estimated_cost_usd ?? 0), 0);
  const totalToolCalls = rows.reduce((sum, row) => sum + row.tool_calls_count, 0);
  const totalMessages = rows.reduce((sum, row) => sum + row.message_count, 0);
  const totalErrors = rows.filter((row) => row.had_error).length;

  const last7Days = rows.filter((row) => {
    const ageMs = Date.now() - new Date(row.created_at).getTime();
    return ageMs <= 7 * 24 * 60 * 60 * 1000;
  });

  const weeklyCostUsd = last7Days.reduce(
    (sum, row) => sum + Number(row.estimated_cost_usd ?? 0),
    0
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-vensato-text-main">
          Uso de IA
        </h1>
        <p className="mt-1 text-sm text-vensato-text-secondary">
          Tokens, costo estimado y actividad reciente del Asistente Vensato.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card className="rounded-xl border-vensato-border-subtle bg-vensato-surface p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-vensato-text-secondary">
            Input tokens
          </p>
          <p className="mt-2 font-heading text-2xl font-bold text-vensato-text-main">
            {formatInteger(totalInputTokens)}
          </p>
        </Card>

        <Card className="rounded-xl border-vensato-border-subtle bg-vensato-surface p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-vensato-text-secondary">
            Output tokens
          </p>
          <p className="mt-2 font-heading text-2xl font-bold text-vensato-text-main">
            {formatInteger(totalOutputTokens)}
          </p>
        </Card>

        <Card className="rounded-xl border-vensato-border-subtle bg-vensato-surface p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-vensato-text-secondary">
            Costo estimado
          </p>
          <p className="mt-2 font-heading text-2xl font-bold text-vensato-text-main">
            {formatUsd(totalCostUsd)}
          </p>
          <p className="mt-1 text-xs text-vensato-text-secondary">
            ~ {formatCop(totalCostUsd * USD_TO_COP)}
          </p>
        </Card>

        <Card className="rounded-xl border-vensato-border-subtle bg-vensato-surface p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-vensato-text-secondary">
            Tool calls
          </p>
          <p className="mt-2 font-heading text-2xl font-bold text-vensato-text-main">
            {formatInteger(totalToolCalls)}
          </p>
          <p className="mt-1 text-xs text-vensato-text-secondary">
            {formatInteger(totalMessages)} mensajes enviados
          </p>
        </Card>

        <Card className="rounded-xl border-vensato-border-subtle bg-vensato-surface p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-vensato-text-secondary">
            Últimos 7 días
          </p>
          <p className="mt-2 font-heading text-2xl font-bold text-vensato-text-main">
            {formatUsd(weeklyCostUsd)}
          </p>
          <p className="mt-1 text-xs text-vensato-text-secondary">
            {totalErrors} respuestas con error en 50 eventos
          </p>
        </Card>
      </div>

      <Card className="rounded-xl border-vensato-border-subtle bg-vensato-surface p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-bold text-vensato-text-main">
              Actividad reciente
            </h2>
            <p className="mt-1 text-sm text-vensato-text-secondary">
              Últimos 50 eventos registrados del agente.
            </p>
          </div>
          <div className="text-right text-xs text-vensato-text-secondary">
            Modelo: <span className="font-semibold text-vensato-text-main">claude-haiku-4-5-20251001</span>
          </div>
        </div>

        {rows.length === 0 ? (
          <p className="text-sm text-vensato-text-secondary">
            Aún no hay uso registrado del asistente.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-vensato-border-subtle text-left text-vensato-text-secondary">
                  <th className="pb-3 pr-4 font-medium">Fecha</th>
                  <th className="pb-3 pr-4 font-medium">Input</th>
                  <th className="pb-3 pr-4 font-medium">Output</th>
                  <th className="pb-3 pr-4 font-medium">Tools</th>
                  <th className="pb-3 pr-4 font-medium">Costo</th>
                  <th className="pb-3 pr-4 font-medium">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-vensato-border-subtle/70 text-vensato-text-main"
                  >
                    <td className="py-3 pr-4">{formatDate(row.created_at)}</td>
                    <td className="py-3 pr-4">{formatInteger(row.input_tokens)}</td>
                    <td className="py-3 pr-4">{formatInteger(row.output_tokens)}</td>
                    <td className="py-3 pr-4">{formatInteger(row.tool_calls_count)}</td>
                    <td className="py-3 pr-4">{formatUsd(Number(row.estimated_cost_usd ?? 0))}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          row.had_error
                            ? "bg-red-50 text-red-600"
                            : "bg-vensato-brand-primary/10 text-vensato-brand-primary"
                        }`}
                      >
                        {row.had_error ? "Error" : row.stop_reason ?? "OK"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
