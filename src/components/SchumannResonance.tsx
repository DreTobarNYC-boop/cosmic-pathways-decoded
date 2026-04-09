import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";

export function SchumannResonance() {
  const { t } = useTranslation();
  const [imageError, setImageError] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const spectrogramUrl = `https://sosrff.tsu.ru/new/shm.jpg?t=${Date.now()}`;

  return (
    <>
      <button
        onClick={() => setShowInfo(true)}
        className="card-cosmic rounded-2xl p-5 animate-fade-up w-full text-left transition-all hover:glow-gold"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <h3 className="font-display text-xs uppercase tracking-widest text-subtitle">
              {t("schumann.title")}
            </h3>
            <span className="text-[10px] uppercase tracking-wider font-bold text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded">
              {t("schumann.live")}
            </span>
          </div>
          <div className="text-right">
            <p className="font-display text-lg font-bold text-title">7.83 Hz</p>
            <p className="text-[10px] uppercase tracking-wider text-subtitle">{t("schumann.baseFrequency")}</p>
          </div>
        </div>

        {/* Spectrogram */}
        {!imageError ? (
          <div className="rounded-xl overflow-hidden bg-muted/20">
            <img
              src={spectrogramUrl}
              alt="Schumann Resonance live spectrogram"
              className="w-full h-auto object-cover rounded-xl"
              onError={() => setImageError(true)}
              loading="lazy"
            />
          </div>
        ) : (
          <div className="rounded-xl bg-muted/20 h-32 flex items-center justify-center">
            <p className="text-xs text-body">{t("schumann.unavailable")}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between mt-2">
          <p className="text-[10px] text-body uppercase tracking-wider">{t("schumann.tapToLearn")}</p>
          <p className="text-[10px] text-body uppercase tracking-wider">Tomsk Space Observatory</p>
        </div>
      </button>

      {/* Info Modal */}
      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowInfo(false)} />
          <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto card-cosmic rounded-t-3xl sm:rounded-3xl border-t border-copper p-6 space-y-5 animate-fade-up">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-subtitle mb-1">{t("schumann.title")}</p>
                <h2 className="font-display text-xl font-bold text-title">{t("schumann.infoTitle")}</h2>
              </div>
              <button
                onClick={() => setShowInfo(false)}
                className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-sm text-body leading-relaxed">
              <p>{t("schumann.info1")}</p>
              <p>{t("schumann.info2")}</p>

              <div className="card-cosmic rounded-xl p-4 space-y-2">
                <p className="text-[11px] uppercase tracking-[0.2em] text-subtitle">{t("schumann.frequenciesTitle")}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-primary font-bold">7.83 Hz</span> — {t("schumann.freq1")}</div>
                  <div><span className="text-primary font-bold">14.3 Hz</span> — {t("schumann.freq2")}</div>
                  <div><span className="text-primary font-bold">20.8 Hz</span> — {t("schumann.freq3")}</div>
                  <div><span className="text-primary font-bold">27.3 Hz</span> — {t("schumann.freq4")}</div>
                </div>
              </div>

              <p>{t("schumann.info3")}</p>
              <p>{t("schumann.info4")}</p>
            </div>

            <div className="pt-2 border-t border-copper">
              <p className="text-[10px] text-body">{t("schumann.source")}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
