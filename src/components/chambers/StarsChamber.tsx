import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ChamberLayout } from "@/components/ChamberLayout";
import { Star, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  formatDate,
  getZodiacFromDOB,
  getLifePath,
  getChineseZodiac,
  getUniversalDay,
  getPersonalDay,
  getCuspInfo,
} from "@/lib/daily";
import { getFallbackHoroscope } from "@/lib/fallbacks";
import { useCachedReading } from "@/hooks/use-cached-reading";

interface StarsReading {
  title: string;
  subtitle: string;
  reading: string;
  cosmicAdvice?: string;
  luckyNumber?: number;
  powerColor?: string;
  affirmation?: string;
}

const TABS = [
  { id: "birth_chart", icon: "◎", labelKey: "stars.tabs.birthChart" },
  { id: "today", icon: "◇", labelKey: "stars.tabs.today" },
  { id: "monthly", icon: "▣", labelKey: "stars.tabs.monthly" },
  { id: "yearly", icon: "✦", label: String(new Date().getFullYear()) },
  { id: "love", icon: "◈", labelKey: "stars.tabs.love" },
  { id: "career", icon: "▧", labelKey: "stars.tabs.career" },
];

function parseStarsReading(raw: string | null): StarsReading | null {
  if (!raw) return null;
  try {
    // Strip markdown code fences if present
    const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    // If AI returned plain text, wrap it
    return { title: "", subtitle: "", reading: raw };
  }
}

