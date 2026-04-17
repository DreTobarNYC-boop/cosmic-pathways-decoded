import { useState, useMemo } from "react";
import { ChamberLayout } from "@/components/ChamberLayout";
import { TodayReadingCard } from "@/components/TodayReadingCard";
import { useAuth } from "@/hooks/use-auth";
import { useCachedReading } from "@/hooks/use-cached-reading";
import { getZodiacFromDOB, getUniversalDay, getUniversalMonth, getPersonalDay, getLifePath, getChineseZodiac } from "@/lib/daily";
import { calculateNatalChart } from "@/lib/natal-chart";
import { getNumerologyProfile } from "@/lib/numerology-deep";

const TABS = [
  { id: "birth_chart",   label: "Birth Chart" },
  { id: "today",         label: "Today" },
  { id: "monthly",       label: "Monthly" },
  { id: "yearly",        label: "2026" },
  { id: "love",          label: "Love" },
  { id: "career",        label: "Career" },
  { id: "wellness",      label: "Wellness" },
  { id: "compatibility", label: "Compatibility" },
];

const TAB_READING_TYPE: Record<string, string> = {
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
  }), [zodiac, natal, numerology, lifePath, personalDay, universalDay, chineseZodiac, profile]);

  const readingType = TAB_READING_TYPE[activeTab] ?? "daily_horoscope";
  const cacheKey = `${readingType}_${dateKey}`;

  const { content: reading, isLoading, error } = useCachedReading({
    readingType,
    context: richContext,
    cacheKey,
    enabled: activeTab !== "birth_chart",
  });

  return (
    <ChamberLayout title="The Stars" subtitle="Birth Chart & Horoscopes" onBack={onBack}>
      {zodiac && (
        <div className="flex gap-2 flex-wrap mb-4">
          <span className="px-3 py-1 rounded-full border border-[#C5A059]/30 bg-[#C5A059]/10 text-[#C5A059] text-xs tracking-wider">
            {zodiac.element} · {zodiac.sign}
          </span>
          {lifePath && (
            <span className="px-3 py-1 rounded-full border border-[#C5A059]/30 bg-[#C5A059]/10 text-[#C5A059] text-xs tracking-wider">
              Path {lifePath}
            </span>
          )}
          {chineseZodiac && (
            <span className="px-3 py-1 rounded-full border border-[#C5A059]/30 bg-[#C5A059]/10 text-[#C5A059] text-xs tracking-wider">
              {chineseZodiac}
            </span>
          )}
          {natal && (
            <span className="px-3 py-1 rounded-full border border-[#C5A059]/20 bg-[#0B1A1A] text-[#FFFDD0]/50 text-[10px] tracking-wider w-full">
              {natal.formatted}
            </span>
          )}
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
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
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "birth_chart" && natal && (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-[#C5A059]/20 bg-[#0B1A1A] p-5">
            <p className="text-[#C5A059] text-[10px] tracking-[0.2em] uppercase mb-3">Natal Planets</p>
            {[
              { label: "☉ Sun",     value: `${natal.sun.sign} ${natal.sun.degree}° · House ${natal.sun.house}` },
              { label: "☽ Moon",    value: `${natal.moon.sign} ${natal.moon.degree}° · House ${natal.moon.house}` },
              { label: "☿ Mercury", value: `${natal.mercury.sign} ${natal.mercury.degree}° · House ${natal.mercury.house}` },
              { label: "♀ Venus",   value: `${natal.venus.sign} ${natal.venus.degree}° · House ${natal.venus.house}` },
              { label: "♂ Mars",    value: `${natal.mars.sign} ${natal.mars.degree}° · House ${natal.mars.house}` },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center py-2 border-b border-[#C5A059]/10 last:border-0">
                <span className="text-[#C5A059] text-sm">{label}</span>
                <span className="text-[#FFFDD0]/70 text-sm">{value}</span>
              </div>
            ))}
          </div>
          {numerology && (
            <div className="rounded-xl border border-[#C5A059]/20 bg-[#0B1A1A] p-5">
              <p className="text-[#C5A059] text-[10px] tracking-[0.2em] uppercase mb-3">Numerology</p>
              {[
                { label: "Life Path",   value: `${numerology.lifePath} · ${numerology.descriptions.lifePath}` },
                { label: "Expression",  value: `${numerology.expression} · ${numerology.descriptions.expression}` },
                { label: "Soul Urge",   value: `${numerology.soulUrge} · ${numerology.descriptions.soulUrge}` },
                { label: "Personality", value: `${numerology.personality} · ${numerology.descriptions.personality}` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-start py-2 border-b border-[#C5A059]/10 last:border-0 gap-4">
                  <span className="text-[#C5A059] text-sm shrink-0">{label}</span>
                  <span className="text-[#FFFDD0]/70 text-xs text-right">{value}</span>
                </div>
              ))}
            </div>
          )}
          <div className="rounded-xl border border-[#C5A059]/20 bg-[#0B1A1A] p-5">
            <p className="text-[#C5A059] text-[10px] tracking-[0.2em] uppercase mb-3">Daily Numbers</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <p className="text-[#FFFDD0]/40 text-[9px] tracking-wider uppercase mb-1">Universal Day</p>
                <p className="text-[#C5A059] text-3xl font-['Libre_Baskerville']">{universalDay}</p>
              </div>
              {personalDay && (
                <div className="text-center">
                  <p className="text-[#FFFDD0]/40 text-[9px] tracking-wider uppercase mb-1">Personal Day</p>
                  <p className="text-[#C5A059] text-3xl font-['Libre_Baskerville']">{personalDay}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab !== "birth_chart" && (
        <TodayReadingCard
          data={reading}
          isLoading={isLoading}
          error={error}
        />
      )}
    </ChamberLayout>
  );
}
