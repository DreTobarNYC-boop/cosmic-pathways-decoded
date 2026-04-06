import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ChamberLayout } from "@/components/ChamberLayout";
import { useAuth } from "@/hooks/use-auth";
import { useCachedReading } from "@/hooks/use-cached-reading";
import { getChineseZodiac, getZodiacFromDOB, getLifePath } from "@/lib/daily";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

/* ─── Chinese Zodiac Data ─── */

const ANIMAL_TRAITS: Record<string, { emoji: string; element: string; yin_yang: string; traits: string[]; colors: string[] }> = {
  Rat:     { emoji: "🐀", element: "Water", yin_yang: "Yang", traits: ["Clever", "Quick-witted", "Resourceful", "Adaptable"], colors: ["Blue", "Gold", "Green"] },
  Ox:      { emoji: "🐂", element: "Earth", yin_yang: "Yin",  traits: ["Diligent", "Dependable", "Strong", "Determined"], colors: ["Yellow", "Green", "White"] },
  Tiger:   { emoji: "🐅", element: "Wood",  yin_yang: "Yang", traits: ["Brave", "Competitive", "Confident", "Unpredictable"], colors: ["Orange", "Blue", "Gray"] },
  Rabbit:  { emoji: "🐇", element: "Wood",  yin_yang: "Yin",  traits: ["Quiet", "Elegant", "Kind", "Patient"], colors: ["Pink", "Red", "Purple"] },
  Dragon:  { emoji: "🐉", element: "Earth", yin_yang: "Yang", traits: ["Ambitious", "Energetic", "Charismatic", "Fearless"], colors: ["Gold", "Silver", "Gray"] },
  Snake:   { emoji: "🐍", element: "Fire",  yin_yang: "Yin",  traits: ["Enigmatic", "Intelligent", "Wise", "Graceful"], colors: ["Red", "Black", "Yellow"] },
  Horse:   { emoji: "🐎", element: "Fire",  yin_yang: "Yang", traits: ["Animated", "Active", "Energetic", "Free-spirited"], colors: ["Yellow", "Green", "Brown"] },
  Goat:    { emoji: "🐐", element: "Earth", yin_yang: "Yin",  traits: ["Calm", "Gentle", "Creative", "Sympathetic"], colors: ["Green", "Red", "Purple"] },
  Monkey:  { emoji: "🐒", element: "Metal", yin_yang: "Yang", traits: ["Sharp", "Smart", "Curious", "Playful"], colors: ["White", "Gold", "Blue"] },
  Rooster: { emoji: "🐓", element: "Metal", yin_yang: "Yin",  traits: ["Observant", "Hardworking", "Courageous", "Honest"], colors: ["Gold", "Yellow", "Brown"] },
  Dog:     { emoji: "🐕", element: "Earth", yin_yang: "Yang", traits: ["Loyal", "Honest", "Prudent", "Kind"], colors: ["Green", "Red", "Purple"] },
  Pig:     { emoji: "🐖", element: "Water", yin_yang: "Yin",  traits: ["Compassionate", "Generous", "Diligent", "Sociable"], colors: ["Yellow", "Gray", "Gold"] },
};

const FIVE_ELEMENTS = ["Metal", "Water", "Wood", "Fire", "Earth"] as const;

function getHeavenlyStemElement(year: number): string {
  const stemIndex = (year - 4) % 10;
  const elementIndex = Math.floor(stemIndex / 2);
  return FIVE_ELEMENTS[elementIndex];
}

const COMPAT_BEST: Record<string, string[]> = {
  Rat: ["Dragon", "Monkey", "Ox"], Ox: ["Rat", "Snake", "Rooster"], Tiger: ["Horse", "Dog", "Pig"],
  Rabbit: ["Goat", "Pig", "Dog"], Dragon: ["Rat", "Monkey", "Rooster"], Snake: ["Ox", "Rooster", "Dragon"],
  Horse: ["Tiger", "Goat", "Dog"], Goat: ["Rabbit", "Horse", "Pig"], Monkey: ["Rat", "Dragon", "Snake"],
  Rooster: ["Ox", "Snake", "Dragon"], Dog: ["Tiger", "Rabbit", "Horse"], Pig: ["Tiger", "Rabbit", "Goat"],
};

const COMPAT_CLASH: Record<string, string[]> = {
  Rat: ["Horse", "Rooster"], Ox: ["Goat", "Horse"], Tiger: ["Monkey", "Snake"],
  Rabbit: ["Rooster", "Dragon"], Dragon: ["Dog", "Rabbit"], Snake: ["Pig", "Tiger"],
  Horse: ["Rat", "Ox"], Goat: ["Ox", "Dog"], Monkey: ["Tiger", "Pig"],
  Rooster: ["Rabbit", "Rat"], Dog: ["Dragon", "Goat"], Pig: ["Snake", "Monkey"],
};

function AIBlock({ content, isLoading, label }: { content: string | null; isLoading: boolean; label: string }) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm py-3">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Channeling {label}…</span>
      </div>
    );
  }
  if (!content) return null;
  try {
    const parsed = JSON.parse(content);
    return <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{parsed.reading || parsed.content || content}</p>;
  } catch {
    return <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{content}</p>;
  }
}

