import { ChamberLayout } from "@/components/ChamberLayout";
import { Activity } from "lucide-react";

export function FrequencyChamber({ onBack }: { onBack: () => void }) {
  return (
    <ChamberLayout title="Frequency Scanner" subtitle="Consciousness Level" onBack={onBack}>
      <div className="card-cosmic rounded-2xl p-6 text-center space-y-4 mt-4">
        <Activity className="w-10 h-10 mx-auto" style={{ color: "hsl(170, 50%, 45%)" }} />
        <p className="text-sm text-muted-foreground">
          10-question consciousness quiz mapped to the Hawkins scale. Coming soon.
        </p>
      </div>
    </ChamberLayout>
  );
}
