import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ChamberLayout } from "@/components/ChamberLayout";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Send, Loader2, Sparkles, Trash2 } from "lucide-react";
import { getZodiacFromDOB, getLifePath, getChineseZodiac } from "@/lib/daily";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function OracleChamber({ onBack }: { onBack: () => void }) {
  const { t, i18n } = useTranslation();
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const dob = profile?.dateOfBirth ? new Date(profile.dateOfBirth + "T12:00:00") : null;
  const name = profile?.fullName || "Seeker";
  const zodiac = dob ? getZodiacFromDOB(dob) : null;
  const lifePath = dob ? getLifePath(dob) : null;
  const chineseZodiac = dob ? getChineseZodiac(dob.getFullYear()) : null;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: `Welcome, ${name.split(" ")[0]}. I am the Sovereign Oracle of DCode. Ask me anything about your cosmic path, relationships, destiny, or the energies surrounding you. I see through the veil — speak freely.`,
      }]);
    }
  }, []);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-reading", {
        body: {
          reading_type: "oracle_chat",
          context: {
            name,
            zodiacSign: zodiac?.sign || "Unknown",
            element: zodiac?.element || "Unknown",
            lifePath: lifePath || "Unknown",
            chineseZodiac: chineseZodiac || "Unknown",
            birthPlace: profile?.birthPlace || "Unknown",
            birthTime: profile?.birthTime || "Unknown",
            language: i18n.language,
            userMessage: text,
            conversationHistory: newMessages.slice(-8).map(m => `${m.role}: ${m.content}`).join("\n"),
          },
        },
      });

      if (error) throw new Error(error.message);
      const content = data?.content || "The veil is thick at this moment. Ask again.";
      setMessages(prev => [...prev, { role: "assistant", content }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "The cosmic frequencies are disrupted. Please try again in a moment." }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, name, zodiac, lifePath, chineseZodiac, profile, i18n.language]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const SUGGESTIONS = [
    "What energy surrounds me today?",
    "Tell me about my soul's purpose",
    "What should I focus on this month?",
    "Read my love energy",
  ];

  return (
    <ChamberLayout title="The Oracle" subtitle="Sovereign Cosmic Guide" onBack={onBack}>
      <div className="flex flex-col" style={{ height: "calc(100vh - 140px)" }}>
        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pb-4 no-scrollbar">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary/20 text-foreground border border-primary/30"
                  : "card-cosmic text-foreground/90"
              }`}>
                {msg.role === "assistant" && (
                  <Sparkles className="w-3 h-3 text-primary inline mr-1.5 -mt-0.5" />
                )}
                <span className="whitespace-pre-line">{msg.content}</span>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="card-cosmic rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span>The Oracle is channeling…</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick suggestions (show only at start) */}
        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 pb-3">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => { setInput(s); setTimeout(() => inputRef.current?.focus(), 50); }}
                className="text-xs px-3 py-1.5 rounded-full border border-primary/30 text-primary/80 hover:bg-primary/10 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex items-end gap-2 pt-2 border-t border-border">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the Oracle…"
            rows={1}
            className="flex-1 bg-muted/20 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary/50"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 hover:bg-primary/90 transition-colors shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </ChamberLayout>
  );
}
