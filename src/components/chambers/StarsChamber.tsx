import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ChamberLayout } from "@/components/ChamberLayout";
import { useAuth } from "@/hooks/use-auth";
import { useCachedReading } from "@/hooks/use-cached-reading";
import {
  getZodiacFromDOB,
  getLifePath,
  getChineseZodiac,
  getUniversalDay,
  getPersonalDay,
  getCuspInfo,
  formatDate,
} from "@/lib/daily";
import { normalizeLanguage } from "@/lib/language";
import { Loader2, RefreshCw } from "lucide-react";
import { BirthChartContent } from "@/components/BirthChartContent";

const TABS = [
  { key: "birthChart", label: "BIRTH CHART", readingType: "stars_birth_chart" },
  { key: "today",      label: "TODAY",        readingType: "stars_today" },
  { key: "monthly",    label: "MONTHLY",      readingType: "stars_monthly" },
  { key: "yearly",     label: "YEARLY",       readingType: "stars_yearly" },
  { key: "love",       label: "LOVE",         readingType: "stars_love" },
  { key: "career",     label: "CAREER",       readingType: "stars_career" },
  { key: "wellness",   label: "WELLNESS",     readingType: "stars_wellness" },
];

export function StarsChamber({ onBack }: { onBack: () => void }) {
  const { t, i18n } = useTranslation();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("today");

  const language = normalizeLanguage(i18n.language);
  const rawLang = i18n.language;
  const name = profile?.fullName || "Seeker";
  const dob = useMemo(
    () => (profile?.dateOfBirth ? new Date(profile.dateOfBirth + "T12:00:00") : null),
    [profile?.dateOfBirth],
  );
  const zodiac = dob ? getZodiacFromDOB(dob) : null;
  const sign = zodiac?.sign || "Unknown";

  const today = new Date();
  const dateKey = today.toISOString().slice(0, 10); // YYYY-MM-DD
  const dateKeyMonth = today.toISOString().slice(0, 7); // YYYY-MM
  const yearKey = String(today.getFullYear());

  // Rich context for the daily horoscope (mirrors DailyBriefing so they share the same cache)
  const lifePath = dob ? getLifePath(dob) : undefined;
  const chineseZodiac = dob ? getChineseZodiac(dob.getFullYear()) : undefined;
  const universalDay = getUniversalDay(today);
  const personalDay = dob ? getPersonalDay(dob, today) : undefined;
  const cusp = dob ? getCuspInfo(dob.getMonth() + 1, dob.getDate()) : { onCusp: false };

  // Context for daily horoscope — matches DailyBriefing's context shape so the cache entry is shared
  const dailyContext = {
    zodiacSign: sign,
    element: zodiac?.element || "Unknown",
    lifePath,
    chineseZodiac,
    date: formatDate(today, rawLang),
    universalDay,
    personalDay,
    name,
    birthPlace: profile?.birthPlace || "Unknown",
    birthTime: profile?.birthTime || "Unknown",
    cuspInfo: cusp.onCusp ? (cusp.cuspDescription ?? null) : null,
    language: rawLang,
  };

  const context = {
    name,
    sign,
    zodiacSign: sign,
    element: zodiac?.element || "Unknown",
    birthPlace: profile?.birthPlace || "Unknown",
    birthTime: profile?.birthTime || "Unknown",
    dateOfBirth: profile?.dateOfBirth || "Unknown",
    language,
  };

  // TODAY uses stars_today to match the TABS definition and get the full structured Stars chamber reading
  const todayReading = useCachedReading({ readingType: "stars_today", cacheKey: `${sign}-today-${dateKey}-${language}`, context: dailyContext });
  const monthly  = useCachedReading({ readingType: "stars_monthly",  cacheKey: `${sign}-monthly-${dateKeyMonth}-${language}`, context });
  const yearly   = useCachedReading({ readingType: "stars_yearly",   cacheKey: `${sign}-yearly-${yearKey}-${language}`,  context });
  const love     = useCachedReading({ readingType: "stars_love",     cacheKey: `${sign}-love-${dateKeyMonth}-${language}`,    context });
  const career   = useCachedReading({ readingType: "stars_career",   cacheKey: `${sign}-career-${dateKeyMonth}-${language}`,  context });
  const wellness = useCachedReading({ readingType: "stars_wellness", cacheKey: `${sign}-wellness-${dateKeyMonth}-${language}`, context });

  // Birth chart — permanent cache key based on birth data only (generated once per user)
  const birthChartCacheKey = dob
    ? `birth-chart-${profile?.dateOfBirth || ""}-${profile?.birthPlace || ""}-${profile?.birthTime || ""}-${language}`
    : "";
  const birthChart = useCachedReading({
    readingType: "stars_birth_chart",
    cacheKey: birthChartCacheKey,
    context,
    enabled: !!birthChartCacheKey,
  });

  const readings: Record<string, { content: string | null; isLoading: boolean; error: string | null; retry: () => void }> = {
    birthChart, today: todayReading, monthly, yearly, love, career, wellness,
  };

  const current = readings[activeTab];

  return (
    <ChamberLayout
      title="The Stars"
      subtitle={zodiac ? `${zodiac.symbol} ${sign}` : undefined}
      onBack={onBack}
    >
      <div className="space-y-5">

        {/* ─── Tab Navigation ─── */}
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`text-xs tracking-widest px-3 py-1.5 rounded-full border transition-all ${
                activeTab === tab.key
                  ? "border-primary text-primary bg-primary/10"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── Birth Chart (structured TABLE/CIRCLE view) ─── */}
        {activeTab === "birthChart" ? (
          <BirthChartContent
            readingType="stars_birth_chart"
            cacheKey={birthChartCacheKey}
            context={context}
          />
        ) : (
          /* ─── Other Reading Cards ─── */
          <div className="card-cosmic rounded-2xl p-5">
            {current.isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm py-4 justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span>{t("stars.consulting")}</span>
              </div>
            ) : current.error && !current.content ? (
              <div className="text-center py-4 space-y-3">
                <p className="text-sm text-muted-foreground">{t("stars.noReading")}</p>
                <button
                  onClick={current.retry}
                  className="inline-flex items-center gap-1.5 text-xs tracking-widest px-4 py-2 rounded-full border border-primary/40 text-primary hover:border-primary transition-all"
                >
                  <RefreshCw className="w-3 h-3" />
                  RETRY
                </button>
              </div>
            ) : (
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                {current.content || "Your reading is preparing…"}
              </p>
            )}
          </div>
        )}

      </div>
    </ChamberLayout>
  );
}
