import { useState, useEffect } from "react";
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
  Sparkles,
} from "lucide-react";
import { BentoCard } from "@/components/BentoCard";
import { DailyBriefing } from "@/components/DailyBriefing";
import { OnboardingModal } from "@/components/OnboardingModal";

const CHAMBERS = [
  { id: "oracle", title: "Oracle", subtitle: "Ask Anything", icon: MessageCircle, accent: "hsl(220, 30%, 62%)", span: "full" as const },
  { id: "stars", title: "Stars", subtitle: "Birth Chart & Horoscopes", icon: Star, accent: "hsl(43, 90%, 67%)" },
  { id: "numbers", title: "Numbers", subtitle: "Numerology Profile", icon: Hash, accent: "hsl(43, 90%, 67%)" },
  { id: "vault", title: "Sonic Alchemy", subtitle: "Frequencies & Codes", icon: Music, accent: "hsl(25, 50%, 45%)" },
  { id: "palm", title: "Palm", subtitle: "AI Hand Analysis", icon: Hand, accent: "hsl(280, 40%, 55%)" },
  { id: "maps", title: "Maps", subtitle: "Location Numerology", icon: Map, accent: "hsl(160, 40%, 45%)" },
  { id: "dynasty", title: "Dynasty", subtitle: "Chinese Zodiac", icon: ScrollText, accent: "hsl(0, 60%, 50%)" },
  { id: "sanctum", title: "Sanctum", subtitle: "Private Journal", icon: Lock, accent: "hsl(200, 30%, 50%)" },
  { id: "frequency", title: "Frequency Scanner", subtitle: "Consciousness Level", icon: Activity, accent: "hsl(170, 50%, 45%)" },
  { id: "sacred", title: "Sacred Codes", subtitle: "Grabovoi Sequences", icon: Sparkles, accent: "hsl(45, 100%, 50%)" },
];

export default function Index() {
  const [profile, setProfile] = useState<{ name: string; dob: string } | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeChamber, setActiveChamber] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("dcode_profile");
    if (stored) {
      setProfile(JSON.parse(stored));
    } else {
      setShowOnboarding(true);
    }
  }, []);

  const handleOnboardingComplete = (data: { name: string; dob: string }) => {
    localStorage.setItem("dcode_profile", JSON.stringify(data));
    setProfile(data);
    setShowOnboarding(false);
  };

  const dob = profile ? new Date(profile.dob + "T00:00:00") : null;

  return (
    <div className="min-h-screen bg-background">
      <OnboardingModal open={showOnboarding} onComplete={handleOnboardingComplete} />

      {/* Header */}
      <header className="px-5 pt-6 pb-2">
        <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">
          DCode
        </h1>
        {profile && (
          <p className="text-sm text-muted-foreground mt-0.5">
            Welcome back, {profile.name.split(" ")[0]}
          </p>
        )}
      </header>

      <main className="px-5 pb-10 space-y-6">
        {/* Daily Briefing */}
        {dob && profile && <DailyBriefing dob={dob} name={profile.name} />}

        {/* Chamber Grid */}
        <div>
          <h2 className="font-display text-sm uppercase tracking-widest text-muted-foreground mb-3">
            The 10 Chambers
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {CHAMBERS.map((chamber, i) => (
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
