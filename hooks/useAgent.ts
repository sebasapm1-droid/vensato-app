"use client";

import { useEffect, useState } from "react";

export type Message = {
  role: "user" | "assistant";
  content: string;
};

type AgentMemory = {
  activeEntity?: {
    tabla: "tenants" | "properties" | "contracts";
    id: string;
    nombre: string;
  } | null;
  lastMutation?: {
    tabla: "tenants" | "properties" | "contracts";
    id: string;
    campo: string;
    valorAnterior: string;
    valorNuevo: string;
    nombre?: string;
  } | null;
};

const STORAGE_KEY = "vensato-agent-history";
const MEMORY_STORAGE_KEY = "vensato-agent-memory";
const REFRESH_EVENT = "vensato-data-refresh";

function persistMessages(nextMessages: Message[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextMessages));
}

function readStoredMemory(): AgentMemory {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.sessionStorage.getItem(MEMORY_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as unknown;
    return typeof parsed === "object" && parsed !== null
      ? (parsed as AgentMemory)
      : {};
  } catch {
    return {};
  }
}

function persistMemory(memory: AgentMemory) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(memory));
}

function readStoredMessages(): Message[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is Message => {
      if (typeof item !== "object" || item === null) {
        return false;
      }

      const candidate = item as Record<string, unknown>;
      return (
        (candidate.role === "user" || candidate.role === "assistant") &&
        typeof candidate.content === "string"
      );
    });
  } catch {
    return [];
  }
}

export function useAgent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [memory, setMemory] = useState<AgentMemory>({});

  useEffect(() => {
    setMessages(readStoredMessages());
    setMemory(readStoredMemory());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  async function sendMessage(text: string): Promise<void> {
    const content = text.trim();
    if (!content || isLoading) {
      return;
    }

    const nextMessages: Message[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    persistMessages(nextMessages);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: nextMessages, memory }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { message?: string; error?: string; memory?: AgentMemory }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "No se pudo contactar al agente.");
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: payload?.message?.trim() || "No tengo una respuesta disponible.",
      };

      setMessages((current) => {
        const updated = [...current, assistantMessage];
        persistMessages(updated);
        return updated;
      });

      const nextMemory = payload?.memory ?? memory;
      setMemory(nextMemory);
      persistMemory(nextMemory);

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(REFRESH_EVENT));
      }
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Ocurrio un error inesperado.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  function clearChat() {
    setMessages([]);
    setError(null);
    setMemory({});
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(STORAGE_KEY);
      window.sessionStorage.removeItem(MEMORY_STORAGE_KEY);
    }
  }

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
  };
}
