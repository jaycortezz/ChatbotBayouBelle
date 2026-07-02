"use client";

import { useEffect, useRef, useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

function newSessionId(): string {
  return `test_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Live "Test Your Bot" chat, embedded directly in the dashboard editor.
 * Always talks to the bot's last SAVED config — save first to test edits.
 */
export default function TestChatPanel({
  botId,
  botName,
  accentColor,
  greeting,
}: {
  botId: string;
  botName: string;
  accentColor: string;
  greeting: string;
}) {
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: greeting }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const sessionIdRef = useRef(newSessionId());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  function reset() {
    sessionIdRef.current = newSessionId();
    setMessages([{ role: "assistant", content: greeting }]);
    setInput("");
  }

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    const next: Message[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botId,
          sessionId: sessionIdRef.current,
          messages: next.slice(1), // greeting isn't part of the model history
        }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply || data.error || "Something went wrong." },
      ]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Network error — try again." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        border: "1px solid #ece9f5",
        borderRadius: 12,
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        height: 560,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #ece9f5",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <strong style={{ fontSize: 14 }}>Test your bot</strong>
        <button
          onClick={reset}
          style={{
            border: "1px solid #d9d9e3",
            borderRadius: 6,
            background: "none",
            padding: "4px 10px",
            fontSize: 12.5,
            cursor: "pointer",
          }}
        >
          Reset
        </button>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 14 }}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: m.role === "user" ? "flex-end" : "flex-start",
              marginBottom: 10,
            }}
          >
            <div
              style={{
                maxWidth: "85%",
                padding: "9px 13px",
                borderRadius: m.role === "user" ? "14px 14px 3px 14px" : "14px 14px 14px 3px",
                background: m.role === "user" ? accentColor : "#f4f3fa",
                color: m.role === "user" ? "#fff" : "#1c1c24",
                fontSize: 13.5,
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {m.content}
            </div>
          </div>
        ))}
        {busy && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div
              style={{
                padding: "9px 13px",
                borderRadius: "14px 14px 14px 3px",
                background: "#f4f3fa",
                fontSize: 13,
                color: "#767685",
              }}
            >
              {botName} is typing…
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
        style={{ display: "flex", gap: 8, padding: 10, borderTop: "1px solid #ece9f5" }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Send a message"
          style={{
            flex: 1,
            border: "1px solid #d9d9e3",
            borderRadius: 20,
            padding: "9px 14px",
            fontSize: 13.5,
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          style={{
            background: accentColor,
            color: "#fff",
            border: "none",
            borderRadius: "50%",
            width: 36,
            height: 36,
            flexShrink: 0,
            cursor: busy || !input.trim() ? "default" : "pointer",
            opacity: busy || !input.trim() ? 0.5 : 1,
          }}
          aria-label="Send"
        >
          ➤
        </button>
      </form>
    </div>
  );
}
