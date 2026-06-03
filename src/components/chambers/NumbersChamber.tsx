import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { ChamberLayout } from "@/components/ChamberLayout";
import { useAuth } from "@/hooks/use-auth";
import { useCachedReading } from "@/hooks/use-cached-reading";
import { WithInfo } from "@/components/ui/info-tooltip";
import {
  getZodiacFromDOB,
  getLifePath,
  getUniversalDay,
  getPersonalDay,
  reduceToSingle,
  getChineseZodiac,
  UNIVERSAL_DAY_MEANINGS,
  PERSONAL_DAY_MEANINGS,
  formatDate,
} from "@/lib/daily";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Hash, Sparkles, Heart, Briefcase, Calendar, Clover, Users, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

/* ─── helpers ─── */

const LIFE_PATH_NAMES: Record<number, string> = {
  1: "The Leader",
  2: "The Diplomat",
  3: "The Communicator",
  4: "The Builder",
  5: "The Freedom Seeker",
  6: "The Nurturer",
  7: "The Seeker",
  8: "The Powerhouse",
  9: "The Humanitarian",
  11: "The Master Intuitive",
  22: "The Master Builder",
  33: "The Master Teacher",
};

const CIRCLE_COLORS: Record<string, string> = {
  gold: "from-[hsl(43,90%,67%)] to-[hsl(45,100%,50%)]",
  purple: "from-[hsl(270,60%,55%)] to-[hsl(290,50%,45%)]",
  blue: "from-[hsl(220,60%,55%)] to-[hsl(200,70%,45%)]",
  green: "from-[hsl(150,60%,40%)] to-[hsl(170,50%,35%)]",
  rose: "from-[hsl(340,70%,55%)] to-[hsl(350,60%,45%)]",
  copper: "from-[hsl(25,50%,45%)] to-[hsl(20,60%,35%)]",
  teal: "from-[hsl(180,50%,40%)] to-[hsl(190,60%,35%)]",
};

function NumberCircle({ value, color = "gold", size = "lg" }: { value: number | string; color?: string; size?: "sm" | "lg" }) {
  const dim = size === "lg" ? "w-20 h-20 text-2xl" : "w-12 h-12 text-base";
  return (
    <div className={`${dim} rounded-full bg-gradient-to-br ${CIRCLE_COLORS[color] || CIRCLE_COLORS.gold} flex items-center justify-center font-display font-bold text-background shadow-lg`}>
      {value}
    </div>
  );
}

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`card-cosmic rounded-2xl p-5 space-y-3 ${className}`}>
      {children}
    </div>
  );
}

function AIReadingBlock({ content, isLoading, error, label }: { content: string | null; isLoading: boolean; error: string | null; label: string }) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm py-3">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Channeling {label}…</span>
      </div>
    );
  }
  if (error && !content) {
    return <p className="text-sm text-muted-foreground italic">Unable to load reading. Try again shortly.</p>;
  }
  if (!content) return null;

  // Try parsing as JSON in case the AI returned structured content
  try {
    const parsed = JSON.parse(content);
    return (
      <div className="space-y-2">
        {parsed.title && <p className="text-sm font-bold text-foreground">{parsed.title}</p>}
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{parsed.reading || parsed.content || content}</p>
        {parsed.cosmicAdvice && <p className="text-xs italic text-primary mt-2">"{parsed.cosmicAdvice}"</p>}
      </div>
    );
  } catch {
    return <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{content}</p>;
  }
}

/* ─── Name numerology ─── */

function letterValue(ch: string): number {
  const code = ch.toUpperCase().charCodeAt(0);
  if (code < 65 || code > 90) return 0;
  return ((code - 65) % 9) + 1;
}

function nameNumber(name: string): number {
  const sum = name.split("").reduce((s, c) => s + letterValue(c), 0);
  return reduceToSingle(sum);
}

const VOWELS = new Set(["A", "E", "I", "O", "U"]);

function soulUrge(name: string): number {
  const sum = name.split("").filter(c => VOWELS.has(c.toUpperCase())).reduce((s, c) => s + letterValue(c), 0);
  return reduceToSingle(sum);
}

