import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";

interface ChamberLayoutProps {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  onBack: () => void;
}

export function ChamberLayout({ title, subtitle, children, onBack }: ChamberLayoutProps) {
  // Scroll to top when chamber opens so content is never hidden above viewport.
  // Uses requestAnimationFrame so scroll fires after browser paints — required
  // for iOS Safari which otherwise restores scroll position after the JS runs.
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="min-h-screen bg-background">
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
