"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

type Message = {
  id: string;
  role: string;
  content: string;
  createdAt: string;
};

type LeadChatProps = {
  gameId: string;
  gameTitle: string;
  onLeadCreated?: (leadId: string) => void;
};

export function LeadChat({ gameId, gameTitle, onLeadCreated }: LeadChatProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [leadId, setLeadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function startChat(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId,
          name,
          phone,
          source: "landing",
          utm: typeof window !== "undefined" ? window.location.search.slice(1) : undefined,
        }),
      });

      const lead = await res.json();
      if (!res.ok) throw new Error(lead.error);

      setLeadId(lead.id);
      setMessages(lead.messages ?? []);
      setStarted(true);
      onLeadCreated?.(lead.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!leadId || !input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        role: "user",
        content: userMessage,
        createdAt: new Date().toISOString(),
      },
    ]);
    setLoading(true);

    try {
      const res = await fetch("/api/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, message: userMessage }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessages(data.lead.messages);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  if (!started) {
    return (
      <div className="card p-6">
        <h3 className="text-xl font-bold mb-2">Оставить заявку</h3>
        <p className="text-[var(--muted)] mb-6">
          AI-ассистент ответит на вопросы и поможет с регистрацией на {gameTitle}
        </p>
        <form onSubmit={startChat} className="space-y-4">
          <input
            className="input"
            placeholder="Ваше имя"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            className="input"
            placeholder="Телефон"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? "Отправка..." : "Начать диалог"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="card p-4 flex flex-col h-[420px]">
      <div className="font-semibold mb-3">AI-ассистент игры «Система»</div>
      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === "user"
                ? "ml-auto bg-[var(--accent)] text-white"
                : "bg-[var(--surface-2)] border border-[var(--border)]"
            }`}
          >
            {msg.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={sendMessage} className="mt-4 flex gap-2">
        <input
          className="input"
          placeholder="Напишите сообщение..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="btn btn-primary px-4" disabled={loading}>
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