function personality(name: string): number {
  const sum = name.split("").filter(c => !VOWELS.has(c.toUpperCase()) && /[a-zA-Z]/.test(c)).reduce((s, c) => s + letterValue(c), 0);
  return reduceToSingle(sum);
}

/* ─── Pinnacle / Challenge cycles ─── */

function getPinnacles(dob: Date) {
  const d = reduceToSingle(dob.getDate());
  const m = reduceToSingle(dob.getMonth() + 1);
  const y = reduceToSingle(String(dob.getFullYear()).split("").reduce((s, x) => s + parseInt(x), 0));
  const lp = getLifePath(dob);
  const firstEnd = 36 - lp;

  return [
    { label: "1st Pinnacle", value: reduceToSingle(m + d), ages: `Birth – ${firstEnd}` },
    { label: "2nd Pinnacle", value: reduceToSingle(d + y), ages: `${firstEnd + 1} – ${firstEnd + 9}` },
    { label: "3rd Pinnacle", value: reduceToSingle(reduceToSingle(m + d) + reduceToSingle(d + y)), ages: `${firstEnd + 10} – ${firstEnd + 18}` },
    { label: "4th Pinnacle", value: reduceToSingle(m + y), ages: `${firstEnd + 19}+` },
  ];
}

function getChallenges(dob: Date) {
  const d = reduceToSingle(dob.getDate());
  const m = reduceToSingle(dob.getMonth() + 1);
  const y = reduceToSingle(String(dob.getFullYear()).split("").reduce((s, x) => s + parseInt(x), 0));
  return [
    { label: "1st Challenge", value: Math.abs(m - d) },
    { label: "2nd Challenge", value: Math.abs(d - y) },
    { label: "3rd Challenge", value: Math.abs(Math.abs(m - d) - Math.abs(d - y)) },
    { label: "4th Challenge", value: Math.abs(m - y) },
  ];
}

/* ─── Lucky numbers ─── */

function getLuckyNumbers(dob: Date, name: string) {
  const lp = getLifePath(dob);
  const expr = nameNumber(name);
  const su = soulUrge(name);
  const bday = reduceToSingle(dob.getDate());
  const combo = reduceToSingle(lp + expr);
  const power = reduceToSingle(lp + su + expr);
  return [lp, expr, su, bday, combo, power];
}

/* ─── Main Component ─── */

