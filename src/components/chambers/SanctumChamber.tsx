import { ChamberLayout } from "@/components/ChamberLayout";
import { Lock } from "lucide-react";

export function SanctumChamber({ onBack }: { onBack: () => void }) {
  return (
    <ChamberLayout title="Sanctum" subtitle="Private Journal" onBack={onBack}>
      <div className="card-cosmic rounded-2xl p-6 text-center space-y-4 mt-4">
        <Lock className="w-10 h-10 mx-auto" style={{ color: "hsl(200, 30%, 50%)" }} />
        <p className="text-sm text-muted-foreground">
          Your encrypted private journal. Coming soon.
        </p>
      </div>
    </ChamberLayout>
  );
}
