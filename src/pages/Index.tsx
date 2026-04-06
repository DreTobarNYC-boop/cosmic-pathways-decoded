import { useState } from "react";
import {
  MessageCircle,
  Star,
  Hash,
  Music,
  Hand,
  MapPin,
  ScrollText,
  Lock,
  Zap,
  Fingerprint,
  KeyRound,
  LogOut,
} from "lucide-react";
import { BentoCard } from "@/components/BentoCard";
import { DailyBriefing } from "@/components/DailyBriefing";
import { SchumannResonance } from "@/components/SchumannResonance";
import { OnboardingModal } from "@/components/OnboardingModal";
import { useAuth } from "@/hooks/use-auth";
import { OracleChamber } from "@/components/chambers/OracleChamber";
import { StarsChamber } from "@/components/chambers/StarsChamber";
import { NumbersChamber } from "@/components/chambers/NumbersChamber";
import { VaultChamber } from "@/components/chambers/VaultChamber";
import { PalmChamber } from "@/components/chambers/PalmChamber";
import { MapsChamber } from "@/components/chambers/MapsChamber";
import { DynastyChamber } from "@/components/chambers/DynastyChamber";
import { SanctumChamber } from "@/components/chambers/SanctumChamber";
import { FrequencyChamber } from "@/components/chambers/FrequencyChamber";

/* ── Featured chambers (full-width with arrow) ─────────── */
const FEATURED = [
  { id: "palm-cta", chamberId: "palm", title: "Scan Your Palm", subtitle: "Palm Reading", icon: Fingerprint, accent: "hsl(280, 40%, 55%)" },
  { id: "oracle", title: "The Oracle", subtitle: "AI Guide", icon: MessageCircle, accent: "hsl(220, 30%, 62%)" },
  { id: "frequency", title: "Frequency Scanner", subtitle: "Consciousness", icon: Zap, accent: "hsl(170, 50%, 45%)" },
];

/* ── Grid chambers (2-column) ──────────────────────────── */
const GRID_CHAMBERS = [
  { id: "stars", title: "The Stars", subtitle: "Astrology", icon: Star, accent: "hsl(43, 90%, 67%)" },
  { id: "numbers", title: "The Numbers", subtitle: "Numerology", icon: Hash, accent: "hsl(43, 90%, 67%)" },
  { id: "palm", title: "The Palm", subtitle: "Palm Reading", icon: Hand, accent: "hsl(280, 40%, 55%)" },
  { id: "dynasty", title: "The Dynasty", subtitle: "Chinese Zodiac", icon: ScrollText, accent: "hsl(0, 60%, 50%)" },
  { id: "vault", title: "Sonic Alchemy", subtitle: "Sound", icon: Music, accent: "hsl(25, 50%, 45%)" },
  { id: "sacred-codes", title: "The Vault", subtitle: "Sacred Codes", icon: KeyRound, accent: "hsl(43, 70%, 55%)" },
  { id: "maps", title: "The Maps", subtitle: "Location", icon: MapPin, accent: "hsl(160, 40%, 45%)" },
  { id: "sanctum", title: "The Sanctum", subtitle: "Journal", icon: Lock, accent: "hsl(200, 30%, 50%)" },
];

const CHAMBER_COMPONENTS: Record<string, React.ComponentType<{ onBack: () => void }>> = {
  oracle: OracleChamber,
  stars: StarsChamber,
  numbers: NumbersChamber,
  vault: VaultChamber,
  palm: PalmChamber,
  maps: MapsChamber,
  dynasty: DynastyChamber,
  sanctum: SanctumChamber,
  frequency: FrequencyChamber,
};

export default function Index() {
  const { profile, isLoading, signOut, user } = useAuth();
  const [activeChamber, setActiveChamber] = useState<string | null>(null);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <h1 className="font-display text-2xl font-bold text-foreground">DCode</h1>
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  // No profile yet — show onboarding
  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <OnboardingModal open={true} />
      </div>
    );
  }

  // Active chamber view
  if (activeChamber) {
    const ChamberComponent = CHAMBER_COMPONENTS[activeChamber];
    if (ChamberComponent) {
      return <ChamberComponent onBack={() => setActiveChamber(null)} />;
    }
  }

  const dob = new Date(profile.dateOfBirth + "T00:00:00");
  const firstName = profile.fullName.split(" ")[0];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="px-5 pt-6 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">
            DCode
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-muted/30 rounded-full px-3 py-1.5">
            <span className="text-sm">🌊</span>
            <span className="text-sm font-display font-bold text-foreground">{firstName}</span>
          </div>
          {user && (
            <button
              onClick={signOut}
              className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      <main className="px-5 pb-10 space-y-5 max-w-lg mx-auto">
        {/* Schumann Resonance */}
        <SchumannResonance />

        {/* Daily Horoscope + Day Numbers */}
        <DailyBriefing dob={dob} name={profile.fullName} />

        {/* Featured Chambers — Palm CTA, Oracle, Frequency Scanner */}
        <div className="space-y-3">
          {FEATURED.map((item) => (
            <BentoCard
              key={item.id}
              title={item.title}
              subtitle={item.subtitle}
              icon={item.icon}
              accentColor={item.accent}
              variant="featured"
              onClick={() => setActiveChamber(item.chamberId || item.id)}
            />
          ))}
        </div>

        {/* Chamber Grid */}
        <div className="grid grid-cols-2 gap-3">
          {GRID_CHAMBERS.map((chamber) => (
            <BentoCard
              key={chamber.id}
              title={chamber.title}
              subtitle={chamber.subtitle}
              icon={chamber.icon}
              accentColor={chamber.accent}
              variant="grid"
              onClick={() => setActiveChamber(chamber.id)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
