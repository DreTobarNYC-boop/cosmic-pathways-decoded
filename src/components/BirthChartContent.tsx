import { useState } from "react";
import { Loader2, Star } from "lucide-react";
import { useCachedReading } from "@/hooks/use-cached-reading";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Placement {
  planet: string;
  symbol: string;
  sign: string;
  house: number | null;
  degree: number;
}

interface Interpretation {
  planet: string;
  sign: string;
  house: number | null;
  title: string;
  description: string;
}

interface BirthChart {
  placements: Placement[];
  interpretations: Interpretation[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ZODIAC_ORDER = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

const SIGN_ABBR: Record<string, string> = {
  Aries: "ARI", Taurus: "TAU", Gemini: "GEM", Cancer: "CAN",
  Leo: "LEO", Virgo: "VIR", Libra: "LIB", Scorpio: "SCO",
  Sagittarius: "SAG", Capricorn: "CAP", Aquarius: "AQU", Pisces: "PIS",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseBirthChart(raw: string | null): BirthChart | null {
  if (!raw) return null;
  try {
    const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(cleaned);
    if (
      Array.isArray(parsed.placements) &&
      parsed.placements.length > 0 &&
      Array.isArray(parsed.interpretations) &&
      parsed.interpretations.length > 0 &&
      parsed.placements.every(
        (p: unknown) =>
          p !== null &&
          typeof p === "object" &&
          typeof (p as Record<string, unknown>).planet === "string" &&
          typeof (p as Record<string, unknown>).sign === "string",
      )
    ) {
      return parsed as BirthChart;
    }
    return null;
  } catch {
    return null;
  }
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

// ─── SVG Zodiac Wheel helpers ─────────────────────────────────────────────────

const CX = 160;
const CY = 160;
const OUTER_R = 148;
const RING_R  = 110;
const INNER_R =  76;
const LABEL_R = 130;
const PLANET_R     = 122;
// How far inward from PLANET_R to render the planet glyph center
const PLANET_OFFSET = 14;

function toRad(deg: number) { return (deg * Math.PI) / 180; }

function polar(r: number, angleDeg: number) {
  return {
    x: CX + r * Math.cos(toRad(angleDeg)),
    y: CY + r * Math.sin(toRad(angleDeg)),
  };
}

// Sector path: outer arc CCW (sweep=0) then inner arc CW (sweep=1) back
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

// Converts an ecliptic longitude (0–359°, 0=Aries) to an SVG angle.
// The Ascendant (ascDeg) is pinned at 180° (9-o'clock). Signs run
// counter-clockwise from the Ascendant, so each additional ecliptic
// degree DECREASES the SVG angle by one degree.
function eclipticToSvgAngle(eclipticDeg: number, ascDeg: number): number {
  return 180 - ((eclipticDeg - ascDeg + 360) % 360);
}

// For sign i (0 = Ascendant's sign) the segment starts at 180 - i*30 and ends at 180 - (i+1)*30
function signSegmentAngles(signOffset: number): [number, number] {
  const start = 180 - signOffset * 30;
  const end   = 180 - (signOffset + 1) * 30;
  return [start, end];
}

function getAscendantDegree(placements: Placement[]): number {
  const asc = placements.find((p) => p.planet === "Ascendant");
  return asc ? asc.degree : 0;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TableView({
  placements,
  onSelect,
  selected,
}: {
  placements: Placement[];
  onSelect: (planet: string) => void;
  selected: string | null;
}) {
  return (
    <div className="card-cosmic rounded-xl overflow-hidden">
      {/* Column headers */}
      <div className="grid grid-cols-[1fr_auto_auto] px-4 py-2.5 border-b border-border/30">
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
          Planet
        </span>
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold w-28 text-center">
          Sign
        </span>
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold w-14 text-right">
          House
        </span>
      </div>

      {/* Rows */}
      {placements.map((p) => {
        const isActive = selected === p.planet;
        return (
          <button
            key={p.planet}
            onClick={() => onSelect(p.planet)}
            className={[
              "grid grid-cols-[1fr_auto_auto] w-full px-4 py-3 border-b border-border/20",
              "text-left transition-colors",
              isActive
                ? "bg-primary/10"
                : "hover:bg-primary/5",
            ].join(" ")}
          >
            {/* Planet symbol + name */}
            <span className="flex items-center gap-2.5">
              <span
                className={`text-lg leading-none w-5 text-center ${isActive ? "text-primary" : "text-primary/70"}`}
              >
                {p.symbol}
              </span>
              <span
                className={`text-sm font-display tracking-wide ${isActive ? "text-foreground" : "text-foreground/80"}`}
              >
                {p.planet}
              </span>
            </span>

            {/* Sign */}
            <span className="w-28 text-center text-sm text-muted-foreground font-display">
              {p.sign}
            </span>

            {/* House */}
            <span className="w-14 text-right font-display text-sm text-foreground/60">
              {p.house != null ? ordinal(p.house) : "—"}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ChartView({
  placements,
  onSelect,
  selected,
}: {
  placements: Placement[];
  onSelect: (planet: string) => void;
  selected: string | null;
}) {
  const ascDeg = getAscendantDegree(placements);
  const ascSign = placements.find((p) => p.planet === "Ascendant")?.sign ?? "Aries";
  const ascIdx = ZODIAC_ORDER.indexOf(ascSign);

  return (
    <div className="flex justify-center py-2">
      <svg
        viewBox="0 0 320 320"
        width="100%"
        style={{ maxWidth: 320 }}
        aria-label="Natal birth chart wheel"
      >
        {/* ── Zodiac ring segments ── */}
        {ZODIAC_ORDER.map((sign, i) => {
          const offset = (i - ascIdx + 12) % 12;
          const [startDeg, endDeg] = signSegmentAngles(offset);
          const isAsc = sign === ascSign;
          return (
            <path
              key={sign}
              d={sectorPath(startDeg, endDeg, OUTER_R, RING_R)}
              fill={isAsc ? "hsl(var(--primary) / 0.08)" : "hsl(var(--card) / 0.6)"}
              stroke="hsl(var(--copper) / 0.35)"
              strokeWidth="0.6"
            />
          );
        })}

        {/* ── Sign labels ── */}
        {ZODIAC_ORDER.map((sign, i) => {
          const offset = (i - ascIdx + 12) % 12;
          const centerDeg = 180 - offset * 30 - 15;
          const pos = polar(LABEL_R, centerDeg);
          return (
            <text
              key={`label-${sign}`}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="7"
              fill="hsl(var(--foreground) / 0.55)"
              fontFamily="inherit"
              letterSpacing="0.04em"
              transform={`rotate(${centerDeg - 180}, ${pos.x}, ${pos.y})`}
            >
              {SIGN_ABBR[sign] ?? sign.slice(0, 3).toUpperCase()}
            </text>
          );
        })}

        {/* ── House dividers (12 thin lines from inner to ring) ── */}
        {Array.from({ length: 12 }, (_, i) => {
          const angleDeg = 180 - i * 30;
          const inner = polar(INNER_R, angleDeg);
          const ring  = polar(RING_R,  angleDeg);
          return (
            <line
              key={`div-${i}`}
              x1={inner.x.toFixed(2)}
              y1={inner.y.toFixed(2)}
              x2={ring.x.toFixed(2)}
              y2={ring.y.toFixed(2)}
              stroke="hsl(var(--copper) / 0.25)"
              strokeWidth="0.5"
            />
          );
        })}

        {/* ── Inner circle (houses area) ── */}
        <circle
          cx={CX}
          cy={CY}
          r={INNER_R}
          fill="hsl(var(--cosmic-bg) / 0.9)"
          stroke="hsl(var(--copper) / 0.3)"
          strokeWidth="0.6"
        />

        {/* ── House numbers (1–12) inside inner circle ── */}
        {Array.from({ length: 12 }, (_, i) => {
          const houseAngle = 180 - i * 30 - 15;
          const pos = polar(INNER_R - 16, houseAngle);
          return (
            <text
              key={`house-${i}`}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="6"
              fill="hsl(var(--muted-foreground) / 0.5)"
              fontFamily="serif"
            >
              {i + 1}
            </text>
          );
        })}

        {/* ── Planet symbols ── */}
        {placements.map((p) => {
          const svgAngle = eclipticToSvgAngle(p.degree, ascDeg);
          const pos = polar(PLANET_R - PLANET_OFFSET, svgAngle);
          const isActive = selected === p.planet;

          // Clamp positions inside planet ring
          return (
            <g
              key={`planet-${p.planet}`}
              onClick={() => onSelect(p.planet)}
              style={{ cursor: "pointer" }}
              role="button"
              aria-label={`${p.planet} in ${p.sign}`}
            >
              {/* Highlight dot */}
              {isActive && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="8"
                  fill="hsl(var(--primary) / 0.2)"
                  stroke="hsl(var(--primary) / 0.6)"
                  strokeWidth="0.6"
                />
              )}
              <text
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="9"
                fill={isActive ? "hsl(var(--primary))" : "hsl(var(--foreground) / 0.85)"}
                fontFamily="inherit"
                fontWeight={isActive ? "bold" : "normal"}
              >
                {p.symbol}
              </text>
            </g>
          );
        })}

        {/* ── Center dot ── */}
        <circle cx={CX} cy={CY} r="2" fill="hsl(var(--primary) / 0.5)" />
      </svg>
    </div>
  );
}

function InsightCards({
  interpretations,
  selected,
  onSelect,
}: {
  interpretations: Interpretation[];
  selected: string | null;
  onSelect: (planet: string) => void;
}) {
  return (
    <div className="space-y-3">
      {interpretations.map((interp) => {
        const isActive = selected === interp.planet;
        return (
          <Card
            key={interp.planet}
            onClick={() => onSelect(interp.planet)}
            className={[
              "cursor-pointer transition-all border-border/30 bg-card/30 backdrop-blur-sm",
              isActive ? "border-primary/50 ring-1 ring-primary/20" : "hover:border-border/60",
            ].join(" ")}
          >
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-base font-display font-semibold text-foreground/90 leading-snug">
                {interp.title}
              </CardTitle>
              {interp.house != null && (
                <p className="text-[10px] uppercase tracking-[0.15em] text-primary/60 font-semibold mt-0.5">
                  {interp.sign} · {ordinal(interp.house)} House
                </p>
              )}
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <p className="text-sm text-foreground/75 leading-relaxed font-display">
                {interp.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
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
  const [selected, setSelected] = useState<string | null>(null);

  const { content, isLoading } = useCachedReading({
    readingType,
    cacheKey,
    context,
    fallback: undefined,
  });

  const chart = parseBirthChart(content);

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
        <p className="text-sm text-muted-foreground">Could not generate birth chart. Try again.</p>
      </div>
    );
  }

  const toggle = (planet: string) =>
    setSelected((prev) => (prev === planet ? null : planet));

  return (
    <div className="space-y-4 animate-fade-up">
      {/* ── TABLE / CHART toggle ── */}
      <Tabs defaultValue="table" className="w-full">
        <TabsList className="w-full grid grid-cols-2 bg-card/40 border border-border/30 h-9">
          <TabsTrigger
            value="table"
            className="text-xs tracking-[0.12em] uppercase font-semibold data-[state=active]:bg-primary/15 data-[state=active]:text-primary"
          >
            Table
          </TabsTrigger>
          <TabsTrigger
            value="chart"
            className="text-xs tracking-[0.12em] uppercase font-semibold data-[state=active]:bg-primary/15 data-[state=active]:text-primary"
          >
            Circle
          </TabsTrigger>
        </TabsList>

        {/* ── TABLE VIEW ── */}
        <TabsContent value="table" className="mt-3">
          <TableView
            placements={chart.placements}
            onSelect={toggle}
            selected={selected}
          />
        </TabsContent>

        {/* ── CHART VIEW ── */}
        <TabsContent value="chart" className="mt-3">
          <div className="card-cosmic rounded-xl p-3">
            <ChartView
              placements={chart.placements}
              onSelect={toggle}
              selected={selected}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* ── INSIGHT CARDS (always visible below the toggle view) ── */}
      {chart.interpretations?.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold px-1 mb-3">
            Planetary Insights
          </p>
          <ScrollArea className="h-[30rem] pr-1">
            <InsightCards
              interpretations={chart.interpretations}
              selected={selected}
              onSelect={toggle}
            />
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

