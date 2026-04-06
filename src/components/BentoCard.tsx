import { type LucideIcon, ChevronRight } from "lucide-react";

interface BentoCardProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  accentColor?: string;
  variant?: "featured" | "grid";
  onClick?: () => void;
  locked?: boolean;
}

export function BentoCard({
  title,
  subtitle,
  icon: Icon,
  accentColor = "hsl(var(--gold))",
  variant = "grid",
  onClick,
  locked,
}: BentoCardProps) {
  if (variant === "featured") {
    return (
      <button
        onClick={onClick}
        className="card-cosmic rounded-2xl p-5 w-full flex items-center gap-4 transition-all duration-300 hover:scale-[1.01] hover:glow-gold group relative overflow-hidden"
      >
        {locked && (
          <div className="absolute top-3 right-3 text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
            🔒
          </div>
        )}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
          style={{ backgroundColor: `${accentColor}15` }}
        >
          <Icon className="w-5 h-5" style={{ color: accentColor }} />
        </div>
        <div className="flex-1 text-left">
          <h3 className="font-display text-base font-bold text-foreground">{title}</h3>
          <p className="text-[11px] uppercase tracking-[0.2em] text-primary/80 mt-0.5">{subtitle}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="card-cosmic rounded-2xl p-5 text-left transition-all duration-300 hover:scale-[1.02] hover:glow-gold group relative overflow-hidden"
    >
      {locked && (
        <div className="absolute top-3 right-3 text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
          🔒
        </div>
      )}
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
        style={{ backgroundColor: `${accentColor}15` }}
      >
        <Icon className="w-5 h-5" style={{ color: accentColor }} />
      </div>
      <h3 className="font-display text-base font-bold text-foreground mb-1">{title}</h3>
      <p className="text-[11px] uppercase tracking-[0.2em] text-primary/70">{subtitle}</p>
    </button>
  );
}
