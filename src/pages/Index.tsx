import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import dcodeLogo from "@/assets/dcode-logo.jpeg";
import {
  MessageCircle,
  Star,
  Hash,
  AudioLines,
  Fingerprint,
  MapPin,
  Crown,
  BookOpen,
  Zap,
  Shield,
  LogOut,
  Sparkles,
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
import { SacredCodesChamber } from "@/components/chambers/SacredCodesChamber";

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
  "sacred-codes": SacredCodesChamber,
};

export default function Index() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile, isLoading, signOut, user } = useAuth();
  const [activeChamber, setActiveChamber] = useState<string | null>(null);

  const FEATURED = [
    { id: "palm-cta", chamberId: "palm", title: t("chambers.scanYourPalm"), subtitle: t("chambers.palmReading"), icon: Fingerprint, accent: "hsl(280, 40%, 55%)" },
    { id: "oracle", title: t("chambers.theOracle"), subtitle: t("chambers.aiGuide"), icon: MessageCircle, accent: "hsl(220, 30%, 62%)" },
    { id: "frequency", title: t("chambers.frequencyScanner"), subtitle: t("chambers.consciousness"), icon: Zap, accent: "hsl(170, 50%, 45%)" },
  ];

  const GRID_CHAMBERS = [
    { id: "stars", title: t("chambers.theStars"), subtitle: t("chambers.astrology"), icon: Star, accent: "hsl(43, 90%, 67%)" },
    { id: "numbers", title: t("chambers.theNumbers"), subtitle: t("chambers.numerology"), icon: Hash, accent: "hsl(43, 90%, 67%)" },
    { id: "palm", title: t("chambers.thePalm"), subtitle: t("chambers.palmReading"), icon: Fingerprint, accent: "hsl(280, 40%, 55%)" },
    { id: "dynasty", title: t("chambers.theDynasty"), subtitle: t("chambers.chineseZodiac"), icon: Crown, accent: "hsl(0, 60%, 50%)" },
    { id: "vault", title: t("chambers.sonicAlchemy"), subtitle: t("chambers.sound"), icon: AudioLines, accent: "hsl(25, 50%, 45%)" },
    { id: "sacred-codes", title: t("chambers.theVault"), subtitle: t("chambers.sacredCodes"), icon: Shield, accent: "hsl(43, 70%, 55%)" },
    { id: "maps", title: t("chambers.theMaps"), subtitle: t("chambers.location"), icon: MapPin, accent: "hsl(160, 40%, 45%)" },
    { id: "sanctum", title: t("chambers.theSanctum"), subtitle: t("chambers.journal"), icon: BookOpen, accent: "hsl(200, 30%, 50%)" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <img src={dcodeLogo} alt="DCode" className="w-20 h-20 rounded-2xl mx-auto" />
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <OnboardingModal open={true} />
      </div>
    );
  }

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
      <header className="px-5 pt-6 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={dcodeLogo} alt="DCode" className="w-9 h-9 rounded-lg" />
            <h1 className="font-display text-xl font-bold text-foreground tracking-tight">
              DCode
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/pricing")}
              className="flex items-center gap-1.5 bg-primary/20 text-primary rounded-full px-3 py-1.5 text-sm font-medium hover:bg-primary/30 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Upgrade
            </button>
            <LanguageSwitcher />
            {user && (
              <button
                onClick={signOut}
                className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                title={t("header.signOut")}
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-lg">🌊</span>
          <span className="font-display text-lg text-foreground">Welcome, <span className="text-primary font-bold">{firstName}</span></span>
        </div>
      </header>

      <main className="px-5 pb-10 space-y-5 max-w-lg mx-auto">
        <SchumannResonance />
        <DailyBriefing dob={dob} name={profile.fullName} birthPlace={profile.birthPlace} birthTime={profile.birthTime} onOpenStars={() => setActiveChamber("stars")} />

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
