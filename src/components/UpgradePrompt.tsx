import { useNavigate } from "react-router-dom";
import { Lock, Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UpgradePromptProps {
  reason: string;
  feature?: string;
  variant?: "inline" | "overlay" | "card";
}

export function UpgradePrompt({ reason, feature, variant = "card" }: UpgradePromptProps) {
  const navigate = useNavigate();

  if (variant === "inline") {
    return (
      <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-xl">
        <Lock className="w-4 h-4 text-primary flex-shrink-0" />
        <p className="text-sm text-foreground flex-1">{reason}</p>
        <Button size="sm" variant="outline" onClick={() => navigate("/pricing")}>
          Upgrade
        </Button>
      </div>
    );
  }

  if (variant === "overlay") {
    return (
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl">
        <div className="text-center space-y-4 p-6 max-w-xs">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <Crown className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-display text-lg font-bold">{feature || "Premium Feature"}</h3>
          <p className="text-sm text-muted-foreground">{reason}</p>
          <Button onClick={() => navigate("/pricing")} className="w-full">
            <Sparkles className="w-4 h-4 mr-2" />
            Unlock Full Access
          </Button>
        </div>
      </div>
    );
  }

  // Default: card variant
  return (
    <div className="bg-gradient-to-br from-primary/10 via-background to-background border border-primary/20 rounded-2xl p-6 text-center space-y-4">
      <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
        <Lock className="w-7 h-7 text-primary" />
      </div>
      <div className="space-y-2">
        <h3 className="font-display text-lg font-bold">{feature || "Upgrade to Continue"}</h3>
        <p className="text-sm text-muted-foreground">{reason}</p>
      </div>
      <Button onClick={() => navigate("/pricing")} className="w-full">
        <Sparkles className="w-4 h-4 mr-2" />
        View Plans
      </Button>
    </div>
  );
}
