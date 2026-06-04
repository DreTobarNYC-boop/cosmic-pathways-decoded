import { useState, useEffect } from "react";
import { X, Share, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import dcodeLogo from "@/assets/dcode-logo.jpeg";

const DISMISS_KEY = "dcode_install_dismissed";

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInStandaloneMode(): boolean {
  // iOS
  if ((navigator as any).standalone === true) return true;
  // Android / others
  return window.matchMedia("(display-mode: standalone)").matches;
}

/**
 * Shows a one-time install hint.
 * - Android/Chrome: captures beforeinstallprompt and shows an "Install" button.
 * - iOS Safari: shows the manual "Share → Add to Home Screen" instructions
 *   (iOS has no programmatic install).
 * Hidden when already installed or previously dismissed.
 */
export function InstallPrompt() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const ios = isIos();

  useEffect(() => {
    if (isInStandaloneMode()) return;               // already installed
    if (localStorage.getItem(DISMISS_KEY)) return;   // user dismissed before

    // Android: capture the install event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS: no event exists — show the manual hint after a short delay
    if (ios) {
      const timer = setTimeout(() => setVisible(true), 2500);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handler);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [ios]);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    dismiss();
  };

  if (!visible) return null;

  return (
    <div
      className="fixed left-3 right-3 z-[90] bg-[#0B1A1A] border border-[#C5A059]/40 rounded-2xl shadow-2xl p-4 animate-fade-up"
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
    >
      <button
        onClick={dismiss}
        className="absolute top-3 right-3 w-7 h-7 rounded-full bg-muted/30 flex items-center justify-center text-[#FFFDD0]/50 active:scale-95 transition-transform"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <div className="flex items-center gap-3">
        <img src={dcodeLogo} alt="DCode" className="w-11 h-11 rounded-xl shrink-0" />
        <div className="flex-1 min-w-0 pr-5">
          <p className="font-display text-sm text-[#FFFDD0] font-bold">{t("install.title")}</p>
          {ios ? (
            <p className="text-xs text-[#FFFDD0]/60 leading-snug mt-0.5 flex items-center flex-wrap gap-x-1">
              {t("install.iosTap")}
              <Share className="inline w-3.5 h-3.5 text-[#C5A059]" />
              {t("install.iosThen")}
              <span className="inline-flex items-center gap-0.5 text-[#C5A059]">
                <Plus className="w-3 h-3" />{t("install.iosAdd")}
              </span>
            </p>
          ) : (
            <p className="text-xs text-[#FFFDD0]/60 leading-snug mt-0.5">{t("install.androidHint")}</p>
          )}
        </div>

        {!ios && deferredPrompt && (
          <button
            onClick={install}
            className="shrink-0 text-xs bg-[#C5A059] text-[#0B1A1A] rounded-full px-4 py-2 font-bold active:scale-95 transition-transform"
          >
            {t("install.button")}
          </button>
        )}
      </div>
    </div>
  );
}
