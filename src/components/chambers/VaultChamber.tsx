import { ChamberLayout } from "@/components/ChamberLayout";
import { Music, Sparkles } from "lucide-react";

export function VaultChamber({ onBack }: { onBack: () => void }) {
  return (
    <ChamberLayout title="Sonic Alchemy" subtitle="Frequencies & Sacred Codes" onBack={onBack}>
      <div className="space-y-4 mt-4">
        <div className="card-cosmic rounded-2xl p-6 text-center space-y-4">
          <Music className="w-10 h-10 mx-auto text-copper" />
          <p className="text-sm text-muted-foreground">
            Solfeggio frequencies & binaural beats player coming soon.
          </p>
        </div>
        <div className="card-cosmic rounded-2xl p-6 text-center space-y-4">
          <Sparkles className="w-10 h-10 mx-auto text-gold" />
          <h3 className="font-display text-sm font-bold text-foreground">Sacred Codes</h3>
          <p className="text-sm text-muted-foreground">
            Grabovoi numerical sequences with activation rituals coming soon.
          </p>
        </div>
      </div>
    </ChamberLayout>
  );
}
