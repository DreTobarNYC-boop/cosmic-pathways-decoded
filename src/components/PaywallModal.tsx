import { useTranslation } from "react-i18next";
import { X, Check, Sparkles } from "lucide-react";
import dcodeLogo from "@/assets/dcode-logo.jpeg";

// Whop checkout links — direct to plan checkout
const WHOP_MONTHLY = "https://whop.com/checkout/plan_NTgY1ckt5283y";
const WHOP_ANNUAL  = "https://whop.com/checkout/plan_XaTNoAx9QJN5r";

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
  /** What the user was trying to unlock — shown in the headline */
  feature?: string;
}

export function PaywallModal({ open, onClose, feature }: PaywallModalProps) {
  const { t } = useTranslation();

  if (!open) return null;

  const openCheckout = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const benefits = [
    t("paywall.benefit1"),
    t("paywall.benefit2"),
    t("paywall.benefit3"),
    t("paywall.benefit4"),
    t("paywall.benefit5"),
    t("paywall.benefit6"),
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-up"
        style={{ animationDuration: "0.2s" }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="relative w-full sm:max-w-md bg-[#0B1A1A] border-t sm:border border-[#C5A059]/30 sm:rounded-3xl rounded-t-3xl max-h-[92vh] overflow-y-auto no-scrollbar"
        style={{
          animation: "chamber-slide-up 0.32s cubic-bezier(0.25, 0.46, 0.45, 0.94) both",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-muted/30 flex items-center justify-center text-[#FFFDD0]/50 hover:text-[#FFFDD0] active:scale-95 transition-all"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="px-6 pt-8 pb-6 flex flex-col items-center">
          {/* Logo */}
          <img src={dcodeLogo} alt="DCode" className="w-16 h-16 rounded-2xl mb-4" />

          {/* Headline */}
          <div className="inline-flex items-center gap-1.5 bg-[#C5A059]/10 border border-[#C5A059]/30 rounded-full px-3 py-1 mb-3">
            <Sparkles className="w-3 h-3 text-[#C5A059]" />
            <span className="text-[10px] text-[#C5A059] uppercase tracking-widest">{t("paywall.unlock")}</span>
          </div>

          <h2 className="font-display text-2xl text-[#FFFDD0] text-center mb-1">
            {feature ?? t("paywall.title")}
          </h2>
          <p className="text-sm text-[#FFFDD0]/50 text-center mb-6 max-w-xs">
            {t("paywall.subtitle")}
          </p>

          {/* Benefits */}
          <div className="w-full space-y-2.5 mb-7">
            {benefits.map((b) => (
              <div key={b} className="flex items-start gap-2.5">
                <div className="w-4 h-4 rounded-full bg-[#C5A059]/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-2.5 h-2.5 text-[#C5A059]" />
                </div>
                <span className="text-sm text-[#FFFDD0]/80 leading-snug">{b}</span>
              </div>
            ))}
          </div>

          {/* Monthly — highlighted */}
          <button
            onClick={() => openCheckout(WHOP_MONTHLY)}
            className="w-full rounded-2xl bg-[#C5A059] text-[#0B1A1A] p-4 mb-3 active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-[10px] uppercase tracking-widest opacity-70">{t("paywall.monthly")}</p>
                <p className="font-display text-2xl font-bold">$8.88<span className="text-sm font-normal opacity-70">{t("paywall.perMonth")}</span></p>
              </div>
              <span className="text-xs bg-[#0B1A1A]/15 rounded-full px-3 py-1 font-bold">{t("paywall.mostPopular")}</span>
            </div>
          </button>

          {/* Annual */}
          <button
            onClick={() => openCheckout(WHOP_ANNUAL)}
            className="w-full rounded-2xl border border-[#C5A059]/40 bg-[#C5A059]/5 p-4 active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-[10px] uppercase tracking-widest text-[#C5A059]/70">{t("paywall.annual")}</p>
                <p className="font-display text-2xl font-bold text-[#FFFDD0]">$88<span className="text-sm font-normal text-[#FFFDD0]/50">{t("paywall.perYear")}</span></p>
              </div>
              <span className="text-xs text-green-400">{t("paywall.save")}</span>
            </div>
          </button>

          <p className="text-[10px] text-[#FFFDD0]/30 mt-5 text-center">
            {t("paywall.disclaimer")}
          </p>
        </div>
      </div>
    </div>
  );
}
