"use client";

import { useEffect, useRef, useState } from "react";
import type { getPublicConfig } from "@/lib/config";

type PublicConfig = ReturnType<typeof getPublicConfig>;

interface Message {
  role: "user" | "assistant";
  content: string;
}

function getSessionId(botId: string): string {
  try {
    const key = `chatbot-session-id:${botId}`;
    let id = window.sessionStorage.getItem(key);
    if (!id) {
      id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      window.sessionStorage.setItem(key, id);
    }
    return id;
  } catch {
    return `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }
}

export default function ChatWidget({
  config,
  botId,
}: {
  config: PublicConfig;
  botId: string;
}) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: config.greeting },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const sessionIdRef = useRef<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    sessionIdRef.current = getSessionId(botId);
    inputRef.current?.focus();
  }, [botId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, busy]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    const nextMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botId,
          sessionId: sessionIdRef.current,
          // The greeting is client-side flavor, not part of the model history.
          messages: nextMessages.slice(1),
        }),
      });
      const data = (await res.json()) as { reply?: string };
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            data.reply ||
            `Sorry, something went wrong. Please call us at ${config.phone}.`,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Sorry, I couldn't connect just now. Please call us at ${config.phone}.`,
        },
      ]);
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  function requestClose() {
    // Tell the host page's widget.js to hide the iframe.
    window.parent?.postMessage({ type: "chat-widget-close" }, "*");
  }

  const accent = config.accentColor;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        background: "#FBF6EC",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: accent,
          color: "#fff",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexShrink: 0,
        }}
      >
        <div
          aria-hidden
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.22)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "Georgia, serif",
            fontSize: 19,
          }}
        >
          {config.botName.charAt(0)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 17 }}>
            {config.name}
          </div>
          <div style={{ fontSize: 12, opacity: 0.9 }}>
            {config.botName} · usually replies in seconds
          </div>
        </div>
        <button
          onClick={requestClose}
          aria-label="Close chat"
          style={{
            background: "none",
            border: "none",
            color: "#fff",
            fontSize: 22,
            cursor: "pointer",
            padding: 6,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        style={{ flex: 1, overflowY: "auto", padding: "16px 12px" }}
      >
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
                maxWidth: "82%",
                padding: "10px 14px",
                borderRadius:
                  m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                background: m.role === "user" ? accent : "#fff",
                color: m.role === "user" ? "#fff" : "#2d2118",
                boxShadow: "0 1px 2px rgba(45,33,24,0.08)",
                fontSize: 14.5,
                lineHeight: 1.55,
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
                padding: "12px 16px",
                borderRadius: "16px 16px 16px 4px",
                background: "#fff",
                boxShadow: "0 1px 2px rgba(45,33,24,0.08)",
                fontSize: 14,
                color: "#8a7a68",
              }}
            >
              <span className="typing-dots">
                {config.botName} is typing
                <span>.</span>
                <span>.</span>
                <span>.</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
        style={{
          display: "flex",
          gap: 8,
          padding: 12,
          background: "#fff",
          borderTop: "1px solid #eee3d0",
          flexShrink: 0,
        }}
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={config.maxUserMessageLength}
          placeholder="Ask about menu, hours, catering..."
          aria-label="Your message"
          style={{
            flex: 1,
            border: "1px solid #ddd0bb",
            borderRadius: 22,
            padding: "10px 16px",
            fontSize: 14.5,
            outline: "none",
            background: "#FBF6EC",
          }}
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          aria-label="Send"
          style={{
            background: accent,
            color: "#fff",
            border: "none",
            borderRadius: "50%",
            width: 42,
            height: 42,
            cursor: busy || !input.trim() ? "default" : "pointer",
            opacity: busy || !input.trim() ? 0.5 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </form>

      <style>{`
        .typing-dots span {
          animation: blink 1.2s infinite;
        }
        .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes blink { 0%, 80%, 100% { opacity: 0.2; } 40% { opacity: 1; } }
      `}</style>
    </div>
  );
}
