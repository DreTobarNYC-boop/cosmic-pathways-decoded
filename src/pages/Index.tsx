import { useState } from "react";
import {
  MessageCircle,
  Star,
  Hash,
  Music,
  Hand,
  Map,
  ScrollText,
  Lock,
  Activity,
  LogOut,
} from "lucide-react";
import { BentoCard } from "@/components/BentoCard";
import { DailyBriefing } from "@/components/DailyBriefing";
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

const FEATURED_CHAMBERS = [
  { id: "oracle", title: "Oracle", subtitle: "Ask Anything", icon: MessageCircle, accent: "hsl(220, 30%, 62%)", span: "full" as const },
  { id: "palm", title: "Palm", subtitle: "AI Hand Analysis", icon: Hand, accent: "hsl(280, 40%, 55%)", span: "full" as const },
];

const SPOTLIGHT_CHAMBER = { id: "frequency", title: "Frequency Scanner", subtitle: "Consciousness Level", icon: Activity, accent: "hsl(170, 50%, 45%)" };

const CHAMBERS = [
  { id: "stars", title: "Stars", subtitle: "Birth Chart & Horoscopes", icon: Star, accent: "hsl(43, 90%, 67%)" },
  { id: "numbers", title: "Numbers", subtitle: "Numerology Profile", icon: Hash, accent: "hsl(43, 90%, 67%)" },
  { id: "vault", title: "Sonic Alchemy", subtitle: "Frequencies & Binaural Beats", icon: Music, accent: "hsl(25, 50%, 45%)" },
  { id: "maps", title: "Maps", subtitle: "Location Numerology", icon: Map, accent: "hsl(160, 40%, 45%)" },
  { id: "dynasty", title: "Dynasty", subtitle: "Chinese Zodiac", icon: ScrollText, accent: "hsl(0, 60%, 50%)" },
  { id: "sanctum", title: "Sanctum", subtitle: "Private Journal", icon: Lock, accent: "hsl(200, 30%, 50%)" },
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
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  // No profile yet — show onboarding (no auth required)
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="px-5 pt-6 pb-2 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">
            DCode
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Welcome back, {profile.fullName.split(" ")[0]}
          </p>
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
      </header>

      <main className="px-5 pb-10 space-y-6 max-w-lg mx-auto">
        {/* Daily Briefing */}
        <DailyBriefing dob={dob} name={profile.fullName} />

        {/* Chamber Grid */}
        <div>
          <h2 className="font-display text-sm uppercase tracking-widest text-muted-foreground mb-3">
            The Chambers
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {CHAMBERS.map((chamber) => (
              <BentoCard
                key={chamber.id}
                title={chamber.title}
                subtitle={chamber.subtitle}
                icon={chamber.icon}
                accentColor={chamber.accent}
                span={chamber.span}
                onClick={() => setActiveChamber(chamber.id)}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
