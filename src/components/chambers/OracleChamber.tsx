import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ChamberLayout } from "@/components/ChamberLayout";
import { useAuth } from "@/hooks/use-auth";
import { useCachedReading } from "@/hooks/use-cached-reading";
import { supabase } from "@/integrations/supabase/client";
import {
  getZodiacFromDOB,
  getLifePath,
  getChineseZodiac,
  getUniversalDay,
  getPersonalDay,
  formatDate,
  reduceToSingle,
} from "@/lib/daily";
import { Send, Loader2, Sparkles, Triangle } from "lucide-react";

/* ─── Grabovoi Codes ─── */

const GRABOVOI_CODES: { code: string; meaning: string }[] = [
  { code: "914 821", meaning: "New Beginnings" },
  { code: "520 741 8", meaning: "Abundance" },
  { code: "888 412 1289018", meaning: "Financial Flow" },
  { code: "318 798", meaning: "Unexpected Miracles" },
  { code: "419 312 893", meaning: "Soul Purpose" },
  { code: "489 317 8", meaning: "Love Attraction" },
  { code: "741 852 963", meaning: "Spiritual Awakening" },
  { code: "519 748 218", meaning: "Self-Healing" },
  { code: "714 273 218", meaning: "Inner Peace" },
];

function getTodaysCode(date: Date) {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return GRABOVOI_CODES[dayOfYear % GRABOVOI_CODES.length];
}

/* ─── Frequency mapping ─── */

const FREQUENCIES = [
  { hz: 396, name: "Liberation", desc: "Release fear" },
  { hz: 417, name: "Transmutation", desc: "Facilitate change" },
  { hz: 528, name: "Miracles", desc: "Transformation" },
  { hz: 639, name: "Connection", desc: "Harmonize" },
  { hz: 741, name: "Awakening", desc: "Consciousness" },
  { hz: 852, name: "Intuition", desc: "Spiritual order" },
  { hz: 963, name: "Divine", desc: "Higher self" },
];

function getTodaysFrequency(date: Date) {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return FREQUENCIES[dayOfYear % FREQUENCIES.length];
}

/* ─── Chinese Zodiac Emoji Map ─── */

const CHINESE_EMOJI: Record<string, { emoji: string; char: string }> = {
  Rat: { emoji: "🐀", char: "子" }, Ox: { emoji: "🐂", char: "丑" },
  Tiger: { emoji: "🐅", char: "寅" }, Rabbit: { emoji: "🐇", char: "卯" },
  Dragon: { emoji: "🐉", char: "辰" }, Snake: { emoji: "🐍", char: "巳" },
  Horse: { emoji: "🐎", char: "午" }, Goat: { emoji: "🐐", char: "未" },
  Monkey: { emoji: "🐒", char: "申" }, Rooster: { emoji: "🐓", char: "酉" },
  Dog: { emoji: "🐕", char: "戌" }, Pig: { emoji: "🐖", char: "亥" },
};

/* ─── Orb Answers ─── */

const ORB_ANSWERS = [
  "The cosmos affirms. Yes.",
  "Not yet. The timing isn't aligned.",
  "Your Air code never lies. Yes.",
  "The universe is rearranging for you.",
  "Trust the process. It's unfolding.",
  "This path leads to transformation.",
  "The stars say: proceed with courage.",
  "Surrender to divine timing.",
  "Your ancestors approve. Move forward.",
  "The energy shifts in your favor soon.",
  "A portal opens when you least expect.",
  "Your frequency attracts the answer.",
  "The veil is thin — trust your vision.",
  "The Oracle sees alignment. Yes.",
  "Release attachment. The answer comes.",
  "Your code is activated. Trust it.",
  "The elements conspire in your favor.",
  "Wait. Something better is forming.",
  "Your soul already knows. Listen.",
  "The cosmic wheel turns toward you.",
];

/* ─── Orb Component ─── */

