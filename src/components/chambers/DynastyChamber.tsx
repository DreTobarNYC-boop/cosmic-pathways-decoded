import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ChamberLayout } from "@/components/ChamberLayout";
import { useAuth } from "@/hooks/use-auth";
import { useCachedReading } from "@/hooks/use-cached-reading";
import { getChineseZodiac, getZodiacFromDOB, getLifePath } from "@/lib/daily";
import { Loader2, ChevronDown, Star } from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

/* ─── Chinese Characters & Data ─── */

const ANIMAL_CHARS: Record<string, string> = {
  Rat: "子", Ox: "丑", Tiger: "寅", Rabbit: "卯", Dragon: "辰", Snake: "巳",
  Horse: "午", Goat: "未", Monkey: "申", Rooster: "酉", Dog: "戌", Pig: "亥",
};

const ANIMAL_DATA: Record<string, {
  emoji: string; element: string; yin_yang: string; season: string;
  traits: string[]; strengths: string[]; watchFor: string[];
  colors: string[]; numbers: number[]; directions: string[];
}> = {
  Rat:     { emoji: "🐀", element: "Water", yin_yang: "Yang", season: "Winter", traits: ["Clever", "Quick-witted", "Resourceful", "Adaptable"], strengths: ["Strategic thinking", "Social intelligence", "Resourcefulness"], watchFor: ["Overthinking", "Hoarding tendencies", "Restlessness"], colors: ["Blue", "Gold", "Green"], numbers: [2, 3], directions: ["West", "Northwest"] },
  Ox:      { emoji: "🐂", element: "Earth", yin_yang: "Yin",  season: "Winter", traits: ["Diligent", "Dependable", "Strong", "Determined"], strengths: ["Steadfast loyalty", "Work ethic", "Patience"], watchFor: ["Stubbornness", "Rigidity", "Isolation"], colors: ["Yellow", "Green", "White"], numbers: [1, 4], directions: ["Southeast", "South"] },
  Tiger:   { emoji: "🐅", element: "Wood",  yin_yang: "Yang", season: "Spring", traits: ["Brave", "Competitive", "Confident", "Unpredictable"], strengths: ["Natural leadership", "Courage", "Passion"], watchFor: ["Impulsiveness", "Recklessness", "Authority conflicts"], colors: ["Orange", "Blue", "Gray"], numbers: [1, 3, 4], directions: ["South", "East"] },
  Rabbit:  { emoji: "🐇", element: "Wood",  yin_yang: "Yin",  season: "Spring", traits: ["Quiet", "Elegant", "Kind", "Patient"], strengths: ["Diplomacy", "Artistic sense", "Empathy"], watchFor: ["Indecisiveness", "Over-caution", "People-pleasing"], colors: ["Pink", "Red", "Purple"], numbers: [3, 4, 6], directions: ["East", "South"] },
  Dragon:  { emoji: "🐉", element: "Earth", yin_yang: "Yang", season: "Spring", traits: ["Ambitious", "Energetic", "Charismatic", "Fearless"], strengths: ["Visionary thinking", "Magnetism", "Resilience"], watchFor: ["Arrogance", "Perfectionism", "Burnout"], colors: ["Gold", "Silver", "Gray"], numbers: [1, 6, 7], directions: ["East", "North"] },
  Snake:   { emoji: "🐍", element: "Fire",  yin_yang: "Yin",  season: "Summer", traits: ["Enigmatic", "Intelligent", "Wise", "Graceful"], strengths: ["Deep intuition", "Strategic mind", "Elegance"], watchFor: ["Jealousy", "Secretiveness", "Distrust"], colors: ["Red", "Black", "Yellow"], numbers: [2, 8, 9], directions: ["South", "Southwest"] },
  Horse:   { emoji: "🐎", element: "Fire",  yin_yang: "Yang", season: "Summer", traits: ["Animated", "Active", "Energetic", "Free-spirited"], strengths: ["Independence", "Enthusiasm", "Physical vitality"], watchFor: ["Impatience", "Commitment issues", "Restlessness"], colors: ["Yellow", "Green", "Brown"], numbers: [2, 3, 7], directions: ["South", "Southwest"] },
  Goat:    { emoji: "🐐", element: "Earth", yin_yang: "Yin",  season: "Summer", traits: ["Calm", "Gentle", "Creative", "Sympathetic"], strengths: ["Artistic gifts", "Compassion", "Peacemaking"], watchFor: ["Anxiety", "Dependency", "Escapism"], colors: ["Green", "Red", "Purple"], numbers: [2, 7], directions: ["South", "North"] },
  Monkey:  { emoji: "🐒", element: "Metal", yin_yang: "Yang", season: "Autumn", traits: ["Sharp", "Smart", "Curious", "Playful"], strengths: ["Problem-solving", "Adaptability", "Innovation"], watchFor: ["Manipulation", "Scattered focus", "Arrogance"], colors: ["White", "Gold", "Blue"], numbers: [4, 9], directions: ["West", "Northwest"] },
  Rooster: { emoji: "🐓", element: "Metal", yin_yang: "Yin",  season: "Autumn", traits: ["Observant", "Hardworking", "Courageous", "Honest"], strengths: ["Attention to detail", "Integrity", "Confidence"], watchFor: ["Criticism", "Vanity", "Perfectionism"], colors: ["Gold", "Yellow", "Brown"], numbers: [5, 7, 8], directions: ["West", "Southwest"] },
  Dog:     { emoji: "🐕", element: "Earth", yin_yang: "Yang", season: "Autumn", traits: ["Loyal", "Honest", "Prudent", "Kind"], strengths: ["Unwavering loyalty", "Moral compass", "Reliability"], watchFor: ["Anxiety", "Pessimism", "Over-guarding"], colors: ["Green", "Red", "Purple"], numbers: [3, 4, 9], directions: ["East", "South"] },
  Pig:     { emoji: "🐖", element: "Water", yin_yang: "Yin",  season: "Autumn", traits: ["Compassionate", "Generous", "Diligent", "Sociable"], strengths: ["Generosity", "Optimism", "Endurance"], watchFor: ["Naivety", "Overindulgence", "Gullibility"], colors: ["Yellow", "Gray", "Gold"], numbers: [2, 5, 8], directions: ["East", "Southwest"] },
};

