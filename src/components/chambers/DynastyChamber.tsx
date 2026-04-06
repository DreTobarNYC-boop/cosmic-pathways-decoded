import { ChamberLayout } from "@/components/ChamberLayout";
import { ScrollText } from "lucide-react";

export function DynastyChamber({ onBack }: { onBack: () => void }) {
  return (
    <ChamberLayout title="Dynasty" subtitle="Chinese Zodiac" onBack={onBack}>
      <div className="card-cosmic rounded-2xl p-6 text-center space-y-4 mt-4">
        <ScrollText className="w-10 h-10 mx-auto" style={{ color: "hsl(0, 60%, 50%)" }} />
        <p className="text-sm text-muted-foreground">
          Full Chinese zodiac profile, element interactions, and 5-year forecast. Coming soon.
        </p>
      </div>
    </ChamberLayout>
  );
}
