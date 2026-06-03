import { ArrowLeft } from "lucide-react";

interface ChamberLayoutProps {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  onBack: () => void;
}

export function ChamberLayout({ title, subtitle, children, onBack }: ChamberLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header with backdrop blur — premium native feel */}
      <header className="sticky top-0 z-10 px-5 pt-6 pb-4 flex items-center gap-3 bg-background/90 backdrop-blur-md border-b border-white/5">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl bg-muted/30 border border-copper flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 transition-all"
          aria-label="Go back"
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
      <main className="px-5 pb-16">{children}</main>
    </div>
  );
}