export function DynastyChamber({ onBack }: { onBack: () => void }) {
  const { i18n } = useTranslation();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");

  const dob = useMemo(() => profile?.dateOfBirth ? new Date(profile.dateOfBirth + "T12:00:00") : null, [profile?.dateOfBirth]);
  const name = profile?.fullName || "Seeker";
  const year = dob?.getFullYear() || new Date().getFullYear();
  const animal = getChineseZodiac(year);
  const data = ANIMAL_TRAITS[animal] || ANIMAL_TRAITS.Rat;
  const yearElement = getHeavenlyStemElement(year);
  const zodiac = dob ? getZodiacFromDOB(dob) : null;
  const lifePath = dob ? getLifePath(dob) : null;

  const profileReading = useCachedReading({
    readingType: "dynasty_profile",
    cacheKey: `${animal}-${yearElement}-${i18n.language}`,
    context: { name, animal, yearElement, fixedElement: data.element, yinYang: data.yin_yang, traits: data.traits, zodiacSign: zodiac?.sign, lifePath, language: i18n.language },
    enabled: activeTab === "profile",
  });

  const yearReading = useCachedReading({
    readingType: "dynasty_year",
    cacheKey: `${animal}-${new Date().getFullYear()}-${i18n.language}`,
    context: { name, animal, yearElement, currentYear: new Date().getFullYear(), language: i18n.language },
    enabled: activeTab === "year",
  });

  return (
    <ChamberLayout title="The Dynasty" subtitle="Chinese Zodiac" onBack={onBack}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-5">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[hsl(0,60%,45%)] to-[hsl(25,50%,35%)] flex items-center justify-center text-4xl shadow-lg">
          {data.emoji}
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{name.split(" ")[0].toUpperCase()}'S DYNASTY</p>
          <p className="font-display text-lg font-bold text-foreground">{yearElement} {animal}</p>
          <p className="text-xs text-muted-foreground">{data.yin_yang} · {data.element} Fixed Element · Born {year}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full flex overflow-x-auto gap-1 bg-muted/20 border border-border rounded-xl p-1 mb-4 no-scrollbar">
          {[
            { value: "profile", label: "Profile" },
            { value: "elements", label: "Elements" },
            { value: "compatibility", label: "Match" },
            { value: "year", label: String(new Date().getFullYear()) },
          ].map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── PROFILE ── */}
        <TabsContent value="profile" className="space-y-4">
          <div className="card-cosmic rounded-2xl p-5 space-y-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Core Traits</p>
            <div className="flex flex-wrap gap-2">
              {data.traits.map(t => (
                <span key={t} className="px-3 py-1 rounded-full text-xs border border-primary/30 text-primary/90 bg-primary/5">{t}</span>
              ))}
            </div>
            <AIBlock content={profileReading.content} isLoading={profileReading.isLoading} label="your dynasty profile" />
          </div>

          <div className="card-cosmic rounded-2xl p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Lucky Colors</p>
            <div className="flex gap-3">
              {data.colors.map(c => (
                <div key={c} className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8 rounded-full border border-border" style={{ backgroundColor: c.toLowerCase() }} />
                  <span className="text-xs text-muted-foreground">{c}</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ── ELEMENTS ── */}
        <TabsContent value="elements" className="space-y-4">
          <div className="card-cosmic rounded-2xl p-5 space-y-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Five Element Profile</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/20 rounded-xl p-3 text-center">
                <p className="text-xs text-muted-foreground">Fixed Element</p>
                <p className="font-display text-lg font-bold text-foreground">{data.element}</p>
              </div>
              <div className="bg-muted/20 rounded-xl p-3 text-center">
                <p className="text-xs text-muted-foreground">Year Element</p>
                <p className="font-display text-lg font-bold text-primary">{yearElement}</p>
              </div>
            </div>
          </div>

          <div className="card-cosmic rounded-2xl p-5 space-y-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Element Cycle</p>
            <div className="flex items-center justify-center gap-2 py-2">
              {FIVE_ELEMENTS.map((el, i) => (
                <div key={el} className="flex items-center gap-2">
                  <div className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                    el === data.element || el === yearElement
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "bg-muted/20 text-muted-foreground"
                  }`}>
                    {el}
                  </div>
                  {i < 4 && <span className="text-muted-foreground/40">→</span>}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {data.element === yearElement
                ? `Double ${data.element} energy amplifies your core nature.`
                : `${yearElement} (year) interacts with ${data.element} (fixed) to shape your expression.`}
            </p>
          </div>
        </TabsContent>

        {/* ── COMPATIBILITY ── */}
        <TabsContent value="compatibility" className="space-y-4">
          <div className="card-cosmic rounded-2xl p-5 space-y-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Best Allies</p>
            <div className="flex flex-wrap gap-2">
              {(COMPAT_BEST[animal] || []).map(a => (
                <div key={a} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20">
                  <span className="text-lg">{ANIMAL_TRAITS[a]?.emoji}</span>
                  <span className="text-sm font-semibold text-foreground">{a}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card-cosmic rounded-2xl p-5 space-y-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Challenging Matches</p>
            <div className="flex flex-wrap gap-2">
              {(COMPAT_CLASH[animal] || []).map(a => (
                <div key={a} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-destructive/10 border border-destructive/20">
                  <span className="text-lg">{ANIMAL_TRAITS[a]?.emoji}</span>
                  <span className="text-sm font-semibold text-foreground">{a}</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ── YEAR ── */}
        <TabsContent value="year" className="space-y-4">
          <div className="card-cosmic rounded-2xl p-5 space-y-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{new Date().getFullYear()} Forecast for the {animal}</p>
            <AIBlock content={yearReading.content} isLoading={yearReading.isLoading} label={`${new Date().getFullYear()} forecast`} />
          </div>
        </TabsContent>
      </Tabs>
    </ChamberLayout>
  );
}
