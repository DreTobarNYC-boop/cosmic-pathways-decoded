import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";

// Animated spectrogram fallback when external source unavailable
function AnimatedSpectrogram() {
  const [tick, setTick] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 100);
    return () => clearInterval(interval);
  }, []);

  // Generate pseudo-random but deterministic noise based on position and tick
  const generateIntensity = (row: number, col: number, t: number) => {
    const baseFreq = [7.83, 14.3, 20.8, 27.3, 33.8];
    const freqIndex = Math.floor(row / 8);
    const nearResonance = freqIndex < baseFreq.length && (row % 8) < 3;
    
    const noise = Math.sin(col * 0.5 + t * 0.1 + row * 0.3) * 
                  Math.cos(col * 0.3 - t * 0.05) * 
                  Math.sin(row * 0.2 + t * 0.08);
    
    const base = nearResonance ? 0.6 + noise * 0.3 : 0.15 + noise * 0.15;
    return Math.max(0, Math.min(1, base + Math.random() * 0.1));
  };

  const rows = 40;
  const cols = 80;
  
  const pixels = useMemo(() => {
    return Array.from({ length: rows }, (_, row) =>
      Array.from({ length: cols }, (_, col) => ({
        row,
        col,
        intensity: generateIntensity(row, col, tick),
      }))
    ).flat();
  }, [tick]);

  const getColor = (intensity: number) => {
    if (intensity > 0.7) return `rgba(255, 255, 100, ${intensity})`;
    if (intensity > 0.5) return `rgba(255, 180, 50, ${intensity})`;
    if (intensity > 0.3) return `rgba(200, 80, 50, ${intensity * 0.9})`;
    if (intensity > 0.15) return `rgba(80, 40, 120, ${intensity * 0.8})`;
    return `rgba(20, 10, 60, ${0.3 + intensity * 0.3})`;
  };

  return (
    <div className="relative w-full h-32 rounded-xl overflow-hidden bg-[#0a0515]">
      {/* Frequency labels */}
      <div className="absolute left-1 top-0 bottom-0 flex flex-col justify-between py-1 z-10">
        {[40, 30, 20, 10, 0].map((hz) => (
          <span key={hz} className="text-[8px] text-white/40 font-mono">{hz}</span>
        ))}
      </div>
      
      {/* Spectrogram grid */}
      <div 
        className="absolute inset-0 ml-5"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
        }}
      >
        {pixels.map(({ row, col, intensity }) => (
          <div
            key={`${row}-${col}`}
            style={{
              backgroundColor: getColor(intensity),
              transition: 'background-color 0.15s ease',
            }}
          />
        ))}
      </div>
      
      {/* Resonance frequency markers */}
      <div className="absolute right-2 top-0 bottom-0 flex flex-col justify-around py-2 z-10">
        {['7.83', '14.3', '20.8', '27.3'].map((freq, i) => (
          <span 
            key={freq} 
            className="text-[7px] font-mono px-1 rounded"
            style={{ 
              color: '#C5A059',
              backgroundColor: 'rgba(0,0,0,0.5)',
            }}
          >
            {freq}Hz
          </span>
        ))}
      </div>

      {/* Simulated label */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
        <span className="text-[8px] text-white/30 uppercase tracking-wider">Simulated Visualization</span>
      </div>
    </div>
  );
}

export function SchumannResonance() {
  const { t } = useTranslation();
  const [imageError, setImageError] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

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
            <h3 className="font-display text-xs uppercase tracking-widest text-muted-foreground">
              {t("schumann.title")}
            </h3>
            <span className="text-[10px] uppercase tracking-wider font-bold text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded">
              {t("schumann.live")}
            </span>
          </div>
          <div className="text-right">
            <p className="font-display text-lg font-bold text-primary">7.83 Hz</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("schumann.baseFrequency")}</p>
          </div>
        </div>

        {/* Spectrogram */}
        {!imageError ? (
          <div className="rounded-xl overflow-hidden bg-muted/20 relative">
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            )}
            <img
              src={spectrogramUrl}
              alt="Schumann Resonance live spectrogram"
              className={`w-full h-auto object-cover rounded-xl transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageError(true);
                setImageLoading(false);
              }}
              loading="lazy"
            />
          </div>
        ) : (
          <AnimatedSpectrogram />
        )}

        {/* Footer */}
        <div className="flex justify-between mt-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t("schumann.tapToLearn")}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Tomsk Space Observatory</p>
        </div>
      </button>

      {/* Info Modal */}
      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowInfo(false)} />
          <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto card-cosmic rounded-t-3xl sm:rounded-3xl border-t border-copper p-6 space-y-5 animate-fade-up">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-primary/70 mb-1">{t("schumann.title")}</p>
                <h2 className="font-display text-xl font-bold text-foreground">{t("schumann.infoTitle")}</h2>
              </div>
              <button
                onClick={() => setShowInfo(false)}
                className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-sm text-foreground/85 leading-relaxed">
              <p>{t("schumann.info1")}</p>
              <p>{t("schumann.info2")}</p>

              <div className="card-cosmic rounded-xl p-4 space-y-2">
                <p className="text-[11px] uppercase tracking-[0.2em] text-primary/70">{t("schumann.frequenciesTitle")}</p>
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
              <p className="text-[10px] text-muted-foreground">{t("schumann.source")}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
