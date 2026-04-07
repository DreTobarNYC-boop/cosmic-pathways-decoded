import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ChamberLayout } from "@/components/ChamberLayout";
import { useAuth } from "@/hooks/use-auth";
import { useCachedReading } from "@/hooks/use-cached-reading";
import { supabase } from "@/integrations/supabase/client";
import { reduceToSingle, getLifePath, getZodiacFromDOB, getChineseZodiac } from "@/lib/daily";
import { Globe, Search, Hash, Loader2, MapPin } from "lucide-react";

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

/* ─── Popular destinations ─── */

const POPULAR_CITIES = ["Miami", "Medellín", "Bali", "Tokyo", "Barcelona", "Dubai", "São Paulo", "London", "Tulum", "Sedona"];

/* ─── Power Map scoring ─── */

const WORLD_CITIES: { name: string; lat: number; lng: number }[] = [
  { name: "Melbourne", lat: -37.8, lng: 144.9 }, { name: "Kyoto", lat: 35.0, lng: 135.8 },
  { name: "Sedona", lat: 34.9, lng: -111.8 }, { name: "Reykjavik", lat: 64.1, lng: -21.9 },
  { name: "Cusco", lat: -13.5, lng: -72.0 }, { name: "Lisbon", lat: 38.7, lng: -9.1 },
  { name: "Bali", lat: -8.3, lng: 115.1 }, { name: "Cape Town", lat: -33.9, lng: 18.4 },
  { name: "Barcelona", lat: 41.4, lng: 2.2 }, { name: "Medellín", lat: 6.2, lng: -75.6 },
  { name: "Tulum", lat: 20.2, lng: -87.5 }, { name: "Dubai", lat: 25.2, lng: 55.3 },
  { name: "New York", lat: 40.7, lng: -74.0 }, { name: "London", lat: 51.5, lng: -0.1 },
  { name: "Paris", lat: 48.9, lng: 2.3 }, { name: "Tokyo", lat: 35.7, lng: 139.7 },
  { name: "Buenos Aires", lat: -34.6, lng: -58.4 }, { name: "Amsterdam", lat: 52.4, lng: 4.9 },
  { name: "Bangkok", lat: 13.8, lng: 100.5 }, { name: "Florence", lat: 43.8, lng: 11.3 },
  { name: "Singapore", lat: 1.4, lng: 103.8 }, { name: "San Francisco", lat: 37.8, lng: -122.4 },
  { name: "Istanbul", lat: 41.0, lng: 29.0 }, { name: "Marrakech", lat: 31.6, lng: -8.0 },
  { name: "Havana", lat: 23.1, lng: -82.4 }, { name: "Cartagena", lat: 10.4, lng: -75.5 },
  { name: "Oaxaca", lat: 17.1, lng: -96.7 }, { name: "Chiang Mai", lat: 18.8, lng: 98.9 },
  { name: "Porto", lat: 41.2, lng: -8.6 }, { name: "Nashville", lat: 36.2, lng: -86.8 },
];

function computeResonanceScore(city: string, lifePath: number, zodiacElement: string): number {
  const cityNum = locationNumber(city);
  const meaning = LOCATION_MEANINGS[cityNum];
  if (!meaning) return 40;

  let score = 50;

  // Life path harmony
  if (cityNum === lifePath) score += 25;
  else if (Math.abs(cityNum - lifePath) <= 2 || cityNum + lifePath === 10) score += 15;
  else if (cityNum % 3 === lifePath % 3) score += 10;

  // Elemental harmony
  const elementAffinities: Record<string, number[]> = {
    Fire: [1, 3, 5, 9], Earth: [4, 6, 8, 22], Air: [3, 5, 7, 11], Water: [2, 6, 7, 9],
  };
  if (elementAffinities[zodiacElement]?.includes(cityNum)) score += 12;

  // Master number bonus
  if (cityNum === 11 || cityNum === 22 || cityNum === 33) score += 5;

  // Name length entropy for variety
  score += (city.length % 7) + 1;

  return Math.min(99, Math.max(20, score));
}

