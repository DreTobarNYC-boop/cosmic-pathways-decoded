import { ChamberLayout } from "@/components/ChamberLayout";
import { Hand } from "lucide-react";

export function PalmChamber({ onBack }: { onBack: () => void }) {
  return (
    <ChamberLayout title="Palm" subtitle="AI Hand Analysis" onBack={onBack}>
      <div className="card-cosmic rounded-2xl p-6 text-center space-y-4 mt-4">
        <Hand className="w-10 h-10 mx-auto" style={{ color: "hsl(280, 40%, 55%)" }} />
        <p className="text-sm text-muted-foreground">
          Gemini Vision palmistry coming soon. Point your camera at your palm for a unique reading.
        </p>
      </div>
    </ChamberLayout>
  );
}