const FIVE_ELEMENTS = ["Metal", "Water", "Wood", "Fire", "Earth"] as const;

function getHeavenlyStemElement(year: number): string {
  const stemIndex = (year - 4) % 10;
  return FIVE_ELEMENTS[Math.floor(stemIndex / 2)];
}

const COMPAT: Record<string, { best: string[]; tension: string[] }> = {
  Rat: { best: ["Dragon", "Monkey", "Ox"], tension: ["Horse", "Rooster"] },
  Ox: { best: ["Rat", "Snake", "Rooster"], tension: ["Goat", "Horse"] },
  Tiger: { best: ["Horse", "Dog", "Pig"], tension: ["Monkey", "Snake"] },
  Rabbit: { best: ["Goat", "Pig", "Dog"], tension: ["Rooster", "Dragon"] },
  Dragon: { best: ["Rat", "Monkey", "Rooster"], tension: ["Dog", "Rabbit"] },
  Snake: { best: ["Ox", "Rooster", "Dragon"], tension: ["Pig", "Tiger"] },
  Horse: { best: ["Tiger", "Goat", "Dog"], tension: ["Rat", "Ox"] },
  Goat: { best: ["Rabbit", "Horse", "Pig"], tension: ["Ox", "Dog"] },
  Monkey: { best: ["Rat", "Dragon", "Snake"], tension: ["Tiger", "Pig"] },
  Rooster: { best: ["Ox", "Snake", "Dragon"], tension: ["Rabbit", "Rat"] },
  Dog: { best: ["Tiger", "Rabbit", "Horse"], tension: ["Dragon", "Goat"] },
  Pig: { best: ["Tiger", "Rabbit", "Goat"], tension: ["Snake", "Monkey"] },
};

const ALL_ANIMALS = ["Rat", "Ox", "Tiger", "Rabbit", "Dragon", "Snake", "Horse", "Goat", "Monkey", "Rooster", "Dog", "Pig"];

/* ─── Sub Components ─── */

function AIBlock({ content, isLoading, label }: { content: string | null; isLoading: boolean; label: string }) {
  if (isLoading) return (
    <div className="flex items-center gap-2 text-muted-foreground text-sm py-3">
      <Loader2 className="w-4 h-4 animate-spin" /><span>Channeling {label}…</span>
    </div>
  );
  if (!content) return null;
  try {
    const p = JSON.parse(content);
    return <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{p.reading || p.content || content}</p>;
  } catch {
    return <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{content}</p>;
  }
}

function Badge({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-1.5 rounded-xl bg-muted/30 border border-border text-center">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="text-xs font-semibold text-foreground">{value}</p>
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`w-3.5 h-3.5 ${i <= rating ? "text-primary fill-primary" : "text-muted-foreground/30"}`} />
      ))}
    </div>
  );
}

