"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { MessageSquare, X } from "lucide-react";
import { useAgent } from "@/hooks/useAgent";
import { usePlan } from "@/hooks/usePlan";
import { UpgradeModal } from "@/components/UpgradeModal";

const OPEN_STORAGE_KEY = "vensato-agent-open";

export function AgentChat() {
  const { messages, isLoading, error, sendMessage, clearChat } = useAgent();
  const { can, isLoading: planLoading } = usePlan();
  const [text, setText] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  const hasAgentAccess = can("hasAgent");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setIsOpen(window.sessionStorage.getItem(OPEN_STORAGE_KEY) === "true");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.sessionStorage.setItem(OPEN_STORAGE_KEY, String(isOpen));
  }, [isOpen]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading]);

  async function submitCurrentText(): Promise<void> {
    if (!hasAgentAccess) {
      setShowUpgrade(true);
      return;
    }

    const value = text.trim();
    if (!value) {
      return;
    }

    setText("");
    await sendMessage(value);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitCurrentText();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submitCurrentText();
    }
  }

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {showUpgrade ? (
        <div className="pointer-events-auto">
          <UpgradeModal feature="hasAgent" onClose={() => setShowUpgrade(false)} />
        </div>
      ) : null}

      {isOpen ? (
        <section className="pointer-events-auto w-[min(92vw,420px)] rounded-2xl border border-vensato-border-subtle bg-vensato-surface shadow-2xl">
          <div className="flex items-center justify-between border-b border-vensato-border-subtle px-5 py-4">
            <div>
              <h2 className="font-heading text-xl font-bold text-vensato-text-main">
                Asistente Vensato
              </h2>
              <p className="mt-1 text-sm text-vensato-text-secondary">
                {hasAgentAccess
                  ? "Consulta propiedades, cobros e informacion extraida de tus PDF."
                  : "Disponible desde el plan Inicio."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={clearChat}
                className="rounded-lg border border-vensato-border-subtle px-3 py-2 text-sm font-medium text-vensato-text-main transition hover:bg-vensato-base"
              >
                Limpiar
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-2 text-vensato-text-secondary transition hover:bg-vensato-base hover:text-vensato-text-main"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="max-h-[420px] space-y-3 overflow-y-auto px-5 py-4">
            {messages.length === 0 ? (
              <div className="rounded-xl bg-vensato-base px-4 py-3 text-sm text-vensato-text-secondary">
                Prueba con: "resume mis cobros pendientes" o "busca el contrato de Juan".
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                      message.role === "user"
                        ? "bg-vensato-brand-primary text-white"
                        : "bg-vensato-base text-vensato-text-main"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))
            )}

            {isLoading ? (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-vensato-base px-4 py-3 text-sm text-vensato-text-secondary">
                  Pensando...
                </div>
              </div>
            ) : null}

            <div ref={endRef} />
          </div>

          <form onSubmit={handleSubmit} className="border-t border-vensato-border-subtle px-5 py-4">
            <div className="flex gap-3">
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  hasAgentAccess
                    ? "Escribe tu pregunta..."
                    : "Actualiza tu plan para usar el asistente"
                }
                rows={2}
                disabled={!hasAgentAccess}
                className="min-h-[52px] flex-1 resize-none rounded-xl border border-vensato-border-subtle bg-vensato-base px-4 py-3 text-sm text-vensato-text-main outline-none transition focus:border-vensato-brand-primary"
              />
              <button
                type="submit"
                disabled={planLoading || isLoading || (!text.trim() && hasAgentAccess === true)}
                className="rounded-xl bg-vensato-brand-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#5C7D6E] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {hasAgentAccess ? "Enviar" : "Ver planes"}
              </button>
            </div>

            {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}
          </form>
        </section>
      ) : null}

      <button
        type="button"
        onClick={() => {
          if (!hasAgentAccess && !planLoading) {
            setShowUpgrade(true);
            return;
          }

          setIsOpen((current) => !current);
        }}
        className="pointer-events-auto flex items-center gap-3 rounded-full bg-vensato-brand-primary px-5 py-3 text-sm font-semibold text-white shadow-xl transition hover:bg-[#5C7D6E]"
      >
        <MessageSquare className="h-4 w-4" />
        {hasAgentAccess
          ? messages.length > 0
            ? "Abrir asistente"
            : "Asistente IA"
          : "Asistente Vensato"}
      </button>
    </div>
  );
}