function TheOrb({ onTap }: { onTap: () => void }) {
  return (
    <button
      onClick={onTap}
      className="relative w-48 h-48 mx-auto rounded-full group transition-transform active:scale-95"
    >
      {/* Outer glow */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-b from-[hsl(220,30%,30%)] to-[hsl(240,20%,15%)] shadow-[0_0_40px_8px_hsl(220,30%,20%/0.4)]" />
      {/* Inner sphere gradient */}
      <div className="absolute inset-2 rounded-full bg-gradient-to-b from-[hsl(220,20%,35%)] via-[hsl(240,15%,20%)] to-[hsl(260,20%,12%)] overflow-hidden">
        {/* Light reflection */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-8 bg-gradient-to-b from-white/20 to-transparent rounded-full blur-sm" />
      </div>
      {/* Triangle + ASK text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
        <Triangle className="w-5 h-5 text-primary/70" />
        <span className="text-xs uppercase tracking-[0.3em] text-primary/70 font-display font-bold">ASK</span>
      </div>
    </button>
  );
}

function OrbWithAnswer({ answer, onTap }: { answer: string; onTap: () => void }) {
  return (
    <button
      onClick={onTap}
      className="relative w-48 h-48 mx-auto rounded-full group transition-transform active:scale-95"
    >
      <div className="absolute inset-0 rounded-full bg-gradient-to-b from-[hsl(220,30%,30%)] to-[hsl(240,20%,15%)] shadow-[0_0_50px_12px_hsl(270,40%,30%/0.3)]" />
      <div className="absolute inset-2 rounded-full bg-gradient-to-b from-[hsl(250,25%,30%)] via-[hsl(260,20%,18%)] to-[hsl(270,20%,12%)] overflow-hidden">
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-6 bg-gradient-to-b from-white/15 to-transparent rounded-full blur-sm" />
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
        <p className="text-sm text-foreground font-display font-bold text-center leading-snug">{answer}</p>
        <Triangle className="w-3 h-3 text-primary/50 mt-2" />
      </div>
    </button>
  );
}

/* ─── Chat Message ─── */

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/* ─── Main Component ─── */

export function OracleChamber({ onBack }: { onBack: () => void }) {
  const { i18n } = useTranslation();
  const { profile } = useAuth();

  const today = useMemo(() => new Date(), []);
  const dob = useMemo(() => profile?.dateOfBirth ? new Date(profile.dateOfBirth + "T12:00:00") : null, [profile?.dateOfBirth]);
  const name = profile?.fullName || "Seeker";
  const zodiac = dob ? getZodiacFromDOB(dob) : null;
  const lifePath = dob ? getLifePath(dob) : null;
  const chineseZodiac = dob ? getChineseZodiac(dob.getFullYear()) : null;
  const chineseData = chineseZodiac ? CHINESE_EMOJI[chineseZodiac] : null;
  const universalDay = getUniversalDay(today);
  const personalDay = dob ? getPersonalDay(dob, today) : 1;
  const dateStr = formatDate(today, i18n.language);

  const todaysCode = getTodaysCode(today);
  const todaysFreq = getTodaysFrequency(today);

  // Oracle daily reading
  const oracleReading = useCachedReading({
    readingType: "oracle_daily",
    cacheKey: `${profile?.dateOfBirth || "guest"}-${today.toISOString().slice(0, 10)}`,
    context: {
      name,
      zodiacSign: zodiac?.sign || "Unknown",
      element: zodiac?.element || "Unknown",
      lifePath: lifePath || "Unknown",
      chineseZodiac: chineseZodiac || "Unknown",
      universalDay,
      personalDay,
      date: dateStr,
      birthPlace: profile?.birthPlace || "Unknown",
      birthTime: profile?.birthTime || "Unknown",
      language: i18n.language,
    },
  });

  // Orb state
  const [orbAnswer, setOrbAnswer] = useState<string | null>(null);
  const [orbAnimating, setOrbAnimating] = useState(false);

  const tapOrb = useCallback(() => {
    setOrbAnimating(true);
    setOrbAnswer(null);
    setTimeout(() => {
      const answer = ORB_ANSWERS[Math.floor(Math.random() * ORB_ANSWERS.length)];
      setOrbAnswer(answer);
      setOrbAnimating(false);
    }, 1200);
  }, []);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || chatLoading) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setChatLoading(true);

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
      setMessages(prev => [...prev, { role: "assistant", content: data?.content || "The veil is thick. Try again." }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "The cosmic frequencies are disrupted. Please try again." }]);
    } finally {
      setChatLoading(false);
    }
  }, [input, chatLoading, messages, name, zodiac, lifePath, chineseZodiac, profile, i18n.language]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <ChamberLayout title="The Oracle" onBack={onBack}>
      <div className="space-y-5">
        {/* ── Header: Chinese Zodiac + Today's Oracle ── */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full bg-muted/30 flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-primary" />
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-display">
            {chineseData ? `${chineseData.char} ${chineseZodiac}` : "✦"} · TODAY'S ORACLE
          </p>
        </div>

        {/* ── Daily Oracle Reading ── */}
        <div className="card-cosmic rounded-2xl p-5 glow-gold relative overflow-hidden">
          <div className="animate-shimmer absolute inset-0 pointer-events-none rounded-2xl" />
          {oracleReading.isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm py-4 justify-center">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span>The Oracle is channeling…</span>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-bold text-primary">Your code is activated. Here's what it means.</p>
              <p className="text-sm text-foreground/90 leading-relaxed">
                {oracleReading.content || "The Oracle is preparing your reading…"}
              </p>
            </div>
          )}
        </div>

        {/* ── Today's Code (Grabovoi) ── */}
        <div className="card-cosmic rounded-2xl px-5 py-4 border-primary/20">
          <p className="text-[10px] uppercase tracking-[0.2em] text-primary/70 font-bold mb-1">TODAY'S CODE</p>
          <div className="flex items-center gap-2">
            <span className="text-primary">△</span>
            <span className="font-display text-lg font-bold text-foreground">{todaysCode.code} — {todaysCode.meaning}</span>
          </div>
        </div>

        {/* ── Today's Frequency ── */}
        <div className="card-cosmic rounded-2xl px-5 py-4 border-primary/20">
          <p className="text-[10px] uppercase tracking-[0.2em] text-primary/70 font-bold mb-1">TODAY'S FREQUENCY</p>
          <div className="flex items-center gap-2">
            <span className="text-primary">◉</span>
            <span className="font-display text-lg font-bold text-foreground">{todaysFreq.hz} Hz — {todaysFreq.name}</span>
          </div>
        </div>

        {/* ── The Orb ── */}
        <div className="text-center space-y-3 py-4">
          <h3 className="font-display text-sm font-bold uppercase tracking-[0.15em] text-foreground">THE ORB</h3>
          <p className="text-xs text-muted-foreground">
            {orbAnswer ? "Tap to ask again" : "Tap the orb for cosmic guidance"}
          </p>

          {orbAnimating ? (
            <div className="relative w-48 h-48 mx-auto rounded-full">
              <div className="absolute inset-0 rounded-full bg-gradient-to-b from-[hsl(220,30%,30%)] to-[hsl(240,20%,15%)] animate-pulse shadow-[0_0_50px_12px_hsl(270,40%,30%/0.4)]" />
              <div className="absolute inset-2 rounded-full bg-gradient-to-b from-[hsl(250,25%,30%)] via-[hsl(260,20%,18%)] to-[hsl(270,20%,12%)]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-primary/50 animate-spin" />
              </div>
            </div>
          ) : orbAnswer ? (
            <OrbWithAnswer answer={orbAnswer} onTap={tapOrb} />
          ) : (
            <TheOrb onTap={tapOrb} />
          )}

          {orbAnswer && (
            <p className="text-xs uppercase tracking-[0.2em] text-primary font-bold animate-fade-up">
              ✦ THE COSMOS AFFIRMS
            </p>
          )}
        </div>

        {/* ── Chat Messages ── */}
        {messages.length > 0 && (
          <div ref={scrollRef} className="space-y-3 max-h-[50vh] overflow-y-auto no-scrollbar">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-secondary/60 text-foreground rounded-br-sm"
                    : "card-cosmic text-foreground/90"
                }`}>
                  {msg.role === "assistant" && (
                    <p className="text-[10px] uppercase tracking-wider text-primary/70 font-bold mb-1">✦ ORACLE</p>
                  )}
                  <span className="whitespace-pre-line">{msg.content}</span>
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="card-cosmic rounded-2xl px-4 py-3">
                  <p className="text-[10px] uppercase tracking-wider text-primary/70 font-bold mb-1">✦ ORACLE</p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Ask the Oracle ── */}
        <div className="space-y-3">
          <div className="text-center">
            <h3 className="font-display text-base font-bold text-foreground">Ask the Oracle, {name.split(" ")[0]}</h3>
            <p className="text-xs text-muted-foreground italic">Speak your question into the void</p>
          </div>
          <div className="flex items-end gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask the Oracle anything…"
              className="flex-1 bg-muted/20 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || chatLoading}
              className="w-11 h-11 rounded-xl bg-primary/20 border border-primary/40 text-primary flex items-center justify-center disabled:opacity-40 hover:bg-primary/30 transition-colors shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </ChamberLayout>
  );
}