function StarsTabContent({
  readingType,
  cacheKey,
  context,
  zodiac,
}: {
  readingType: string;
  cacheKey: string;
  context: Record<string, unknown>;
  zodiac: { sign: string; symbol: string; element: string };
}) {
  const { t } = useTranslation();
  const { content, isLoading } = useCachedReading({
    readingType,
    cacheKey,
    context,
    fallback: undefined,
  });

  const reading = parseStarsReading(content);

  if (isLoading) {
    return (
      <div className="card-cosmic rounded-2xl p-8 text-center mt-4">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span className="text-sm">{t("stars.consulting")}</span>
        </div>
      </div>
    );
  }

  if (!reading) {
    return (
      <div className="card-cosmic rounded-2xl p-8 text-center mt-4">
        <Star className="w-8 h-8 mx-auto text-primary/40 mb-3" />
        <p className="text-sm text-muted-foreground">{t("stars.noReading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4 animate-fade-up">
      {/* Main reading card */}
      <div className="card-cosmic rounded-2xl p-6 glow-gold relative overflow-hidden">
        <div className="animate-shimmer absolute inset-0 pointer-events-none rounded-2xl" />

        {reading.title && (
          <h2 className="text-xl font-display font-bold text-foreground mb-1">
            {reading.title}
          </h2>
        )}
        {reading.subtitle && (
          <p className="text-sm text-primary/80 mb-5">{reading.subtitle}</p>
        )}

        <div className="text-base text-foreground/90 leading-relaxed font-display whitespace-pre-line">
          {reading.reading}
        </div>
      </div>

      {/* Cosmic Advice */}
      {reading.cosmicAdvice && (
        <div className="card-cosmic rounded-2xl p-5">
          <p className="text-[11px] uppercase tracking-[0.2em] text-primary/70 mb-2 font-bold">
            {t("stars.cosmicAdvice")}
          </p>
          <p className="text-base text-foreground/80 leading-relaxed font-display italic">
            "{reading.cosmicAdvice}"
          </p>
        </div>
      )}

      {/* Lucky #, Power Color, Sun */}
      {(reading.luckyNumber || reading.powerColor) && (
        <div className="grid grid-cols-3 gap-3">
          {reading.luckyNumber && (
            <div className="card-cosmic rounded-2xl p-4 text-center">
              <p className="text-[10px] uppercase tracking-[0.15em] text-primary/70 font-bold mb-1">
                {t("stars.luckyNumber")}
              </p>
              <p className="text-2xl font-display font-bold text-primary">
                {reading.luckyNumber}
              </p>
            </div>
          )}
          {reading.powerColor && (
            <div className="card-cosmic rounded-2xl p-4 text-center">
              <p className="text-[10px] uppercase tracking-[0.15em] text-primary/70 font-bold mb-1">
                {t("stars.powerColor")}
              </p>
              <p className="text-sm font-display font-bold text-primary">
                {reading.powerColor}
              </p>
            </div>
          )}
          <div className="card-cosmic rounded-2xl p-4 text-center">
            <p className="text-[10px] uppercase tracking-[0.15em] text-primary/70 font-bold mb-1">
              {t("stars.sun")}
            </p>
            <p className="text-2xl">{zodiac.symbol}</p>
          </div>
        </div>
      )}

      {/* Affirmation */}
      {reading.affirmation && (
        <div className="card-cosmic rounded-2xl p-5 bg-primary/5 border-primary/20 text-center">
          <p className="text-[11px] uppercase tracking-[0.2em] text-primary font-bold mb-2">
            {t("stars.affirmation")}
          </p>
          <p className="text-base text-foreground/80 leading-relaxed font-display italic">
            "{reading.affirmation}"
          </p>
        </div>
      )}
    </div>
  );
}

export function StarsChamber({ onBack }: { onBack: () => void }) {
  const { t, i18n } = useTranslation();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("today");

  const today = new Date();
  const dob = profile ? new Date(profile.dateOfBirth + "T00:00:00") : new Date();
  const zodiac = getZodiacFromDOB(dob);
  const lifePath = getLifePath(dob);
  const chineseZodiac = getChineseZodiac(dob.getFullYear());
  const universalDay = getUniversalDay(today);
  const personalDay = getPersonalDay(dob, today);
  const lang = i18n.language;
  const dateKey = today.toISOString().split("T")[0];
  const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  const baseContext = useMemo(() => ({
    zodiacSign: zodiac.sign,
    element: zodiac.element,
    lifePath,
    chineseZodiac,
    date: formatDate(today, lang),
    universalDay,
    personalDay,
    name: profile?.fullName || "",
    birthPlace: profile?.birthPlace || "",
    birthTime: profile?.birthTime || "",
    dateOfBirth: profile?.dateOfBirth || "",
    language: lang,
  }), [zodiac.sign, zodiac.element, lifePath, chineseZodiac, lang, profile?.fullName]);

  const tabConfig: Record<string, { readingType: string; cacheKey: string }> = {
    today: { readingType: "stars_today", cacheKey: `${dateKey}_${lang}` },
    monthly: { readingType: "stars_monthly", cacheKey: `${monthKey}_${lang}` },
    yearly: { readingType: "stars_yearly", cacheKey: `${today.getFullYear()}_${lang}` },
    love: { readingType: "stars_love", cacheKey: `${dateKey}_${lang}` },
    career: { readingType: "stars_career", cacheKey: `${dateKey}_${lang}` },
    birth_chart: { readingType: "stars_birth_chart", cacheKey: `chart_${lang}` },
  };

  const currentTab = tabConfig[activeTab] || tabConfig.today;

  return (
    <ChamberLayout title={t("chamberPages.stars.title")} subtitle={t("chamberPages.stars.subtitle")} onBack={onBack}>
      {/* Horizontally scrollable tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none mt-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-display font-bold whitespace-nowrap transition-all shrink-0 ${
              activeTab === tab.id
                ? "bg-primary/20 text-primary border border-primary/30"
                : "bg-muted/20 text-muted-foreground border border-transparent hover:bg-muted/30"
            }`}
          >
            <span className="text-xs">{tab.icon}</span>
            {"labelKey" in tab && tab.labelKey ? t(tab.labelKey) : tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <StarsTabContent
        key={activeTab}
        readingType={currentTab.readingType}
        cacheKey={currentTab.cacheKey}
        context={baseContext}
        zodiac={zodiac}
      />
    </ChamberLayout>
  );
}
