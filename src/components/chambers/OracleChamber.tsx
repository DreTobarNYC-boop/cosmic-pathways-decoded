import { ChamberLayout } from "@/components/ChamberLayout";
import { MessageCircle } from "lucide-react";

export function OracleChamber({ onBack }: { onBack: () => void }) {
  return (
    <ChamberLayout title="Oracle" subtitle="Sovereign Oracle of the 36 Chambers" onBack={onBack}>
      <div className="card-cosmic rounded-2xl p-6 text-center space-y-4 mt-4">
        <MessageCircle className="w-10 h-10 mx-auto" style={{ color: "hsl(220, 30%, 62%)" }} />
        <p className="text-sm text-muted-foreground">
          The Oracle chamber is being prepared. AI-powered cosmic guidance coming soon.
        </p>
      </div>
    </ChamberLayout>
  );
}
