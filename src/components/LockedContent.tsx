import { useTranslation } from "react-i18next";
import { Lock } from "lucide-react";

interface LockedContentProps {
  /** The real content to blur behind the lock */
  children: React.ReactNode;
  /** Called when the user taps to unlock — opens the paywall */
  onUnlock: () => void;
  /** Optional custom label, e.g. "Unlock your full reading" */
  label?: string;
}

/**
 * Wraps premium content. When rendered, it blurs the children and overlays
 * a tappable "unlock" prompt. The content underneath is non-interactive.
 * Used to gate paid sections — the blurred shape drives conversion.
 */
export function LockedContent({ children, onUnlock, label }: LockedContentProps) {
  const { t } = useTranslation();

  return (
    <div className="relative">
      {/* Blurred, non-interactive content */}
      <div
        className="pointer-events-none select-none blur-[6px] opacity-60"
        aria-hidden="true"
      >
        {children}
      </div>

      {/* Unlock overlay */}
      <button
        onClick={onUnlock}
        className="absolute inset-0 flex flex-col items-center justify-center gap-3 active:scale-[0.99] transition-transform"
      >
        <div className="flex flex-col items-center gap-3 bg-[#0B1A1A]/40 backdrop-blur-[2px] rounded-2xl px-6 py-5 border border-[#C5A059]/30">
          <div className="w-11 h-11 rounded-full bg-[#C5A059]/20 border border-[#C5A059]/40 flex items-center justify-center">
            <Lock className="w-5 h-5 text-[#C5A059]" />
          </div>
          <p className="text-sm font-display text-[#FFFDD0] text-center max-w-[200px]">
            {label ?? t("locked.default")}
          </p>
          <span className="text-xs bg-[#C5A059] text-[#0B1A1A] rounded-full px-4 py-1.5 font-bold tracking-wide">
            {t("locked.unlock")}
          </span>
        </div>
      </button>
    </div>
  );
}
