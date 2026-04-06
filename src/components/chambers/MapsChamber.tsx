import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ChamberLayout } from "@/components/ChamberLayout";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { reduceToSingle } from "@/lib/daily";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MapPin, Search, Loader2, Sparkles } from "lucide-react";

/* ─── Location numerology ─── */

function locationNumber(name: string): number {
  const sum = name.toUpperCase().split("").reduce((s, ch) => {
    const code = ch.charCodeAt(0);
    if (code >= 65 && code <= 90) return s + ((code - 65) % 9) + 1;
    return s;
  }, 0);
  return reduceToSingle(sum);
}

const LOCATION_MEANINGS: Record<number, { vibe: string; desc: string }> = {
  1: { vibe: "Independence & Leadership", desc: "A place of pioneers. Ideal for starting new ventures and asserting your identity." },
  2: { vibe: "Partnership & Diplomacy", desc: "A place of connections. Great for building relationships and collaborative work." },
  3: { vibe: "Creativity & Expression", desc: "A place of art and joy. Perfect for artists, communicators, and performers." },
  4: { vibe: "Structure & Foundation", desc: "A place of discipline. Excellent for building long-term security and systems." },
  5: { vibe: "Freedom & Adventure", desc: "A place of change. Attracts travelers, innovators, and those seeking excitement." },
  6: { vibe: "Harmony & Nurturing", desc: "A place of family. Ideal for healing, community, and domestic fulfillment." },
  7: { vibe: "Mysticism & Reflection", desc: "A place of wisdom. Perfect for spiritual seekers, researchers, and introspection." },
  8: { vibe: "Power & Abundance", desc: "A place of wealth. Attracts ambition, business, and material success." },
  9: { vibe: "Completion & Humanitarianism", desc: "A place of compassion. Great for healers, teachers, and global impact." },
  11: { vibe: "Spiritual Awakening", desc: "A master number location. Amplifies intuition, vision, and spiritual breakthroughs." },
  22: { vibe: "Master Building", desc: "A master number location. Where grand visions become tangible reality." },
  33: { vibe: "Master Teaching", desc: "A master number location. A place of profound compassion and transformation." },
};

