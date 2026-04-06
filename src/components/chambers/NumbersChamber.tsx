import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ChamberLayout } from "@/components/ChamberLayout";
import { useAuth } from "@/hooks/use-auth";
import { useCachedReading } from "@/hooks/use-cached-reading";
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
    return <p className="text-sm text-destructive">{error}</p>;
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
  const lifePathName = LIFE_PATH_NAMES[lifePath] || "The Seeker";
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
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{name.split(" ")[0].toUpperCase()}'S NUMEROLOGY</p>
          <p className="font-display text-lg font-bold text-foreground">
            Life Path {dob ? `${dob.getDate()}/${lifePath}` : lifePath} · {lifePathName}
          </p>
          {zodiac && (
            <p className="text-xs text-muted-foreground">{zodiac.symbol} {zodiac.sign} · {zodiac.element}</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full flex overflow-x-auto gap-1 bg-muted/20 border border-border rounded-xl p-1 mb-4 no-scrollbar">
          {[
            { value: "today", label: "Today", icon: Calendar },
            { value: "lifepath", label: "Life Path", icon: Hash },
            { value: "core", label: "Core", icon: Sparkles },
            { value: "name", label: "Name", icon: Hash },
            { value: "cycles", label: "Cycles", icon: Calendar },
            { value: "lucky", label: "Lucky", icon: Clover },
            { value: "compatibility", label: "Match", icon: Users },
          ].map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {tab.label}
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
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Universal Day</p>
                <p className="text-sm font-semibold text-foreground">{UNIVERSAL_DAY_MEANINGS[universalDay]}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{dateStr}</p>
              </div>
            </div>
          </SectionCard>

          {/* Personal Day */}
          <SectionCard>
            <div className="flex items-center gap-4">
              <NumberCircle value={personalDay} color="blue" size="sm" />
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Personal Day</p>
                <p className="text-sm font-semibold text-foreground">{PERSONAL_DAY_MEANINGS[personalDay]}</p>
              </div>
            </div>
            <AIReadingBlock content={todayReading.content} isLoading={todayReading.isLoading} error={todayReading.error} label="today's frequency" />
          </SectionCard>

          {/* Personal Month */}
          <SectionCard>
            <div className="flex items-center gap-4">
              <NumberCircle value={personalMonth} color="green" size="sm" />
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Personal Month</p>
                <p className="text-sm font-semibold text-foreground">{personalMonth} — {PERSONAL_MONTH_MEANINGS[personalMonth]}</p>
              </div>
            </div>
          </SectionCard>

          {/* Personal Year */}
          <SectionCard>
            <div className="flex items-center gap-4">
              <NumberCircle value={personalYear} color="rose" size="sm" />
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Personal Year {today.getFullYear()}</p>
                <p className="text-sm font-semibold text-foreground">{personalYear} — {PERSONAL_YEAR_MEANINGS[personalYear]}</p>
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
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Your Life Path</p>
                <p className="font-display text-xl font-bold text-foreground">{lifePath} · {lifePathName}</p>
              </div>
            </div>
            <AIReadingBlock content={lifePathReading.content} isLoading={lifePathReading.isLoading} error={lifePathReading.error} label="your life path" />
          </SectionCard>
        </TabsContent>

        {/* ── CORE ── */}
        <TabsContent value="core" className="space-y-4">
          {[
            { label: "Life Path", value: lifePath, desc: lifePathName, color: "gold" },
            { label: "Expression", value: expressionNum, desc: "Your outer talents & potential", color: "purple" },
            { label: "Soul Urge", value: soulUrgeNum, desc: "Your inner desires & motivations", color: "blue" },
            { label: "Personality", value: personalityNum, desc: "How the world sees you", color: "green" },
            { label: "Birthday", value: birthdayNum, desc: "Your special gift from birth", color: "copper" },
          ].map(item => (
            <SectionCard key={item.label}>
              <div className="flex items-center gap-4">
                <NumberCircle value={item.value} color={item.color} size="sm" />
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{item.label} Number</p>
                  <p className="text-sm font-semibold text-foreground">{item.value} — {item.desc}</p>
                </div>
              </div>
            </SectionCard>
          ))}
        </TabsContent>

        {/* ── NAME ── */}
        <TabsContent value="name" className="space-y-4">
          <SectionCard>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Full Name Analysis</p>
            <p className="font-display text-lg font-bold text-primary">{name}</p>
            <div className="grid grid-cols-3 gap-3 mt-3">
              {[
                { label: "Expression", value: expressionNum, color: "purple" },
                { label: "Soul Urge", value: soulUrgeNum, color: "blue" },
                { label: "Personality", value: personalityNum, color: "green" },
              ].map(item => (
                <div key={item.label} className="flex flex-col items-center gap-2">
                  <NumberCircle value={item.value} color={item.color} size="sm" />
                  <p className="text-xs text-muted-foreground text-center">{item.label}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Letter breakdown */}
          <SectionCard>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Letter Values</p>
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
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Pinnacle Cycles</p>
            <div className="space-y-3">
              {pinnacles.map(p => (
                <div key={p.label} className="flex items-center gap-3">
                  <NumberCircle value={p.value} color="gold" size="sm" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{p.label}</p>
                    <p className="text-xs text-muted-foreground">Ages {p.ages}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Challenge Cycles</p>
            <div className="space-y-3">
              {challenges.map(c => (
                <div key={c.label} className="flex items-center gap-3">
                  <NumberCircle value={c.value} color="rose" size="sm" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{c.label}</p>
                    <p className="text-xs text-muted-foreground">Number {c.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </TabsContent>

        {/* ── LUCKY ── */}
        <TabsContent value="lucky" className="space-y-4">
          <SectionCard>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Your Lucky Numbers</p>
            <div className="flex flex-wrap gap-3 justify-center">
              {luckyNums.map((n, i) => (
                <NumberCircle key={i} value={n} color={["gold", "purple", "blue", "green", "rose", "copper"][i]} size="sm" />
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-3">
              Derived from your Life Path, Expression, Soul Urge, Birthday, and power combinations.
            </p>
          </SectionCard>

          <SectionCard>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Today's Power Number</p>
            <div className="flex items-center gap-3">
              <NumberCircle value={reduceToSingle(personalDay + universalDay)} color="teal" size="sm" />
              <p className="text-sm text-muted-foreground">
                Your personal day ({personalDay}) + universal day ({universalDay}) = {reduceToSingle(personalDay + universalDay)}
              </p>
            </div>
          </SectionCard>
        </TabsContent>

        {/* ── COMPATIBILITY ── */}
        <TabsContent value="compatibility" className="space-y-4">
          <CompatibilityTab lifePath={lifePath} />
        </TabsContent>
      </Tabs>
    </ChamberLayout>
  );
}

/* ─── Compatibility Sub-Component ─── */

const COMPAT_MATRIX: Record<number, { best: number[]; good: number[]; challenge: number[] }> = {
  1: { best: [3, 5], good: [1, 7, 9], challenge: [4, 6, 8] },
  2: { best: [4, 8], good: [2, 6, 9], challenge: [1, 5, 7] },
  3: { best: [1, 5], good: [3, 6, 9], challenge: [4, 7, 8] },
  4: { best: [2, 8], good: [4, 6, 7], challenge: [1, 3, 5] },
  5: { best: [1, 3], good: [5, 7, 9], challenge: [2, 4, 6] },
  6: { best: [2, 9], good: [3, 4, 6], challenge: [1, 5, 7] },
  7: { best: [5, 7], good: [1, 4, 9], challenge: [2, 3, 6] },
  8: { best: [2, 4], good: [6, 8], challenge: [1, 3, 5, 7] },
  9: { best: [3, 6], good: [1, 2, 5, 9], challenge: [4, 7, 8] },
  11: { best: [2, 6], good: [4, 8, 9], challenge: [1, 5] },
  22: { best: [4, 8], good: [2, 6, 9], challenge: [1, 3, 5] },
  33: { best: [6, 9], good: [2, 3, 4], challenge: [1, 5, 7] },
};

function CompatibilityTab({ lifePath }: { lifePath: number }) {
  const compat = COMPAT_MATRIX[lifePath] || COMPAT_MATRIX[9];

  return (
    <>
      <SectionCard>
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Life Path {lifePath} Compatibility</p>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-green-400 mb-2">✦ Best Matches</p>
            <div className="flex gap-2">
              {compat.best.map(n => (
                <NumberCircle key={n} value={n} color="green" size="sm" />
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-primary mb-2">✦ Good Matches</p>
            <div className="flex gap-2 flex-wrap">
              {compat.good.map(n => (
                <NumberCircle key={n} value={n} color="blue" size="sm" />
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-rose-400 mb-2">✦ Growth Matches</p>
            <div className="flex gap-2 flex-wrap">
              {compat.challenge.map(n => (
                <NumberCircle key={n} value={n} color="rose" size="sm" />
              ))}
            </div>
          </div>
        </div>
      </SectionCard>
    </>
  );
}
