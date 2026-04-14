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
import { Loader2 } from "lucide-react";

const TABS = [
  { key: "today",    label: "TODAY",    readingType: "stars_today" },
  { key: "monthly",  label: "MONTHLY",  readingType: "stars_monthly" },
  { key: "yearly",   label: "YEARLY",   readingType: "stars_yearly" },
  { key: "love",     label: "LOVE",     readingType: "stars_love" },
  { key: "career",   label: "CAREER",   readingType: "stars_career" },
  { key: "wellness", label: "WELLNESS", readingType: "stars_wellness" },
];

export function StarsChamber({ onBack }: { onBack: () => void }) {
  const { i18n } = useTranslation();
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

  // TODAY uses the same readingType + cacheKey as DailyBriefing so they share the cached reading
  const todayReading = useCachedReading({ readingType: "daily_horoscope", cacheKey: `${dateKey}_${rawLang}`, context: dailyContext });
  const monthly  = useCachedReading({ readingType: "stars_monthly",  cacheKey: `${sign}-monthly-${dateKeyMonth}-${language}`, context });
  const yearly   = useCachedReading({ readingType: "stars_yearly",   cacheKey: `${sign}-yearly-${yearKey}-${language}`,  context });
  const love     = useCachedReading({ readingType: "stars_love",     cacheKey: `${sign}-love-${dateKeyMonth}-${language}`,    context });
  const career   = useCachedReading({ readingType: "stars_career",   cacheKey: `${sign}-career-${dateKeyMonth}-${language}`,  context });
  const wellness = useCachedReading({ readingType: "stars_wellness", cacheKey: `${sign}-wellness-${dateKeyMonth}-${language}`, context });

  const readings: Record<string, { content: string | null; isLoading: boolean; error: string | null }> = {
    today: todayReading, monthly, yearly, love, career, wellness,
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

        {/* ─── Reading Card ─── */}
        <div className="card-cosmic rounded-2xl p-5">
          {current.isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm py-4 justify-center">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span>Reading the stars…</span>
            </div>
          ) : (
            <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
              {current.content || "Your reading is preparing…"}
            </p>
          )}
        </div>

      </div>
    </ChamberLayout>
  );
}