/* ─── Main Component ─── */

export function DynastyChamber({ onBack }: { onBack: () => void }) {
  const { i18n } = useTranslation();
  const { profile } = useAuth();
  const [selectedAnimal, setSelectedAnimal] = useState<string | null>(null);

  const dob = useMemo(() => profile?.dateOfBirth ? new Date(profile.dateOfBirth + "T12:00:00") : null, [profile?.dateOfBirth]);
  const name = profile?.fullName || "Seeker";
  const year = dob?.getFullYear() || new Date().getFullYear();
  const animal = getChineseZodiac(year);
  const data = ANIMAL_DATA[animal] || ANIMAL_DATA.Rat;
  const yearElement = getHeavenlyStemElement(year);
  const zodiac = dob ? getZodiacFromDOB(dob) : null;
  const lifePath = dob ? getLifePath(dob) : null;
  const char = ANIMAL_CHARS[animal] || "子";
  const compat = COMPAT[animal] || { best: [], tension: [] };
  const currentYear = new Date().getFullYear();

  // AI readings
  const profileReading = useCachedReading({
    readingType: "dynasty_profile",
    cacheKey: `${animal}-${yearElement}-${i18n.language}`,
    context: { name, animal, yearElement, fixedElement: data.element, yinYang: data.yin_yang, traits: data.traits, zodiacSign: zodiac?.sign, lifePath, language: i18n.language },
  });

  const yearReading = useCachedReading({
    readingType: "dynasty_year",
    cacheKey: `${animal}-${currentYear}-${i18n.language}`,
    context: { name, animal, yearElement, currentYear, language: i18n.language },
  });

  const forecastReading = useCachedReading({
    readingType: "dynasty_forecast",
    cacheKey: `${animal}-${currentYear}-5yr-${i18n.language}`,
    context: { name, animal, yearElement, startYear: currentYear, language: i18n.language },
  });

  // Parse 5-year forecast
  const forecast = useMemo(() => {
    if (!forecastReading.content) return null;
    try {
      return JSON.parse(forecastReading.content);
    } catch {
      return null;
    }
  }, [forecastReading.content]);

  // Compatibility detail for selected animal
  const compatType = selectedAnimal
    ? compat.best.includes(selectedAnimal) ? "ally" : compat.tension.includes(selectedAnimal) ? "tension" : "neutral"
    : null;

  return (
    <ChamberLayout title="The Dynasty" subtitle="Chinese Zodiac" onBack={onBack}>
      <div className="space-y-6">

        {/* ─── HEADER ─── */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-primary/40 flex items-center justify-center shadow-lg shadow-primary/10">
            <span className="text-5xl font-display text-primary" style={{ fontFamily: "serif" }}>{char}</span>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">{name.split(" ")[0]}'s Dynasty</p>
            <h2 className="font-display text-2xl font-bold text-foreground">{yearElement} {animal}</h2>
            <p className="text-sm text-muted-foreground mt-1">{data.emoji} Born {year}</p>
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            <Badge label="Element" value={data.element} />
            <Badge label="Energy" value={data.yin_yang} />
            <Badge label="Season" value={data.season} />
          </div>
        </div>

        {/* ─── TRAITS ─── */}
        <div className="card-cosmic rounded-2xl p-5 space-y-3">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Core Traits</p>
          <div className="flex flex-wrap gap-2">
            {data.traits.map(t => (
              <span key={t} className="px-3 py-1 rounded-full text-xs border border-primary/30 text-primary/90 bg-primary/5">{t}</span>
            ))}
          </div>
          <AIBlock content={profileReading.content} isLoading={profileReading.isLoading} label="your dynasty profile" />
        </div>

        {/* ─── STRENGTHS & WATCH FOR ─── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card-cosmic rounded-2xl p-4 space-y-2">
            <p className="text-xs uppercase tracking-wider text-primary/80">✦ Strengths</p>
            {data.strengths.map(s => (
              <p key={s} className="text-xs text-muted-foreground">• {s}</p>
            ))}
          </div>
          <div className="card-cosmic rounded-2xl p-4 space-y-2">
            <p className="text-xs uppercase tracking-wider text-destructive/80">⚠ Watch For</p>
            {data.watchFor.map(w => (
              <p key={w} className="text-xs text-muted-foreground">• {w}</p>
            ))}
          </div>
        </div>

        {/* ─── YEAR ENERGY REPORT ─── */}
        <div className="card-cosmic rounded-2xl p-5 space-y-3">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{currentYear} Year Energy Report</p>
          <AIBlock content={yearReading.content} isLoading={yearReading.isLoading} label={`${currentYear} forecast`} />
        </div>

        {/* ─── LUCKY ATTRIBUTES ─── */}
        <div className="card-cosmic rounded-2xl p-5 space-y-3">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Lucky Attributes</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-muted/20 rounded-xl p-3 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Numbers</p>
              <p className="font-display text-sm font-bold text-foreground">{data.numbers.join(", ")}</p>
            </div>
            <div className="bg-muted/20 rounded-xl p-3 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Directions</p>
              <p className="font-display text-sm font-bold text-foreground">{data.directions.join(", ")}</p>
            </div>
            <div className="bg-muted/20 rounded-xl p-3 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Colors</p>
              <div className="flex gap-1.5 justify-center mt-1">
                {data.colors.map(c => (
                  <div key={c} className="w-5 h-5 rounded-full border border-border" style={{ backgroundColor: c.toLowerCase() }} title={c} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ─── COMPATIBILITY CHECK ─── */}
        <div className="card-cosmic rounded-2xl p-5 space-y-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Compatibility Check</p>
          <div className="flex flex-wrap gap-2">
            {ALL_ANIMALS.map(a => {
              const isMe = a === animal;
              const isAlly = compat.best.includes(a);
              const isTension = compat.tension.includes(a);
              const isSelected = selectedAnimal === a;
              let pillClass = "bg-muted/20 text-muted-foreground border-border";
              if (isMe) pillClass = "bg-primary/20 text-primary border-primary/40";
              else if (isAlly) pillClass = "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
              else if (isTension) pillClass = "bg-destructive/15 text-destructive border-destructive/30";
              if (isSelected) pillClass += " ring-2 ring-primary/60";

              return (
                <button
                  key={a}
                  onClick={() => setSelectedAnimal(isSelected ? null : a)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${pillClass}`}
                >
                  <span>{ANIMAL_DATA[a]?.emoji}</span>
                  <span>{a}</span>
                </button>
              );
            })}
          </div>
          <div className="flex gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500/50" /> Ally</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive/50" /> Tension</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-muted-foreground/30" /> Neutral</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary/50" /> You</span>
          </div>

          {selectedAnimal && selectedAnimal !== animal && (
            <div className="bg-muted/10 rounded-xl p-4 border border-border space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">{ANIMAL_DATA[selectedAnimal]?.emoji} {animal} × {selectedAnimal}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  compatType === "ally" ? "bg-emerald-500/15 text-emerald-400" :
                  compatType === "tension" ? "bg-destructive/15 text-destructive" :
                  "bg-muted/30 text-muted-foreground"
                }`}>
                  {compatType === "ally" ? "Strong Alliance" : compatType === "tension" ? "Challenging" : "Neutral"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {compatType === "ally"
                  ? `The ${animal} and ${selectedAnimal} share a natural harmony. Together they amplify each other's strengths and create powerful synergy.`
                  : compatType === "tension"
                  ? `The ${animal} and ${selectedAnimal} carry opposing energies. This pairing requires awareness and compromise but can forge deep transformation.`
                  : `The ${animal} and ${selectedAnimal} have a neutral connection — neither strongly drawn nor repelled. Growth comes through understanding.`}
              </p>
            </div>
          )}
        </div>

        {/* ─── 5-YEAR FORECAST ─── */}
        <div className="card-cosmic rounded-2xl p-5 space-y-3">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">5-Year Forecast</p>
          {forecastReading.isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm py-3">
              <Loader2 className="w-4 h-4 animate-spin" /><span>Channeling your future…</span>
            </div>
          ) : forecast?.years ? (
            <Accordion type="single" collapsible className="space-y-2">
              {(forecast.years as Array<{ year: number; title: string; rating: number; summary: string }>).map((yr) => (
                <AccordionItem key={yr.year} value={String(yr.year)} className="border-0">
                  <AccordionTrigger className="hover:no-underline bg-muted/10 rounded-xl px-4 py-3 [&[data-state=open]]:rounded-b-none">
                    <div className="flex items-center gap-3 w-full">
                      <span className="text-sm font-bold text-foreground">{yr.year}</span>
                      <StarRating rating={yr.rating} />
                      <span className="text-xs text-muted-foreground ml-auto mr-2">{yr.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="bg-muted/5 rounded-b-xl px-4 pb-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">{yr.summary}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : forecastReading.content ? (
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{forecastReading.content}</p>
          ) : null}
        </div>

      </div>
    </ChamberLayout>
  );
}
