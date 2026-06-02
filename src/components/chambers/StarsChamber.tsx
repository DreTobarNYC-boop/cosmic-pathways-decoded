import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ChamberLayout } from "@/components/ChamberLayout";
import { TodayReadingCard } from "@/components/TodayReadingCard";
import { useAuth } from "@/hooks/use-auth";
import { useCachedReading } from "@/hooks/use-cached-reading";
import { getZodiacFromDOB, getUniversalDay, getUniversalMonth, getPersonalDay, getLifePath, getChineseZodiac } from "@/lib/daily";
import { calculateNatalChart } from "@/lib/natal-chart";
import { NatalChartWheel } from "@/components/NatalChartWheel";
import { getNumerologyProfile } from "@/lib/numerology-deep";

const TABS = [
  { id: "birth_chart",   labelKey: "stars.tabs.birthChart" },
  { id: "today",         labelKey: "stars.tabs.today" },
  { id: "monthly",       labelKey: "stars.tabs.monthly" },
  { id: "yearly",        labelKey: "stars.tabs.yearly" },
  { id: "love",          labelKey: "stars.tabs.love" },
  { id: "career",        labelKey: "stars.tabs.career" },
  { id: "wellness",      labelKey: "stars.tabs.wellness" },
  { id: "compatibility", labelKey: "stars.tabs.compatibility" },
];

const TAB_READING_TYPE: Record<string, string> = {
  birth_chart:   "stars_today",
  today:         "daily_horoscope",
  monthly:       "stars_monthly",
  yearly:        "stars_yearly",
  love:          "stars_love",
  career:        "stars_career",
  wellness:      "stars_wellness",
  compatibility: "compatibility",
};

