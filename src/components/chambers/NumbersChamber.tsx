import { ChamberLayout } from "@/components/ChamberLayout";
import { Hash } from "lucide-react";

export function NumbersChamber({ onBack }: { onBack: () => void }) {
  return (
    <ChamberLayout title="Numbers" subtitle="Numerology Profile" onBack={onBack}>
      <div className="card-cosmic rounded-2xl p-6 text-center space-y-4 mt-4">
        <Hash className="w-10 h-10 mx-auto text-gold" />
        <p className="text-sm text-muted-foreground">
          The Numbers chamber is computing. Full numerology profile coming soon.
        </p>
      </div>
    </ChamberLayout>
  );
}