/* ─── Decode Result ─── */

function DecodeResult({ name: locationName, number: num, aiReading, isLoading }: {
  name: string; number: number; aiReading: string | null; isLoading: boolean;
}) {
  const meaning = LOCATION_MEANINGS[num];
  return (
    <div className="card-cosmic rounded-2xl p-5 space-y-4 animate-fade-up">
      <div className="flex flex-col items-center text-center gap-2">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-primary/40 flex items-center justify-center shadow-lg shadow-primary/10">
          <span className="text-2xl font-display font-bold text-primary">{num}</span>
        </div>
        <h3 className="font-display text-lg font-bold text-foreground">{meaning?.vibe || "Unknown"}</h3>
        <p className="text-xs text-primary/80 uppercase tracking-wider">
          "{locationName.toUpperCase()}" VIBRATES AT {num}
        </p>
      </div>

      <p className="text-sm text-muted-foreground text-center leading-relaxed">{meaning?.desc}</p>

      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm justify-center pt-2">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span>Channeling location energy…</span>
        </div>
      )}
      {aiReading && (
        <div className="pt-3 border-t border-border">
          <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">{aiReading}</p>
        </div>
      )}
    </div>
  );
}

/* ─── Tabs ─── */

const TABS = [
  { id: "resonance", label: "Resonance", icon: "✦" },
  { id: "power", label: "Power Map", icon: "◇" },
  { id: "address", label: "Address", icon: "▣" },
];

/* ─── Main ─── */