export function MapsChamber({ onBack }: { onBack: () => void }) {
  const { i18n } = useTranslation();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("decode");
  const [location, setLocation] = useState("");
  const [result, setResult] = useState<{ name: string; number: number } | null>(null);
  const [aiReading, setAiReading] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const name = profile?.fullName || "Seeker";

  const decodeLocation = useCallback(async () => {
    if (!location.trim()) return;
    const num = locationNumber(location.trim());
    setResult({ name: location.trim(), number: num });
    setAiReading(null);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-reading", {
        body: {
          reading_type: "maps_decode",
          context: {
            name,
            locationName: location.trim(),
            locationNumber: num,
            meaning: LOCATION_MEANINGS[num]?.vibe,
            birthPlace: profile?.birthPlace || "Unknown",
            birthTime: profile?.birthTime || "Unknown",
            dateOfBirth: profile?.dateOfBirth || "Unknown",
            language: i18n.language,
          },
        },
      });
      if (error) throw error;
      setAiReading(data?.content || null);
    } catch {
      setAiReading("The cosmic frequencies are disrupted. Try again shortly.");
    } finally {
      setIsLoading(false);
    }
  }, [location, name, i18n.language]);

  // Power cities based on life path
  const lifePath = profile?.dateOfBirth ? reduceToSingle(
    profile.dateOfBirth.split("-").reduce((s, p) => s + p.split("").reduce((a, d) => a + parseInt(d), 0), 0)
  ) : 7;

  const POWER_CITIES: Record<number, string[]> = {
    1: ["New York", "London", "Tokyo", "Dubai"],
    2: ["Paris", "Vienna", "Kyoto", "Buenos Aires"],
    3: ["Los Angeles", "Barcelona", "Rio de Janeiro", "Nashville"],
    4: ["Berlin", "Zurich", "Toronto", "Singapore"],
    5: ["Amsterdam", "Bangkok", "Austin", "Lisbon"],
    6: ["Florence", "Bali", "Copenhagen", "Sedona"],
    7: ["Varanasi", "Reykjavik", "Machu Picchu", "Glastonbury"],
    8: ["Hong Kong", "Monaco", "San Francisco", "Shanghai"],
    9: ["Jerusalem", "Dharamsala", "Cape Town", "Cusco"],
    11: ["Sedona", "Glastonbury", "Mount Shasta", "Tulum"],
    22: ["Washington DC", "Cairo", "Rome", "Beijing"],
    33: ["Varanasi", "Lourdes", "Assisi", "Fatima"],
  };

  const cities = POWER_CITIES[lifePath] || POWER_CITIES[7];

  return (
    <ChamberLayout title="The Maps" subtitle="Location Numerology" onBack={onBack}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full flex overflow-x-auto gap-1 bg-muted/20 border border-border rounded-xl p-1 mb-4 no-scrollbar">
          {[
            { value: "decode", label: "Decode" },
            { value: "power", label: "Power Cities" },
            { value: "current", label: "My Location" },
          ].map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex-1 text-xs px-3 py-1.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── DECODE ── */}
        <TabsContent value="decode" className="space-y-4">
          <div className="card-cosmic rounded-2xl p-5 space-y-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Decode Any Location</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                onKeyDown={e => e.key === "Enter" && decodeLocation()}
                placeholder="Enter a city, address, or place…"
                className="flex-1 bg-muted/20 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              />
              <button
                onClick={decodeLocation}
                disabled={!location.trim() || isLoading}
                className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          {result && (
            <div className="card-cosmic rounded-2xl p-5 space-y-3 animate-fade-up">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[hsl(43,90%,67%)] to-[hsl(25,50%,45%)] flex items-center justify-center text-xl font-display font-bold text-background shadow-lg">
                  {result.number}
                </div>
                <div>
                  <p className="font-display text-lg font-bold text-foreground">{result.name}</p>
                  <p className="text-sm text-primary">{LOCATION_MEANINGS[result.number]?.vibe}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{LOCATION_MEANINGS[result.number]?.desc}</p>
              {isLoading && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Channeling location energy…</span>
                </div>
              )}
              {aiReading && (
                <div className="pt-3 border-t border-border">
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{aiReading}</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* ── POWER CITIES ── */}
        <TabsContent value="power" className="space-y-4">
          <div className="card-cosmic rounded-2xl p-5 space-y-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Your Power Cities (Life Path {lifePath})</p>
            <p className="text-sm text-muted-foreground">Places that resonate with your numerological frequency.</p>
            <div className="space-y-2 mt-2">
              {cities.map(city => {
                const num = locationNumber(city);
                return (
                  <button
                    key={city}
                    onClick={() => { setLocation(city); setActiveTab("decode"); setTimeout(decodeLocation, 100); }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/10 hover:bg-muted/20 transition-colors text-left"
                  >
                    <MapPin className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm font-semibold text-foreground flex-1">{city}</span>
                    <span className="text-xs text-primary font-bold">{num}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* ── MY LOCATION ── */}
        <TabsContent value="current" className="space-y-4">
          <div className="card-cosmic rounded-2xl p-5 space-y-3">
            {profile?.birthPlace ? (
              <>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Birth Location</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[hsl(43,90%,67%)] to-[hsl(25,50%,45%)] flex items-center justify-center text-lg font-display font-bold text-background">
                    {locationNumber(profile.birthPlace)}
                  </div>
                  <div>
                    <p className="font-display text-base font-bold text-foreground">{profile.birthPlace}</p>
                    <p className="text-xs text-primary">{LOCATION_MEANINGS[locationNumber(profile.birthPlace)]?.vibe}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{LOCATION_MEANINGS[locationNumber(profile.birthPlace)]?.desc}</p>
              </>
            ) : (
              <div className="text-center py-4">
                <MapPin className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">Add your birth place in your profile to see your birth location numerology.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </ChamberLayout>
  );
}
