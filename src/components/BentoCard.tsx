import { type LucideIcon, ChevronRight } from "lucide-react";
import { ChamberSymbol, hasChamberSymbol } from "@/components/ChamberSymbol";

interface BentoCardProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  /** Chamber id — when it maps to a premium symbol, that symbol is used instead of the icon */
  symbolId?: string;
  accentColor?: string;
  variant?: "featured" | "grid";
  onClick?: () => void;
  locked?: boolean;
}

function CardGraphic({
  Icon,
  symbolId,
  accentColor,
  size,
}: {
  Icon: LucideIcon;
  symbolId?: string;
  accentColor: string;
  size: number;
}) {
  const useSymbol = symbolId && hasChamberSymbol(symbolId);
  return (
    <div
      className="rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 border"
      style={{
        width: size,
        height: size,
        // Subtle gold-tinted glass background (valid CSS, was broken before)
        background: "linear-gradient(135deg, rgba(197,160,89,0.14), rgba(197,160,89,0.04))",
        borderColor: "rgba(197,160,89,0.22)",
      }}
    >
      {useSymbol ? (
        <ChamberSymbol id={symbolId!} size={Math.round(size * 0.62)} />
      ) : (
        <Icon className="w-5 h-5" style={{ color: accentColor }} />
      )}
    </div>
  );
}

export function BentoCard({
  title,
  subtitle,
  icon: Icon,
  symbolId,
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
        <CardGraphic Icon={Icon} symbolId={symbolId} accentColor={accentColor} size={48} />
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
      <div className="mb-4">
        <CardGraphic Icon={Icon} symbolId={symbolId} accentColor={accentColor} size={44} />
      </div>
      <h3 className="font-display text-base font-bold text-foreground mb-1">{title}</h3>
      <p className="text-[11px] uppercase tracking-[0.2em] text-primary/70">{subtitle}</p>
    </button>
  );
}
