import { useState, useEffect } from "react";

/**
 * Schumann Resonance live widget.
 * Fetches the current spectrogram from the Tomsk Space Observatory feed.
 * The base frequency is always ~7.83 Hz; we show a "live" badge.
 */
export function SchumannResonance() {
  const [imageError, setImageError] = useState(false);

  // Tomsk observatory spectrogram — append timestamp to bust cache
  const spectrogramUrl = `https://sosrff.tsu.ru/new/shm.jpg?t=${Date.now()}`;

  return (
    <div className="card-cosmic rounded-2xl p-5 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <h3 className="font-display text-xs uppercase tracking-widest text-muted-foreground">
            Schumann Resonance
          </h3>
          <span className="text-[10px] uppercase tracking-wider font-bold text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded">
            Live
          </span>
        </div>
        <div className="text-right">
          <p className="font-display text-lg font-bold text-primary">7.83 Hz</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Base Frequency</p>
        </div>
      </div>

      {/* Spectrogram */}
      {!imageError ? (
        <div className="rounded-xl overflow-hidden bg-muted/20">
          <img
            src={spectrogramUrl}
            alt="Schumann Resonance live spectrogram from Tomsk Space Observatory"
            className="w-full h-auto object-cover rounded-xl"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        </div>
      ) : (
        <div className="rounded-xl bg-muted/20 h-32 flex items-center justify-center">
          <p className="text-xs text-muted-foreground">Spectrogram temporarily unavailable</p>
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between mt-2">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Tap to learn more</p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Tomsk Space Observatory</p>
      </div>
    </div>
  );
}
