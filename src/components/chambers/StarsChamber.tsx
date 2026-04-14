import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ChamberLayout } from "@/components/ChamberLayout";
import { useAuth } from "@/hooks/use-auth";
import { useCachedReading } from "@/hooks/use-cached-reading";
import { getZodiacFromDOB } from "@/lib/daily";
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
  const name = profile?.fullName || "Seeker";
  const dob = useMemo(
    () => (profile?.dateOfBirth ? new Date(profile.dateOfBirth + "T12:00:00") : null),
    [profile?.dateOfBirth],
  );
  const zodiac = dob ? getZodiacFromDOB(dob) : null;
  const sign = zodiac?.sign || "Unknown";

  const dateKey = new Date().toISOString().slice(0, 7); // YYYY-MM
  const todayKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const yearKey = String(new Date().getFullYear());

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

  const today    = useCachedReading({ readingType: "stars_today",    cacheKey: `${sign}-today-${todayKey}-${language}`,  context });
  const monthly  = useCachedReading({ readingType: "stars_monthly",  cacheKey: `${sign}-monthly-${dateKey}-${language}`, context });
  const yearly   = useCachedReading({ readingType: "stars_yearly",   cacheKey: `${sign}-yearly-${yearKey}-${language}`,  context });
  const love     = useCachedReading({ readingType: "stars_love",     cacheKey: `${sign}-love-${dateKey}-${language}`,    context });
  const career   = useCachedReading({ readingType: "stars_career",   cacheKey: `${sign}-career-${dateKey}-${language}`,  context });
  const wellness = useCachedReading({ readingType: "stars_wellness", cacheKey: `${sign}-wellness-${dateKey}-${language}`, context });

  const readings: Record<string, { content: string | null; isLoading: boolean; error: string | null }> = {
    today, monthly, yearly, love, career, wellness,
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
