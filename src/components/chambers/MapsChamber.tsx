import { ChamberLayout } from "@/components/ChamberLayout";
import { Map } from "lucide-react";

export function MapsChamber({ onBack }: { onBack: () => void }) {
  return (
    <ChamberLayout title="Maps" subtitle="Location Numerology" onBack={onBack}>
      <div className="card-cosmic rounded-2xl p-6 text-center space-y-4 mt-4">
        <Map className="w-10 h-10 mx-auto" style={{ color: "hsl(160, 40%, 45%)" }} />
        <p className="text-sm text-muted-foreground">
          Decode any city or address to its numerological vibration. Coming soon.
        </p>
      </div>
    </ChamberLayout>
  );
}