export function MapsChamber({ onBack }: { onBack: () => void }) {
  const { i18n } = useTranslation();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("resonance");
  const [searchInput, setSearchInput] = useState("");
  const [addressInput, setAddressInput] = useState("");
  const [decodeResult, setDecodeResult] = useState<{ name: string; number: number } | null>(null);
  const [addressResult, setAddressResult] = useState<{ name: string; number: number } | null>(null);
  const [aiReading, setAiReading] = useState<string | null>(null);
  const [addressReading, setAddressReading] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddressLoading, setIsAddressLoading] = useState(false);

  const name = profile?.fullName || "Seeker";
  const dob = useMemo(() => profile?.dateOfBirth ? new Date(profile.dateOfBirth + "T12:00:00") : null, [profile?.dateOfBirth]);
  const lifePath = dob ? getLifePath(dob) : 7;
  const zodiac = dob ? getZodiacFromDOB(dob) : null;
  const zodiacElement = zodiac?.element || "Fire";

  // Power Map: ranked cities
  const rankedCities = useMemo(() => {
    return WORLD_CITIES
      .map(c => ({
        city: c.name,
        lat: c.lat,
        lng: c.lng,
        score: computeResonanceScore(c.name, lifePath, zodiacElement),
        number: locationNumber(c.name),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);
  }, [lifePath, zodiacElement]);

  const decodeLocation = useCallback(async (locationName: string) => {
    if (!locationName.trim()) return;
    const num = locationNumber(locationName.trim());
    setDecodeResult({ name: locationName.trim(), number: num });
    setAiReading(null);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-reading", {
        body: {
          reading_type: "maps_decode",
          context: {
            name,
            locationName: locationName.trim(),
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
  }, [name, profile, i18n.language]);

  const decodeAddress = useCallback(async (addr: string) => {
    if (!addr.trim()) return;
    const num = locationNumber(addr.trim());
    setAddressResult({ name: addr.trim(), number: num });
    setAddressReading(null);
    setIsAddressLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-reading", {
        body: {
          reading_type: "maps_address",
          context: {
            name,
            address: addr.trim(),
            addressNumber: num,
            meaning: LOCATION_MEANINGS[num]?.vibe,
            birthPlace: profile?.birthPlace || "Unknown",
            birthTime: profile?.birthTime || "Unknown",
            dateOfBirth: profile?.dateOfBirth || "Unknown",
            language: i18n.language,
          },
        },
      });
      if (error) throw error;
      setAddressReading(data?.content || null);
    } catch {
      setAddressReading("The cosmic frequencies are disrupted. Try again shortly.");
    } finally {
      setIsAddressLoading(false);
    }
  }, [name, profile, i18n.language]);

  return (
    <ChamberLayout title="The Maps" onBack={onBack}>
      <div className="space-y-5">

        {/* ─── Header ─── */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Globe className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">Location Intelligence</h2>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-[280px]">
              Astrocartography × Numerology × Elemental Harmony — your personalized location resonance
            </p>
          </div>
        </div>

        {/* ─── Tab Navigation ─── */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-display font-bold whitespace-nowrap transition-all shrink-0 ${
                activeTab === tab.id
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-muted/20 text-muted-foreground border border-transparent hover:bg-muted/30"
              }`}
            >
              <span className="text-xs">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── RESONANCE TAB ─── */}
        {activeTab === "resonance" && (
          <div className="space-y-4 animate-fade-up">
            {/* Search */}
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 bg-muted/20 border border-border rounded-xl px-4 py-3">
                <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && decodeLocation(searchInput)}
                  placeholder="Search any city..."
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </div>
              <button
                onClick={() => decodeLocation(searchInput)}
                disabled={!searchInput.trim() || isLoading}
                className="px-5 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-40 hover:bg-primary/90 transition-colors shrink-0"
              >
                Scan
              </button>
            </div>

            {/* Popular Destinations */}
            {!decodeResult && (
              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">Popular Destinations</p>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_CITIES.map(city => (
                    <button
                      key={city}
                      onClick={() => { setSearchInput(city); decodeLocation(city); }}
                      className="px-3 py-1.5 rounded-full text-xs border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Result */}
            {decodeResult && (
              <DecodeResult
                name={decodeResult.name}
                number={decodeResult.number}
                aiReading={aiReading}
                isLoading={isLoading}
              />
            )}
          </div>
        )}

        {/* ─── POWER MAP TAB ─── */}
        {activeTab === "power" && (
          <div className="space-y-4 animate-fade-up">
            <p className="text-xs text-muted-foreground text-center">Top cities for your unique cosmic blueprint</p>
            <div className="space-y-2">
              {rankedCities.map((item, i) => (
                <button
                  key={item.city}
                  onClick={() => { setActiveTab("resonance"); setSearchInput(item.city); decodeLocation(item.city); }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/10 hover:bg-muted/20 transition-colors border border-transparent hover:border-primary/20"
                >
                  <span className="text-sm font-bold text-muted-foreground w-6 text-right">{i + 1}</span>
                  <MapPin className="w-4 h-4 text-primary/60 shrink-0" />
                  <div className="flex-1 text-left">
                    <span className="text-sm font-semibold text-foreground">{item.city}</span>
                  </div>
                  <span className={`text-lg font-display font-bold ${
                    item.score >= 80 ? "text-primary" :
                    item.score >= 60 ? "text-primary/70" :
                    "text-muted-foreground"
                  }`}>{item.score}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─── ADDRESS TAB ─── */}
        {activeTab === "address" && (
          <div className="space-y-4 animate-fade-up">
            <p className="text-sm text-muted-foreground text-center leading-relaxed">
              Decode the numerological energy of your home address, apartment number, or any significant number
            </p>

            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 bg-muted/20 border border-border rounded-xl px-4 py-3">
                <Hash className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  value={addressInput}
                  onChange={e => setAddressInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && decodeAddress(addressInput)}
                  placeholder="Enter address or number"
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </div>
              <button
                onClick={() => decodeAddress(addressInput)}
                disabled={!addressInput.trim() || isAddressLoading}
                className="px-5 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-40 hover:bg-primary/90 transition-colors shrink-0"
              >
                Decode
              </button>
            </div>

            {addressResult && (
              <DecodeResult
                name={addressResult.name}
                number={addressResult.number}
                aiReading={addressReading}
                isLoading={isAddressLoading}
              />
            )}
          </div>
        )}

      </div>
    </ChamberLayout>
  );
}
