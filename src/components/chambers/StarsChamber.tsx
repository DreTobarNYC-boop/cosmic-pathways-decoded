import { ChamberLayout } from "@/components/ChamberLayout";
import { Star } from "lucide-react";

export function StarsChamber({ onBack }: { onBack: () => void }) {
  return (
    <ChamberLayout title="Stars" subtitle="Birth Chart & Horoscopes" onBack={onBack}>
      <div className="card-cosmic rounded-2xl p-6 text-center space-y-4 mt-4">
        <Star className="w-10 h-10 mx-auto text-gold" />
        <p className="text-sm text-muted-foreground">
          The Stars chamber is being aligned. Birth chart readings coming soon.
        </p>
      </div>
    </ChamberLayout>
  );
}
