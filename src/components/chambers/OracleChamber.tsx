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
import { normalizeLanguage } from "@/lib/language";
import { Send, Loader2, Sparkles } from "lucide-react";
import { useSubscription } from "@/hooks/use-subscription";

/* ─── Grabovoi Codes ─── */

const GRABOVOI_CODES: { code: string; meaning: string; key: string }[] = [
  { code: "914 821",         meaning: "New Beginnings",     key: "newBeginnings" },
  { code: "520 741 8",       meaning: "Abundance",          key: "abundance" },
  { code: "888 412 1289018", meaning: "Financial Flow",     key: "financialFlow" },
  { code: "318 798",         meaning: "Unexpected Miracles",key: "unexpectedMiracles" },
  { code: "419 312 893",     meaning: "Soul Purpose",       key: "soulPurpose" },
  { code: "489 317 8",       meaning: "Love Attraction",    key: "loveAttraction" },
  { code: "741 852 963",     meaning: "Spiritual Awakening",key: "spiritualAwakening" },
  { code: "519 748 218",     meaning: "Self-Healing",       key: "selfHealing" },
  { code: "714 273 218",     meaning: "Inner Peace",        key: "innerPeace" },
];

function getTodaysCode(date: Date) {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return GRABOVOI_CODES[dayOfYear % GRABOVOI_CODES.length];
}

/* ─── Frequency mapping ─── */

const FREQUENCIES = [
  { hz: 396, name: "Liberation",    key: "liberation",    desc: "Release fear" },
  { hz: 417, name: "Transmutation", key: "transmutation", desc: "Facilitate change" },
  { hz: 528, name: "Miracles",      key: "miracles",      desc: "Transformation" },
  { hz: 639, name: "Connection",    key: "connection",    desc: "Harmonize" },
  { hz: 741, name: "Awakening",     key: "awakening",     desc: "Consciousness" },
  { hz: 852, name: "Intuition",     key: "intuition",     desc: "Spiritual order" },
  { hz: 963, name: "Divine",        key: "divine",        desc: "Higher self" },
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

/* ─── Chat Message ─── */

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/* ─── Main Component ─── */

export function OracleChamber({ onBack }: { onBack: () => void }) {
  const { t, i18n } = useTranslation();
  const { profile } = useAuth();
  const { isLocked, openPaywall } = useSubscription();

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
      language: normalizeLanguage(i18n.language),
    },
  });


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

    // Free tier: 1 Oracle question. After that, paywall.
    if (isLocked) {
      const questionsAsked = messages.filter(m => m.role === "user").length;
      if (questionsAsked >= 1) {
        openPaywall(t("chambers.theOracle"));
        return;
      }
    }

    const userMsg: ChatMessage = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setChatLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-reading", {
        body: {
          readingType: "oracle_chat",
          reading_type: "oracle_chat",
          language: normalizeLanguage(i18n.language),
          context: {
            name,
            zodiacSign: zodiac?.sign || "Unknown",
            element: zodiac?.element || "Unknown",
            lifePath: lifePath || "Unknown",
            chineseZodiac: chineseZodiac || "Unknown",
            birthPlace: profile?.birthPlace || "Unknown",
            birthTime: profile?.birthTime || "Unknown",
      language: normalizeLanguage(i18n.language),
      userMessage: text,
            conversationHistory: newMessages.slice(-8).map(m => `${m.role}: ${m.content}`).join("\n"),
          },
        },
      });

      if (error) throw new Error(error.message);
      setMessages(prev => [...prev, { role: "assistant", content: data?.reading || "The veil is thick. Try again." }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "The cosmic frequencies are disrupted. Please try again." }]);
    } finally {
      setChatLoading(false);
    }
  }, [input, chatLoading, messages, name, zodiac, lifePath, chineseZodiac, profile, i18n.language, isLocked, openPaywall, t]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <ChamberLayout title={t("chambers.theOracle")} onBack={onBack}>
      <div className="space-y-5">
        {/* ── Header: Chinese Zodiac + Today's Oracle ── */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full bg-muted/30 flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-primary" />
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-display">
            {chineseData ? (chineseData.char + " " + t("chineseAnimals." + (chineseZodiac ?? ""), chineseZodiac ?? "")) : "✦"} · {t("oracle.todaysOracle")}
          </p>
        </div>

        {/* ── Daily Oracle Reading ── */}
        <div className="card-cosmic rounded-2xl p-5 glow-gold relative overflow-hidden">
          <div className="animate-shimmer absolute inset-0 pointer-events-none rounded-2xl" />
          {oracleReading.isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm py-4 justify-center">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span>{t("oracle.channeling")}</span>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-bold text-primary">{t("oracle.codeActivated")}</p>
              <p className="text-sm text-foreground/90 leading-relaxed">
                {(() => {
                  const raw = oracleReading.content || "";
                  if (!raw) return t("oracle.preparingReading");
                  if (raw.startsWith("{")) {
                    try { return JSON.parse(raw)?.reading ?? raw; } catch { return raw; }
                  }
                  return raw;
                })()}
              </p>
            </div>
          )}
        </div>

        {/* ── Today's Code (Grabovoi) ── */}
        <div className="card-cosmic rounded-2xl px-5 py-4 border-primary/20">
          <p className="text-[10px] uppercase tracking-[0.2em] text-primary/70 font-bold mb-1">{t("oracle.todaysCode")}</p>
          <div className="flex items-center gap-2">
            <span className="text-primary">△</span>
            <span className="font-display text-lg font-bold text-foreground">{todaysCode.code} — {t(`oracle.codes.${todaysCode.key}`, todaysCode.meaning)}</span>
          </div>
        </div>

        {/* ── Today's Frequency ── */}
        <div className="card-cosmic rounded-2xl px-5 py-4 border-primary/20">
          <p className="text-[10px] uppercase tracking-[0.2em] text-primary/70 font-bold mb-1">{t("oracle.todaysFrequency")}</p>
          <div className="flex items-center gap-2">
            <span className="text-primary">◉</span>
            <span className="font-display text-lg font-bold text-foreground">{todaysFreq.hz} Hz — {t(`oracle.freqs.${todaysFreq.key}`, todaysFreq.name)}</span>
          </div>
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
                    <p className="text-[10px] uppercase tracking-wider text-primary/70 font-bold mb-1">{t("oracle.oracleLabel")}</p>
                  )}
                  <span className="whitespace-pre-line">{msg.content}</span>
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="card-cosmic rounded-2xl px-4 py-3">
                  <p className="text-[10px] uppercase tracking-wider text-primary/70 font-bold mb-1">{t("oracle.oracleLabel")}</p>
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
            <h3 className="font-display text-base font-bold text-foreground">{t("oracle.askOracle", { name: name.split(" ")[0] })}</h3>
            <p className="text-xs text-muted-foreground italic">{t("oracle.speakQuestion")}</p>
          </div>
          <div className="flex items-end gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("oracle.inputPlaceholder")}
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
