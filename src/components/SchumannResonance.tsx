import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";

// Schumann resonance frequencies in Hz
const SCHUMANN_FREQUENCIES = [7.83, 14.3, 20.8, 27.3, 33.8];

// Generate simulated spectrogram data with Schumann peaks
function generateSpectrogramColumn(time: number): number[] {
  const data: number[] = [];
  const numBins = 64;
  
  for (let i = 0; i < numBins; i++) {
    const freq = (i / numBins) * 40; // 0-40 Hz range
    let intensity = Math.random() * 0.15; // Base noise
    
    // Add peaks at Schumann frequencies with time-varying intensity
    for (const sf of SCHUMANN_FREQUENCIES) {
      const distance = Math.abs(freq - sf);
      if (distance < 2) {
        // Gaussian peak with time modulation
        const peakStrength = Math.exp(-(distance * distance) / 0.8);
        const timeModulation = 0.6 + 0.4 * Math.sin(time * 0.001 + sf);
        intensity += peakStrength * timeModulation * (sf === 7.83 ? 1 : 0.7);
      }
    }
    
    data.push(Math.min(1, intensity));
  }
  
  return data;
}

// Color gradient for spectrogram (dark blue -> cyan -> yellow -> red)
function getSpectrogramColor(intensity: number): string {
  if (intensity < 0.25) {
    const t = intensity / 0.25;
    return `rgb(${Math.floor(10 + t * 20)}, ${Math.floor(20 + t * 60)}, ${Math.floor(60 + t * 100)})`;
  } else if (intensity < 0.5) {
    const t = (intensity - 0.25) / 0.25;
    return `rgb(${Math.floor(30 + t * 20)}, ${Math.floor(80 + t * 100)}, ${Math.floor(160 - t * 40)})`;
  } else if (intensity < 0.75) {
    const t = (intensity - 0.5) / 0.25;
    return `rgb(${Math.floor(50 + t * 150)}, ${Math.floor(180 + t * 60)}, ${Math.floor(120 - t * 80)})`;
  } else {
    const t = (intensity - 0.75) / 0.25;
    return `rgb(${Math.floor(200 + t * 55)}, ${Math.floor(240 - t * 100)}, ${Math.floor(40 - t * 40)})`;
  }
}

export function SchumannResonance() {
  const { t } = useTranslation();
  const [showInfo, setShowInfo] = useState(false);
  const [currentReading, setCurrentReading] = useState(7.83);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const historyRef = useRef<number[][]>([]);
  
  // Animate the spectrogram
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    const now = Date.now();
    
    // Generate new column
    const newColumn = generateSpectrogramColumn(now);
    historyRef.current.push(newColumn);
    
    // Keep only enough history to fill the canvas
    const maxColumns = Math.ceil(width / 2);
    if (historyRef.current.length > maxColumns) {
      historyRef.current = historyRef.current.slice(-maxColumns);
    }
    
    // Clear canvas
    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0, 0, width, height);
    
    // Draw spectrogram
    const colWidth = 2;
    const binHeight = height / 64;
    
    historyRef.current.forEach((column, colIndex) => {
      const x = colIndex * colWidth;
      column.forEach((intensity, binIndex) => {
        const y = height - (binIndex + 1) * binHeight;
        ctx.fillStyle = getSpectrogramColor(intensity);
        ctx.fillRect(x, y, colWidth, binHeight);
      });
    });
    
    // Draw frequency labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '9px monospace';
    SCHUMANN_FREQUENCIES.forEach(freq => {
      const y = height - (freq / 40) * height;
      ctx.fillText(`${freq}`, 4, y + 3);
    });
    
    // Update current reading with slight variation
    setCurrentReading(7.83 + (Math.sin(now * 0.0005) * 0.15));
    
    animationRef.current = requestAnimationFrame(animate);
  }, []);
  
  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);

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
            <p className="font-display text-lg font-bold text-primary">{currentReading.toFixed(2)} Hz</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("schumann.baseFrequency")}</p>
          </div>
        </div>

        {/* Live Canvas Spectrogram */}
        <div className="rounded-xl overflow-hidden bg-[#0a0a12]">
          <canvas 
            ref={canvasRef}
            width={320}
            height={100}
            className="w-full h-auto"
          />
        </div>

        {/* Footer */}
        <div className="flex justify-between mt-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t("schumann.tapToLearn")}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Live Simulation</p>
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