export function NumbersChamber({ onBack }: { onBack: () => void }) {
  const { t, i18n } = useTranslation();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("today");

  const dob = useMemo(() => profile?.dateOfBirth ? new Date(profile.dateOfBirth + "T12:00:00") : null, [profile?.dateOfBirth]);
  const today = useMemo(() => new Date(), []);
  const name = profile?.fullName || "Seeker";

  // Calculations
  const lifePath = dob ? getLifePath(dob) : 9;
  const lifePathName = t(`numbers.lifePathNames.${lifePath}`, LIFE_PATH_NAMES[lifePath] || "The Seeker");
  const universalDay = getUniversalDay(today);
  const personalDay = dob ? getPersonalDay(dob, today) : 1;
  const zodiac = dob ? getZodiacFromDOB(dob) : null;
  const chineseZodiac = dob ? getChineseZodiac(dob.getFullYear()) : null;

  // Personal month & year
  const personalYear = dob ? reduceToSingle((dob.getMonth() + 1) + dob.getDate() + today.getFullYear()) : 1;
  const personalMonth = reduceToSingle(personalYear + (today.getMonth() + 1));

  // Name numbers
  const expressionNum = nameNumber(name);
  const soulUrgeNum = soulUrge(name);
  const personalityNum = personality(name);
  const birthdayNum = dob ? reduceToSingle(dob.getDate()) : 1;

  // Cycles
  const pinnacles = dob ? getPinnacles(dob) : [];
  const challenges = dob ? getChallenges(dob) : [];

  // Lucky
  const luckyNums = dob ? getLuckyNumbers(dob, name) : [1, 2, 3, 4, 5, 6];

  const dateStr = formatDate(today, i18n.language);

  // Personal Month meanings
  const PERSONAL_MONTH_MEANINGS: Record<number, string> = {
    1: "New Beginnings", 2: "Partnership", 3: "Expression", 4: "Foundation",
    5: "Change", 6: "Responsibility", 7: "Reflection", 8: "Achievement",
    9: "Completion", 11: "Master Vision", 22: "Master Architect", 33: "Master Healer",
  };

  const PERSONAL_YEAR_MEANINGS: Record<number, string> = {
    1: "Fresh Start", 2: "Patience & Cooperation", 3: "Creative Expansion", 4: "Hard Work & Structure",
    5: "Freedom & Adventure", 6: "Love & Duty", 7: "Spiritual Growth", 8: "Power & Prosperity",
    9: "Endings & Wisdom", 11: "Master Intuition", 22: "Master Building", 33: "Master Teaching",
  };

  // Cache key for AI readings
  const todayCacheKey = `${profile?.dateOfBirth || "guest"}-${today.toISOString().slice(0, 10)}`;
  const readingContext = {
    name,
    lifePath,
    lifePathName,
    universalDay,
    personalDay,
    personalMonth,
    personalYear,
    zodiacSign: zodiac?.sign || "Unknown",
    element: zodiac?.element || "Unknown",
    chineseZodiac: chineseZodiac || "Unknown",
    date: dateStr,
    birthPlace: profile?.birthPlace || "Unknown",
    birthTime: profile?.birthTime || "Unknown",
    language: i18n.language,
  };

  // AI readings for Today tab
  const todayReading = useCachedReading({
    readingType: "numbers_today",
    cacheKey: todayCacheKey,
    context: readingContext,
    enabled: activeTab === "today",
  });

  // AI reading for Life Path tab
  const lifePathReading = useCachedReading({
    readingType: "numbers_life_path",
    cacheKey: `${profile?.dateOfBirth || "guest"}-lp${lifePath}`,
    context: { ...readingContext, expressionNum, soulUrgeNum, personalityNum },
    enabled: activeTab === "lifepath",
  });

  return (
    <ChamberLayout title={t("chamberPages.numbers.title")} onBack={onBack}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-5">
        <NumberCircle value={lifePath} color="gold" />
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{t("numbers.yourNumerology", { name: name.split(" ")[0].toUpperCase() })}</p>
          <p className="font-display text-lg font-bold text-foreground">
            {t("numbers.lifePathLabel")} {lifePath} · {lifePathName}
          </p>
          {zodiac && (
            <p className="text-xs text-muted-foreground">{zodiac.sign} · {t(`elements.${zodiac.element}`, zodiac.element)}</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full flex overflow-x-auto gap-1 bg-muted/20 border border-border rounded-xl p-1 mb-4 no-scrollbar">
          {[
            { value: "today",         labelKey: "numbers.tabs.today" },
            { value: "lifepath",      labelKey: "numbers.tabs.lifePath" },
            { value: "core",          labelKey: "numbers.tabs.core" },
            { value: "name",          labelKey: "numbers.tabs.name" },
            { value: "cycles",        labelKey: "numbers.tabs.cycles" },
            { value: "lucky",         labelKey: "numbers.tabs.lucky" },
            { value: "compatibility", labelKey: "numbers.tabs.match" },
          ].map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {t(tab.labelKey)}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── TODAY ── */}
        <TabsContent value="today" className="space-y-4">
          {/* Universal Day */}
          <SectionCard>
            <div className="flex items-center gap-4">
              <NumberCircle value={universalDay} color="purple" size="sm" />
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("numbers.universalDay")}</p>
                <p className="text-sm font-semibold text-foreground">{t(`universalDayMeanings.${universalDay}`, UNIVERSAL_DAY_MEANINGS[universalDay])}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{dateStr}</p>
              </div>
            </div>
          </SectionCard>

          {/* Personal Day */}
          <SectionCard>
            <div className="flex items-center gap-4">
              <NumberCircle value={personalDay} color="blue" size="sm" />
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wider text-muted-foreground"><WithInfo term="personalYear">{t("numbers.personalDay")}</WithInfo></p>
                <p className="text-sm font-semibold text-foreground">{t(`personalDayMeanings.${personalDay}`, PERSONAL_DAY_MEANINGS[personalDay])}</p>
              </div>
            </div>
            <AIReadingBlock content={todayReading.content} isLoading={todayReading.isLoading} error={todayReading.error} label="today's frequency" />
          </SectionCard>

          {/* Personal Month */}
          <SectionCard>
            <div className="flex items-center gap-4">
              <NumberCircle value={personalMonth} color="green" size="sm" />
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("numbers.personalMonth")}</p>
                <p className="text-sm font-semibold text-foreground">{personalMonth} — {t(`personalMonthMeanings.${personalMonth}`, PERSONAL_MONTH_MEANINGS[personalMonth])}</p>
              </div>
            </div>
          </SectionCard>

          {/* Personal Year */}
          <SectionCard>
            <div className="flex items-center gap-4">
              <NumberCircle value={personalYear} color="rose" size="sm" />
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("numbers.personalYear", { year: today.getFullYear() })}</p>
                <p className="text-sm font-semibold text-foreground">{personalYear} — {t(`personalYearMeanings.${personalYear}`, PERSONAL_YEAR_MEANINGS[personalYear])}</p>
              </div>
            </div>
          </SectionCard>
        </TabsContent>

        {/* ── LIFE PATH ── */}
        <TabsContent value="lifepath" className="space-y-4">
          <SectionCard>
            <div className="flex items-center gap-4">
              <NumberCircle value={lifePath} color="gold" />
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground"><WithInfo term="lifePath">{t("numbers.yourLifePath")}</WithInfo></p>
                <p className="font-display text-xl font-bold text-foreground">{lifePath} · {lifePathName}</p>
              </div>
            </div>
            <AIReadingBlock content={lifePathReading.content} isLoading={lifePathReading.isLoading} error={lifePathReading.error} label="your life path" />
          </SectionCard>
        </TabsContent>

        {/* ── CORE ── */}
        <TabsContent value="core" className="space-y-4">
          {[
            { labelKey: "numbers.lifePathLabel",    value: lifePath,      desc: lifePathName,                              color: "gold" },
            { labelKey: "numbers.expressionLabel",  value: expressionNum, desc: t("numbers.expressionDesc"),               color: "purple" },
            { labelKey: "numbers.soulUrgeLabel",    value: soulUrgeNum,   desc: t("numbers.soulUrgeDesc"),                 color: "blue" },
            { labelKey: "numbers.personalityLabel", value: personalityNum,desc: t("numbers.personalityDesc"),              color: "green" },
            { labelKey: "numbers.birthdayLabel",    value: birthdayNum,   desc: t("numbers.birthdayDesc"),                 color: "copper" },
          ].map(item => (
            <SectionCard key={item.labelKey}>
              <div className="flex items-center gap-4">
                <NumberCircle value={item.value} color={item.color} size="sm" />
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{t(item.labelKey)} {t("numbers.numberSuffix")}</p>
                  <p className="text-sm font-semibold text-foreground">{item.value} — {item.desc}</p>
                </div>
              </div>
            </SectionCard>
          ))}
        </TabsContent>

        {/* ── NAME ── */}
        <TabsContent value="name" className="space-y-4">
          <SectionCard>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("numbers.fullNameAnalysis")}</p>
            <p className="font-display text-lg font-bold text-primary">{name}</p>
            <div className="grid grid-cols-3 gap-3 mt-3">
              {[
                { labelKey: "numbers.expressionLabel",  value: expressionNum,  color: "purple" },
                { labelKey: "numbers.soulUrgeLabel",    value: soulUrgeNum,    color: "blue" },
                { labelKey: "numbers.personalityLabel", value: personalityNum, color: "green" },
              ].map(item => (
                <div key={item.labelKey} className="flex flex-col items-center gap-2">
                  <NumberCircle value={item.value} color={item.color} size="sm" />
                  <p className="text-xs text-muted-foreground text-center">{t(item.labelKey)}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Letter breakdown */}
          <SectionCard>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{t("numbers.letterValues")}</p>
            <div className="flex flex-wrap gap-2">
              {name.split("").map((ch, i) => {
                const val = letterValue(ch);
                if (!val) return <span key={i} className="w-4" />;
                return (
                  <div key={i} className="flex flex-col items-center">
                    <span className="text-sm font-bold text-foreground">{ch.toUpperCase()}</span>
                    <span className="text-xs text-primary">{val}</span>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </TabsContent>

        {/* ── CYCLES ── */}
        <TabsContent value="cycles" className="space-y-4">
          <SectionCard>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">{t("numbers.pinnacleCycles")}</p>
            <div className="space-y-3">
              {pinnacles.map(p => (
                <div key={p.label} className="flex items-center gap-3">
                  <NumberCircle value={p.value} color="gold" size="sm" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{p.label}</p>
                    <p className="text-xs text-muted-foreground">{t("numbers.ages")} {p.ages}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">{t("numbers.challengeCycles")}</p>
            <div className="space-y-3">
              {challenges.map(c => (
                <div key={c.label} className="flex items-center gap-3">
                  <NumberCircle value={c.value} color="rose" size="sm" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{c.label}</p>
                    <p className="text-xs text-muted-foreground">{t("numbers.challengeNumber")} {c.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </TabsContent>

        {/* ── LUCKY ── */}
        <TabsContent value="lucky" className="space-y-4">
          <SectionCard>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">{t("numbers.yourLuckyNumbers")}</p>
            <div className="flex flex-wrap gap-3 justify-center">
              {luckyNums.map((n, i) => (
                <NumberCircle key={i} value={n} color={["gold", "purple", "blue", "green", "rose", "copper"][i]} size="sm" />
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-3">
              {t("numbers.luckyDerived")}
            </p>
          </SectionCard>

          <SectionCard>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{t("numbers.todaysPowerNumber")}</p>
            <div className="flex items-center gap-3">
              <NumberCircle value={reduceToSingle(personalDay + universalDay)} color="teal" size="sm" />
              <p className="text-sm text-muted-foreground">
                {t("numbers.powerFormula", { personal: personalDay, universal: universalDay, result: reduceToSingle(personalDay + universalDay) })}
              </p>
            </div>
          </SectionCard>
        </TabsContent>

        {/* ── COMPATIBILITY ── */}
        <TabsContent value="compatibility" className="space-y-4">
          <CompatibilityTab
            userName={name}
            userLifePath={lifePath}
            userZodiac={zodiac?.sign ?? null}
            userElement={zodiac?.element ?? null}
            userChineseZodiac={chineseZodiac}
            userExpression={expressionNum}
            userSoulUrge={soulUrgeNum}
            language={i18n.language}
          />
        </TabsContent>
      </Tabs>
    </ChamberLayout>
  );
}

/* ─── Compatibility Sub-Component ─── */

interface CompatibilityProps {
  userName: string;
  userLifePath: number;
  userZodiac: string | null;
  userElement: string | null;
  userChineseZodiac: string | null;
  userExpression: number;
  userSoulUrge: number;
  language: string;
}

function CompatibilityTab({ userName, userLifePath, userZodiac, userElement, userChineseZodiac, userExpression, userSoulUrge, language }: CompatibilityProps) {
  const { t, i18n } = useTranslation();
  const [otherName, setOtherName]   = useState("");
  const [otherMonth, setOtherMonth] = useState("");
  const [otherDay, setOtherDay]     = useState("");
  const [otherYear, setOtherYear]   = useState("");
  const [reading, setReading]       = useState<string | null>(null);
  const [isLoading, setIsLoading]   = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const otherDOB = otherYear && otherMonth && otherDay
    ? new Date(`${otherYear}-${otherMonth}-${otherDay}T12:00:00`)
    : null;

  const otherLifePath     = otherDOB ? getLifePath(otherDOB) : null;
  const otherZodiac       = otherDOB ? getZodiacFromDOB(otherDOB) : null;
  const otherChineseZodiac = otherDOB ? getChineseZodiac(otherDOB.getFullYear()) : null;

  const handleCheck = async () => {
    if (!otherDOB || isLoading) return;
    setIsLoading(true);
    setError(null);
    setReading(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("generate-reading", {
        body: {
          readingType: "compatibility",
          language,
          context: {
            language,
            name: userName,
            lifePath: userLifePath,
            zodiacSign: userZodiac,
            element: userElement,
            chineseZodiac: userChineseZodiac,
            expression: userExpression,
            soulUrge: userSoulUrge,
            otherName: otherName.trim() || t("numbers.thePerson"),
            otherLifePath,
            otherZodiac: otherZodiac?.sign,
            otherElement: otherZodiac?.element,
            otherChineseZodiac,
          },
        },
      });
      if (fnError) throw new Error(fnError.message);
      const content = data?.reading ?? data?.content ?? (typeof data === "string" ? data : null);
      if (!content) throw new Error("No reading returned");
      setReading(content);
    } catch (err: any) {
      setError(err.message || "Failed");
    } finally {
      setIsLoading(false);
    }
  };

  const months = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      value: String(i + 1).padStart(2, "0"),
      label: new Intl.DateTimeFormat(i18n.language, { month: "long" }).format(new Date(2000, i, 1)),
    })), [i18n.language]);

  const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1919 }, (_, i) => String(currentYear - i));

  const sel = "bg-muted/30 border border-input rounded-md px-2 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none w-full";

  return (
    <SectionCard>
      <div className="space-y-4">

        {/* Header */}
        <div className="text-center space-y-1">
          <p className="font-display text-base font-bold text-foreground">{t("numbers.compatTitle")}</p>
          <p className="text-xs text-muted-foreground">{t("numbers.compatSubtitle")}</p>
        </div>

        {/* Their name */}
        <input
          type="text"
          value={otherName}
          onChange={e => setOtherName(e.target.value)}
          placeholder={t("numbers.compatNamePlaceholder")}
          className="w-full bg-muted/30 border border-input rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
        />

        {/* Their birth date */}
        <div className="grid grid-cols-3 gap-2">
          <select value={otherMonth} onChange={e => setOtherMonth(e.target.value)} className={sel}>
            <option value="" disabled>MM</option>
            {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <select value={otherDay} onChange={e => setOtherDay(e.target.value)} className={sel}>
            <option value="" disabled>DD</option>
            {days.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={otherYear} onChange={e => setOtherYear(e.target.value)} className={sel}>
            <option value="" disabled>YYYY</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Computed badges */}
        {otherLifePath && (
          <div className="flex gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-full text-[11px] border border-primary/30 bg-primary/10 text-primary">
              {t("numbers.lifePathLabel")} {otherLifePath}
            </span>
            {otherZodiac && (
              <span className="px-2.5 py-1 rounded-full text-[11px] border border-primary/30 bg-primary/10 text-primary">
                {otherZodiac.sign}
              </span>
            )}
            {otherChineseZodiac && (
              <span className="px-2.5 py-1 rounded-full text-[11px] border border-primary/30 bg-primary/10 text-primary">
                {t(`chineseAnimals.${otherChineseZodiac}`, otherChineseZodiac)}
              </span>
            )}
          </div>
        )}

        {/* Button */}
        <button
          onClick={handleCheck}
          disabled={!otherDOB || isLoading}
          className="w-full py-3 rounded-xl bg-primary/20 border border-primary/40 text-primary text-sm font-semibold disabled:opacity-40 hover:bg-primary/30 transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> {t("numbers.compatReading")}</>
          ) : (
            t("numbers.compatButton")
          )}
        </button>

        {/* Error */}
        {error && !isLoading && (
          <p className="text-sm text-muted-foreground italic text-center">{t("numbers.compatError")}</p>
        )}

        {/* Reading */}
        {reading && (
          <div className="pt-3 border-t border-primary/15 space-y-3">
            <p className="text-[10px] text-primary uppercase tracking-[0.2em] font-bold">
              {userName.split(" ")[0]} × {otherName.trim() || t("numbers.thePerson")}
            </p>
            <p className="text-sm text-foreground/85 leading-relaxed">{reading}</p>
          </div>
        )}

      </div>
    </SectionCard>
  );
}
