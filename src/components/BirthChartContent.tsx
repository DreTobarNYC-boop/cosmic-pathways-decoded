import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Star } from "lucide-react";
import { getZodiacImage } from "@/lib/zodiac-images";
import { useCachedReading } from "@/hooks/use-cached-reading";

interface Placement {
  planet: string;
  symbol: string;
  sign: string;
  house: number | null;
  description: string;
}

interface BirthChart {
  placements: Placement[];
  summary: string;
}

function parseBirthChart(raw: string | null): BirthChart | null {
  if (!raw) return null;
  try {
    const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

export function BirthChartContent({
  readingType,
  cacheKey,
  context,
}: {
  readingType: string;
  cacheKey: string;
  context: Record<string, unknown>;
}) {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<"table" | "details">("table");
  const [selectedPlacement, setSelectedPlacement] = useState<number | null>(null);

  const { content, isLoading } = useCachedReading({
    readingType,
    cacheKey,
    context,
    fallback: undefined,
  });

  const chart = parseBirthChart(content);

  if (isLoading) {
    return (
      <div className="card-cosmic rounded-2xl p-8 text-center mt-4">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span className="text-sm">Calculating your birth chart…</span>
        </div>
      </div>
    );
  }

  if (!chart || !chart.placements?.length) {
    return (
      <div className="card-cosmic rounded-2xl p-8 text-center mt-4">
        <Star className="w-8 h-8 mx-auto text-primary/40 mb-3" />
        <p className="text-sm text-muted-foreground">Could not generate birth chart. Try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4 animate-fade-up">
      {/* View toggle */}
      <div className="flex justify-center gap-1 card-cosmic rounded-full p-1 w-fit mx-auto">
        <button
          onClick={() => setViewMode("table")}
          className={`px-5 py-1.5 rounded-full text-sm font-display font-bold transition-all ${
            viewMode === "table"
              ? "bg-primary/20 text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          TABLE
        </button>
        <button
          onClick={() => setViewMode("details")}
          className={`px-5 py-1.5 rounded-full text-sm font-display font-bold transition-all ${
            viewMode === "details"
              ? "bg-primary/20 text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          DETAILS
        </button>
      </div>

      {viewMode === "table" ? (
        /* ─── TABLE VIEW ─── */
        <div className="card-cosmic rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_auto_auto] px-4 py-3 border-b border-primary/10">
            <span className="text-[10px] uppercase tracking-[0.2em] text-primary/60 font-bold">
              SIGNS
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-primary/60 font-bold text-center w-28">
              PLANETS
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-primary/60 font-bold text-right w-12">
              HOUSES
            </span>
          </div>

          {/* Rows */}
          {chart.placements.map((p, i) => (
            <button
              key={p.planet}
              onClick={() => {
                setSelectedPlacement(i);
                setViewMode("details");
              }}
              className="grid grid-cols-[1fr_auto_auto] px-4 py-3.5 border-b border-primary/5 w-full text-left hover:bg-primary/5 transition-colors"
            >
              <span className="text-sm font-display text-foreground/90">{p.sign}</span>
              <span className="text-sm text-foreground/70 text-center w-28 flex items-center justify-center gap-1.5">
                <span className="text-base text-primary/80">{p.symbol}</span>
                <span className="uppercase text-xs tracking-wide">{p.planet}</span>
              </span>
              <span className="text-sm font-display text-foreground/60 text-right w-12">
                {p.house ?? "—"}
              </span>
            </button>
          ))}
        </div>
      ) : (
        /* ─── DETAILS VIEW ─── */
        <div className="space-y-4">
          {chart.placements.map((p, i) => {
            const signImage = getZodiacImage(p.sign);
            const isSelected = selectedPlacement === i;

            return (
              <div
                key={p.planet}
                ref={(el) => {
                  if (isSelected && el) {
                    el.scrollIntoView({ behavior: "smooth", block: "center" });
                  }
                }}
                className={`card-cosmic rounded-2xl p-5 border-l-2 transition-all ${
                  isSelected ? "border-l-primary glow-gold" : "border-l-primary/20"
                }`}
              >
                <h3 className="text-lg font-display font-bold text-foreground mb-2">
                  {p.planet} in {p.sign}
                </h3>
                {p.house && (
                  <p className="text-xs text-primary/60 mb-3 uppercase tracking-wider">
                    House {p.house}
                  </p>
                )}
                <p className="text-sm text-foreground/80 leading-relaxed font-display">
                  {p.description}
                </p>

                {signImage && (
                  <div className="mt-4 flex justify-center">
                    <img
                      src={signImage}
                      alt={p.sign}
                      className="w-24 h-24 object-contain opacity-60"
                      loading="lazy"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Summary */}
      {chart.summary && (
        <div className="card-cosmic rounded-2xl p-5 bg-primary/5 border-primary/20">
          <p className="text-[11px] uppercase tracking-[0.2em] text-primary font-bold mb-2">
            Chart Summary
          </p>
          <p className="text-sm text-foreground/80 leading-relaxed font-display">
            {chart.summary}
          </p>
        </div>
      )}
    </div>
  );
}
