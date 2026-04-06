import { type LucideIcon } from "lucide-react";

interface BentoCardProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  accentColor?: string;
  span?: "full" | "half";
  onClick?: () => void;
  locked?: boolean;
}

export function BentoCard({
  title,
  subtitle,
  icon: Icon,
  accentColor = "hsl(var(--gold))",
  span = "half",
  onClick,
  locked,
}: BentoCardProps) {
  return (
    <button
      onClick={onClick}
      className={`card-cosmic rounded-2xl p-5 text-left transition-all duration-300 hover:scale-[1.02] hover:glow-gold group relative overflow-hidden ${
        span === "full" ? "col-span-full" : ""
      }`}
    >
      {locked && (
        <div className="absolute top-3 right-3 text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
          🔒
        </div>
      )}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
        style={{ backgroundColor: `${accentColor}20` }}
      >
        <Icon className="w-5 h-5" style={{ color: accentColor }} />
      </div>
      <h3 className="font-display text-sm font-bold text-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </button>
  );
}
