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
import { AuthModal } from "@/components/AuthModal";
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

const CHAMBERS = [
  { id: "oracle", title: "Oracle", subtitle: "Ask Anything", icon: MessageCircle, accent: "hsl(220, 30%, 62%)", span: "full" as const },
  { id: "stars", title: "Stars", subtitle: "Birth Chart & Horoscopes", icon: Star, accent: "hsl(43, 90%, 67%)" },
  { id: "numbers", title: "Numbers", subtitle: "Numerology Profile", icon: Hash, accent: "hsl(43, 90%, 67%)" },
  { id: "vault", title: "Sonic Alchemy", subtitle: "Frequencies & Sacred Codes", icon: Music, accent: "hsl(25, 50%, 45%)" },
  { id: "palm", title: "Palm", subtitle: "AI Hand Analysis", icon: Hand, accent: "hsl(280, 40%, 55%)" },
  { id: "maps", title: "Maps", subtitle: "Location Numerology", icon: Map, accent: "hsl(160, 40%, 45%)" },
  { id: "dynasty", title: "Dynasty", subtitle: "Chinese Zodiac", icon: ScrollText, accent: "hsl(0, 60%, 50%)" },
  { id: "sanctum", title: "Sanctum", subtitle: "Private Journal", icon: Lock, accent: "hsl(200, 30%, 50%)" },
  { id: "frequency", title: "Frequency Scanner", subtitle: "Consciousness Level", icon: Activity, accent: "hsl(170, 50%, 45%)" },
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
  const { user, profile, isLoading, signOut } = useAuth();
  const [activeChamber, setActiveChamber] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);

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

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-5">
        <div className="text-center space-y-6 max-w-sm animate-fade-up">
          <h1 className="font-display text-4xl font-bold text-foreground">DCode</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Decode your cosmic blueprint. Astrology, numerology, frequencies, and AI-powered guidance — all in one place.
          </p>
          <button
            onClick={() => setShowAuth(true)}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-display rounded-xl py-3 text-sm font-bold transition-colors"
          >
            Enter The Chambers
          </button>
          <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
        </div>
      </div>
    );
  }

  // Authenticated but no profile — onboarding
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
        <button
          onClick={signOut}
          className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
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