export function StarsChamber({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState("today");
  const { profile } = useAuth();
  const { i18n } = useTranslation();
  const lang = i18n.language ?? "en";

  const dob = useMemo(() =>
    profile?.dateOfBirth ? new Date(profile.dateOfBirth + "T12:00:00") : null,
  [profile?.dateOfBirth]);

  const today = new Date();
  const dateKey = today.toISOString().slice(0, 10);

  const zodiac     = dob ? getZodiacFromDOB(dob) : null;
  const natal      = dob ? calculateNatalChart(dob) : null;
  const numerology = (dob && profile?.fullName)
    ? getNumerologyProfile(profile.fullName, dob)
    : null;
  const lifePath      = dob ? getLifePath(dob) : null;
  const personalDay   = dob ? getPersonalDay(dob) : null;
  const universalDay  = getUniversalDay();
  const chineseZodiac = dob ? getChineseZodiac(dob.getFullYear()) : null;

  const richContext = useMemo(() => ({
    name:          profile?.fullName ?? "Seeker",
    sign:          zodiac?.sign ?? "Unknown",
    sunSign:       natal?.sun.sign ?? zodiac?.sign ?? "Unknown",
    sunDegree:     natal?.sun.degree ?? 0,
    moonSign:      natal?.moon.sign ?? "Unknown",
    moonDegree:    natal?.moon.degree ?? 0,
    mercurySign:   natal?.mercury.sign ?? "Unknown",
    venusSign:     natal?.venus.sign ?? "Unknown",
    marsSign:      natal?.mars.sign ?? "Unknown",
    lifePath:      lifePath ?? 0,
    personalDay:   personalDay ?? 0,
    universalDay,
    expression:    numerology?.expression ?? 0,
    soulUrge:      numerology?.soulUrge ?? 0,
    personality:   numerology?.personality ?? 0,
    cuspStatus:    zodiac?.cusp ? (zodiac.cuspSign ?? "Cusp") : "None",
    chineseZodiac: chineseZodiac ?? "Unknown",
    element:       zodiac?.element ?? "Unknown",
    language:      lang,
  }), [zodiac, natal, numerology, lifePath, personalDay, universalDay, chineseZodiac, profile, lang]);

  const readingType = TAB_READING_TYPE[activeTab] ?? "daily_horoscope";
  const cacheKey = `${readingType}_${dateKey}_${lang}`;

  const { content: reading, isLoading, error, retry } = useCachedReading({
    readingType,
    context: richContext,
    cacheKey,
    enabled: !!dob,
  });

  const year = new Date().getFullYear();

  return (
    <ChamberLayout title={t("chamberPages.stars.title")} subtitle={t("chamberPages.stars.subtitle")} onBack={onBack}>
      {zodiac && (
        <div className="flex gap-2 flex-wrap mb-4">
          <span className="px-3 py-1 rounded-full border border-[#C5A059]/30 bg-[#C5A059]/10 text-[#C5A059] text-xs tracking-wider">
            {t(`elements.${zodiac.element}`, zodiac.element)} · {zodiac.sign}
          </span>
          {lifePath && (
            <span className="px-3 py-1 rounded-full border border-[#C5A059]/30 bg-[#C5A059]/10 text-[#C5A059] text-xs tracking-wider">
              {t("briefing.path", { number: lifePath })}
            </span>
          )}
          {chineseZodiac && (
            <span className="px-3 py-1 rounded-full border border-[#C5A059]/30 bg-[#C5A059]/10 text-[#C5A059] text-xs tracking-wider">
              {t(`chineseAnimals.${chineseZodiac}`, chineseZodiac)}
            </span>
          )}
          {natal && (
            <span className="px-3 py-1 rounded-full border border-[#C5A059]/20 bg-[#0B1A1A] text-[#FFFDD0]/50 text-[10px] tracking-wider w-full">
              {natal.formatted}
            </span>
          )}
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 no-scrollbar">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-full text-xs tracking-wider whitespace-nowrap border transition-all ${
              activeTab === tab.id
                ? "border-[#C5A059] bg-[#C5A059]/20 text-[#C5A059]"
                : "border-[#C5A059]/20 text-[#FFFDD0]/40 hover:text-[#FFFDD0]/70"
            }`}
          >
            {t(tab.labelKey, tab.id === "yearly" ? { year } : undefined)}
          </button>
        ))}
      </div>

      {activeTab === "birth_chart" && !natal && (
        <div className="flex flex-col items-center justify-center text-center py-16 space-y-3">
          <p className="text-4xl">✦</p>
          <p className="font-display text-lg text-foreground">{t("stars.awaitsBirthDate")}</p>
          <p className="text-sm text-muted-foreground max-w-xs">{t("stars.enterDOB")}</p>
        </div>
      )}

      {activeTab === "birth_chart" && natal && (
        <div className="flex flex-col gap-4">
          {/* Co-Star style natal wheel */}
          <NatalChartWheel natal={natal} />

          <div className="rounded-xl border border-[#C5A059]/20 bg-[#0B1A1A] p-5">
            <p className="text-[#C5A059] text-[10px] tracking-[0.2em] uppercase mb-3">{t("stars.natalPlanets")}</p>
            {[
              { label: "☉ " + t("natalWheel.sun"),     value: `${natal.sun.sign} ${natal.sun.degree}° · House ${natal.sun.house}` },
              { label: "☽ " + t("natalWheel.moon"),    value: `${natal.moon.sign} ${natal.moon.degree}° · House ${natal.moon.house}` },
              { label: "☿ " + t("natalWheel.mercury"), value: `${natal.mercury.sign} ${natal.mercury.degree}° · House ${natal.mercury.house}` },
              { label: "♀ " + t("natalWheel.venus"),   value: `${natal.venus.sign} ${natal.venus.degree}° · House ${natal.venus.house}` },
              { label: "♂ " + t("natalWheel.mars"),    value: `${natal.mars.sign} ${natal.mars.degree}° · House ${natal.mars.house}` },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center py-2 border-b border-[#C5A059]/10 last:border-0">
                <span className="text-[#C5A059] text-sm">{label}</span>
                <span className="text-[#FFFDD0]/70 text-sm">{value}</span>
              </div>
            ))}
          </div>
          {numerology && (
            <div className="rounded-xl border border-[#C5A059]/20 bg-[#0B1A1A] p-5">
              <p className="text-[#C5A059] text-[10px] tracking-[0.2em] uppercase mb-3">{t("stars.numerology")}</p>
              {[
                { label: t("stars.lifePath"),   value: `${numerology.lifePath} · ${numerology.descriptions.lifePath}` },
                { label: t("stars.expression"), value: `${numerology.expression} · ${numerology.descriptions.expression}` },
                { label: t("stars.soulUrge"),   value: `${numerology.soulUrge} · ${numerology.descriptions.soulUrge}` },
                { label: t("stars.personality"),value: `${numerology.personality} · ${numerology.descriptions.personality}` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-start py-2 border-b border-[#C5A059]/10 last:border-0 gap-4">
                  <span className="text-[#C5A059] text-sm shrink-0">{label}</span>
                  <span className="text-[#FFFDD0]/70 text-xs text-right">{value}</span>
                </div>
              ))}
            </div>
          )}
          <div className="rounded-xl border border-[#C5A059]/20 bg-[#0B1A1A] p-5">
            <p className="text-[#C5A059] text-[10px] tracking-[0.2em] uppercase mb-3">{t("stars.dailyNumbers")}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <p className="text-[#FFFDD0]/40 text-[9px] tracking-wider uppercase mb-1">{t("stars.universalDay")}</p>
                <p className="text-[#C5A059] text-3xl font-['Libre_Baskerville']">{universalDay}</p>
              </div>
              {personalDay && (
                <div className="text-center">
                  <p className="text-[#FFFDD0]/40 text-[9px] tracking-wider uppercase mb-1">{t("stars.personalDay")}</p>
                  <p className="text-[#C5A059] text-3xl font-['Libre_Baskerville']">{personalDay}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <TodayReadingCard
        data={reading}
        isLoading={isLoading}
        error={error}
        onRetry={retry}
      />
    </ChamberLayout>
  );
}
