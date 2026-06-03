import { ArrowLeft } from "lucide-react";

interface ChamberLayoutProps {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  onBack: () => void;
}

export function ChamberLayout({ title, subtitle, children, onBack }: ChamberLayoutProps) {
  // Fixed overlay — covers the home screen regardless of scroll position.
  // This permanently fixes iOS Safari AND Android blank-screen issues:
  // no scroll manipulation needed, chamber always starts at the top.
  return (
    <div className="fixed inset-0 bg-background overflow-y-auto z-50">
      <header className="px-5 pt-6 pb-4 flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl bg-muted/30 border border-copper flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="font-display text-lg font-bold text-foreground">{title}</h1>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </header>
      <main className="px-5 pb-10">{children}</main>
    </div>
  );
}
