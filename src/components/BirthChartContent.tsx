import { useState } from "react";
import { Loader2, RefreshCw, Star } from "lucide-react";
import { useCachedReading } from "@/hooks/use-cached-reading";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Placement {
  planet: string;
  symbol?: string;
  sign: string;
  house: number | string | null;
  degree: number;
  description?: string;
}

interface LegacyInterpretation {
  planet: string;
  sign: string;
  house: number | null;
  title: string;
  description: string;
}

interface BirthChart {
  placements: Placement[];
  interpretation: string;
  interpretations?: LegacyInterpretation[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ZODIAC_ORDER = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: "☉", Moon: "☽", Ascendant: "↑", Mercury: "☿", Venus: "♀",
  Mars: "♂", Jupiter: "♃", Saturn: "♄", Uranus: "⛢", Neptune: "♆", Pluto: "♇",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseHouse(h: number | string | null | undefined): number | null {
  if (h == null) return null;
  if (typeof h === "number") return h;
  const n = parseInt(h, 10);
  return isNaN(n) ? null : n;
}

function parseBirthChart(raw: string | null): BirthChart | null {
  if (!raw) return null;
  try {
    const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(cleaned);
    if (
      !Array.isArray(parsed.placements) ||
      parsed.placements.length === 0
    ) {
      return null;
    }

    // Filter to only valid placements (must have planet + sign strings)
    const placements: Placement[] = parsed.placements
      .filter(
        (p: unknown) =>
          p !== null &&
          typeof p === "object" &&
          typeof (p as Record<string, unknown>).planet === "string" &&
          typeof (p as Record<string, unknown>).sign === "string",
      )
      .map((p: Placement) => ({
        ...p,
        symbol: p.symbol ?? PLANET_SYMBOLS[p.planet] ?? "✦",
        house: parseHouse(p.house),
      }));

    if (placements.length === 0) return null;

    const interpretation: string =
      (typeof parsed.interpretation === "string" ? parsed.interpretation : "") ||
      (typeof parsed.prose === "string" ? parsed.prose : "");

    return {
      placements,
      interpretation,
      interpretations: Array.isArray(parsed.interpretations) ? parsed.interpretations : undefined,
    };
  } catch {
    return null;
  }
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

/** Sort placements by ecliptic degree, starting from the Ascendant's position. */
function sortFromAscendant(placements: Placement[]): Placement[] {
  const ascDeg = placements.find((p) => p.planet === "Ascendant")?.degree ?? 0;
  return [...placements].sort((a, b) => {
    const ra = (a.degree - ascDeg + 360) % 360;
    const rb = (b.degree - ascDeg + 360) % 360;
    return ra - rb;
  });
}

/** Group a sorted list by sign, preserving order. */
function groupBySign(sorted: Placement[]): { sign: string; planets: Placement[] }[] {
  const groups: { sign: string; planets: Placement[] }[] = [];
  for (const p of sorted) {
    const last = groups[groups.length - 1];
    if (last && last.sign === p.sign) {
      last.planets.push(p);
    } else {
      groups.push({ sign: p.sign, planets: [p] });
    }
  }
  return groups;
}

// ─── SVG Circle Chart helpers ─────────────────────────────────────────────────

const CX = 160;
const CY = 160;
const OUTER_R = 152;
const RING_R   = 110;
const LABEL_R  = 131;   // midpoint of ring for sign labels
const GLYPH_R  = 120;   // planet glyphs sit just inside the ring

function toRad(deg: number) { return (deg * Math.PI) / 180; }

function polar(r: number, angleDeg: number) {
  return {
    x: CX + r * Math.cos(toRad(angleDeg)),
    y: CY + r * Math.sin(toRad(angleDeg)),
  };
}

function sectorPath(startDeg: number, endDeg: number, outer: number, inner: number): string {
  const p1 = polar(outer, startDeg);
  const p2 = polar(outer, endDeg);
  const p3 = polar(inner, endDeg);
  const p4 = polar(inner, startDeg);
  const f = (v: number) => v.toFixed(2);
  return [
    `M ${f(p1.x)} ${f(p1.y)}`,
    `A ${outer} ${outer} 0 0 0 ${f(p2.x)} ${f(p2.y)}`,
    `L ${f(p3.x)} ${f(p3.y)}`,
    `A ${inner} ${inner} 0 0 1 ${f(p4.x)} ${f(p4.y)}`,
    `Z`,
  ].join(" ");
}

function eclipticToSvgAngle(eclipticDeg: number, ascDeg: number): number {
  return 180 - ((eclipticDeg - ascDeg + 360) % 360);
}

function signSegmentAngles(signOffset: number): [number, number] {
  return [180 - signOffset * 30, 180 - (signOffset + 1) * 30];
}

function getAscendantDegree(placements: Placement[]): number {
  return placements.find((p) => p.planet === "Ascendant")?.degree ?? 0;
}

/** Rotation for sign labels so they read tangentially along the ring. */
function labelRotation(centerDeg: number): number {
  // Normalise to [0, 360)
  const d = ((centerDeg % 360) + 360) % 360;
  // Upper visual half (SVG angles 180–360, where sin < 0) → text reads CCW
  // Lower visual half (SVG angles 0–180, where sin > 0)   → flip 180° to avoid upside-down
  return d > 0 && d < 180 ? d - 90 + 180 : d - 90;
}

// ─── CoStar TABLE view ────────────────────────────────────────────────────────

function CoStarTableView({
  placements,
  selected,
  onSelect,
}: {
  placements: Placement[];
  selected: string | null;
  onSelect: (planet: string) => void;
}) {
  const sorted = sortFromAscendant(placements);
  const groups = groupBySign(sorted);

  // Pre-compute which planets get a house number shown (first per house)
  const houseDisplay: Record<string, number | null> = {};
  let lastHouse: number | null = null;
  for (const g of groups) {
    for (const p of g.planets) {
      const h = parseHouse(p.house);
      if (h !== null && h !== lastHouse) {
        houseDisplay[p.planet] = h;
        lastHouse = h;
      } else {
        houseDisplay[p.planet] = null;
      }
    }
  }

  return (
    <div className="flex items-stretch gap-0">
      {/* SIGNS vertical label */}
      <div
        className="flex items-center justify-center w-5 shrink-0"
        style={{ writingMode: "vertical-rl" }}
      >
        <span className="text-[9px] tracking-[0.35em] text-muted-foreground font-semibold uppercase rotate-180">
          SIGNS
        </span>
      </div>

      {/* Table body */}
      <div className="flex-1 border border-border/40 overflow-hidden">
        {groups.map((group) => (
          <div
            key={`${group.sign}-${group.planets[0].planet}`}
            className="flex border-b border-border/40 last:border-b-0"
          >
            {/* Sign cell — full height of the group */}
            <div className="w-[116px] shrink-0 border-r border-border/30 flex items-center px-3 py-0">
              <span className="text-sm text-foreground/75 font-display">{group.sign}</span>
            </div>

            {/* Planet rows */}
            <div className="flex-1">
              {group.planets.map((p) => {
                const symbol = p.symbol ?? PLANET_SYMBOLS[p.planet] ?? "✦";
                const isActive = selected === p.planet;
                const houseNum = houseDisplay[p.planet];

                return (
                  <button
                    key={p.planet}
                    onClick={() => onSelect(p.planet)}
                    className={[
                      "w-full flex items-center justify-between py-3 px-3",
                      "border-b border-border/20 last:border-b-0 transition-colors",
                      isActive ? "bg-primary/10" : "hover:bg-white/5",
                    ].join(" ")}
                  >
                    {/* Glyph + planet name */}
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`text-base leading-none ${
                          isActive ? "text-primary" : "text-foreground/55"
                        }`}
                      >
                        {symbol}
                      </span>
                      <span
                        className={`text-[11px] tracking-[0.2em] uppercase font-semibold ${
                          isActive ? "text-primary" : "text-foreground/85"
                        }`}
                      >
                        {p.planet}
                      </span>
                    </div>

                    {/* House number (shown only at first occurrence) */}
                    <div className="w-9 text-right pr-1">
                      {houseNum !== null && (
                        <span className="text-2xl font-light text-foreground/45 leading-none">
                          {houseNum}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* HOUSES vertical label */}
      <div
        className="flex items-center justify-center w-5 shrink-0"
        style={{ writingMode: "vertical-rl" }}
      >
        <span className="text-[9px] tracking-[0.35em] text-muted-foreground font-semibold uppercase">
          HOUSES
        </span>
      </div>
    </div>
  );
}

// ─── CoStar CIRCLE view ───────────────────────────────────────────────────────

function CoStarCircleView({
  placements,
  selected,
  onSelect,
}: {
  placements: Placement[];
  selected: string | null;
  onSelect: (planet: string) => void;
}) {
  const ascDeg = getAscendantDegree(placements);
  const ascSign = placements.find((p) => p.planet === "Ascendant")?.sign ?? "Aries";
  const ascIdx = ZODIAC_ORDER.indexOf(ascSign);

  // Aspect lines: connect every planet pair
  const aspectLines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 0; i < placements.length; i++) {
    for (let j = i + 1; j < placements.length; j++) {
      const a = polar(GLYPH_R - 10, eclipticToSvgAngle(placements[i].degree, ascDeg));
      const b = polar(GLYPH_R - 10, eclipticToSvgAngle(placements[j].degree, ascDeg));
      aspectLines.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
    }
  }

  return (
    <div className="flex justify-center py-2">
      <svg
        viewBox="0 0 320 320"
        width="100%"
        style={{ maxWidth: 320 }}
        aria-label="Natal birth chart wheel"
      >
        {/* ── Outer zodiac ring segments (light fill like CoStar) ── */}
        {ZODIAC_ORDER.map((sign, i) => {
          const offset = (i - ascIdx + 12) % 12;
          const [startDeg, endDeg] = signSegmentAngles(offset);
          const isAsc = sign === ascSign;
          return (
            <path
              key={sign}
              d={sectorPath(startDeg, endDeg, OUTER_R, RING_R)}
              fill={isAsc ? "hsl(var(--foreground) / 0.22)" : "hsl(var(--foreground) / 0.10)"}
              stroke="hsl(var(--foreground) / 0.30)"
              strokeWidth="0.5"
            />
          );
        })}

        {/* ── Sign labels in ring ── */}
        {ZODIAC_ORDER.map((sign, i) => {
          const offset = (i - ascIdx + 12) % 12;
          const centerDeg = 180 - offset * 30 - 15;
          const pos = polar(LABEL_R, centerDeg);
          const rotate = labelRotation(centerDeg);
          return (
            <text
              key={`lbl-${sign}`}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="5.8"
              fill="hsl(var(--foreground) / 0.75)"
              fontFamily="inherit"
              letterSpacing="0.06em"
              transform={`rotate(${rotate}, ${pos.x.toFixed(2)}, ${pos.y.toFixed(2)})`}
            >
              {sign.toUpperCase()}
            </text>
          );
        })}

        {/* ── Divider lines between signs ── */}
        {Array.from({ length: 12 }, (_, i) => {
          const angleDeg = 180 - i * 30;
          const inner = polar(RING_R, angleDeg);
          const outer = polar(OUTER_R, angleDeg);
          return (
            <line
              key={`div-${i}`}
              x1={outer.x.toFixed(2)} y1={outer.y.toFixed(2)}
              x2={inner.x.toFixed(2)} y2={inner.y.toFixed(2)}
              stroke="hsl(var(--foreground) / 0.30)"
              strokeWidth="0.5"
            />
          );
        })}

        {/* ── Dark inner circle ── */}
        <circle
          cx={CX} cy={CY} r={RING_R}
          fill="hsl(var(--background) / 0.96)"
          stroke="hsl(var(--foreground) / 0.25)"
          strokeWidth="0.5"
        />

        {/* ── Aspect lines (very subtle) ── */}
        {aspectLines.map((line, idx) => (
          <line
            key={`asp-${idx}`}
            x1={line.x1.toFixed(2)} y1={line.y1.toFixed(2)}
            x2={line.x2.toFixed(2)} y2={line.y2.toFixed(2)}
            stroke="hsl(var(--foreground) / 0.07)"
            strokeWidth="0.35"
          />
        ))}

        {/* ── Planet glyphs on inner ring boundary ── */}
        {placements.map((p) => {
          const svgAngle = eclipticToSvgAngle(p.degree, ascDeg);
          const pos = polar(GLYPH_R - 8, svgAngle);
          const isActive = selected === p.planet;
          const symbol = p.symbol ?? PLANET_SYMBOLS[p.planet] ?? "✦";

          return (
            <g
              key={`glyph-${p.planet}`}
              onClick={() => onSelect(p.planet)}
              style={{ cursor: "pointer" }}
              role="button"
              aria-label={`${p.planet} in ${p.sign}`}
            >
              {isActive && (
                <circle
                  cx={pos.x} cy={pos.y} r="8"
                  fill="hsl(var(--primary) / 0.20)"
                  stroke="hsl(var(--primary) / 0.55)"
                  strokeWidth="0.6"
                />
              )}
              <text
                x={pos.x} y={pos.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="9"
                fill={isActive ? "hsl(var(--primary))" : "hsl(var(--foreground) / 0.88)"}
                fontFamily="inherit"
                fontWeight={isActive ? "bold" : "normal"}
              >
                {symbol}
              </text>
            </g>
          );
        })}

        {/* ── Centre dot ── */}
        <circle cx={CX} cy={CY} r="2" fill="hsl(var(--primary) / 0.50)" />
      </svg>
    </div>
  );
}

// ─── Planet description card (CoStar-style) ───────────────────────────────────

function PlanetDescriptionCard({
  chart,
  selected,
}: {
  chart: BirthChart;
  selected: string | null;
}) {
  const placement = selected
    ? chart.placements.find((p) => p.planet === selected)
    : null;

  if (!placement) return null;

  const legacyInterp = chart.interpretations?.find((i) => i.planet === placement.planet);
  const description = placement.description ?? legacyInterp?.description ?? "";
  const house = parseHouse(placement.house);

  return (
    <div className="card-cosmic rounded-2xl px-5 pt-5 pb-6 mt-1">
      <h3 className="font-display text-xl font-semibold text-foreground mb-1">
        {placement.planet} in {placement.sign}
      </h3>
      {house !== null && (
        <p className="text-[10px] uppercase tracking-[0.18em] text-primary/60 font-semibold mb-3">
          {ordinal(house)} House
        </p>
      )}
      {description && (
        <p className="text-sm text-foreground/80 leading-relaxed">{description}</p>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function BirthChartContent({
  readingType,
  cacheKey,
  context,
}: {
  readingType: string;
  cacheKey: string;
  context: Record<string, unknown>;
}) {
  const [view, setView] = useState<"table" | "circle">("table");
  const [selected, setSelected] = useState<string | null>(null);

  const { content, isLoading, retry } = useCachedReading({
    readingType,
    cacheKey,
    context,
    enabled: !!cacheKey,
  });

  const chart = parseBirthChart(content);

  // ── No birth data ──
  if (!cacheKey) {
    return (
      <div className="card-cosmic rounded-2xl p-8 text-center mt-4">
        <Star className="w-8 h-8 mx-auto text-primary/40 mb-3" />
        <p className="text-sm text-muted-foreground">
          Add your date of birth in your profile to generate your birth chart.
        </p>
      </div>
    );
  }

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="card-cosmic rounded-2xl p-8 text-center mt-4">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span className="text-sm font-display">Calculating your birth chart…</span>
        </div>
      </div>
    );
  }

  // ── Error / empty ──
  if (!chart || !chart.placements?.length) {
    return (
      <div className="card-cosmic rounded-2xl p-8 text-center mt-4">
        <Star className="w-8 h-8 mx-auto text-primary/40 mb-3" />
        <p className="text-sm text-muted-foreground mb-4">Could not generate birth chart.</p>
        <button
          onClick={retry}
          className="inline-flex items-center gap-1.5 text-xs tracking-widest px-4 py-2 rounded-full border border-primary/40 text-primary hover:border-primary transition-all"
        >
          <RefreshCw className="w-3 h-3" />
          TRY AGAIN
        </button>
      </div>
    );
  }

  const toggle = (planet: string) =>
    setSelected((prev) => (prev === planet ? null : planet));

  return (
    <div className="space-y-3 animate-fade-up">
      {/* ── TABLE | CIRCLE toggle (CoStar style) ── */}
      <div className="flex items-center justify-center gap-5 py-1">
        <button
          onClick={() => setView("table")}
          className={[
            "text-xs tracking-[0.2em] uppercase font-semibold pb-0.5 border-b-2 transition-colors",
            view === "table"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground/70",
          ].join(" ")}
        >
          TABLE
        </button>
        <span className="text-muted-foreground/40 text-sm">|</span>
        <button
          onClick={() => setView("circle")}
          className={[
            "text-xs tracking-[0.2em] uppercase font-semibold pb-0.5 border-b-2 transition-colors",
            view === "circle"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground/70",
          ].join(" ")}
        >
          CIRCLE
        </button>
      </div>

      {/* ── Chart view ── */}
      {view === "table" ? (
        <CoStarTableView
          placements={chart.placements}
          selected={selected}
          onSelect={toggle}
        />
      ) : (
        <div className="card-cosmic rounded-xl p-3">
          <CoStarCircleView
            placements={chart.placements}
            selected={selected}
            onSelect={toggle}
          />
        </div>
      )}

      {/* ── Planet description card ── */}
      <PlanetDescriptionCard chart={chart} selected={selected} />

      {/* ── Overall natal chart interpretation ── */}
      {chart.interpretation && (
        <div className="card-cosmic rounded-2xl px-5 pt-4 pb-5">
          <p className="text-[10px] uppercase tracking-[0.22em] text-primary/60 font-semibold mb-3">
            Your Natal Chart Reading
          </p>
          <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line font-display">
            {chart.interpretation}
          </p>
        </div>
      )}
    </div>
  );
}
