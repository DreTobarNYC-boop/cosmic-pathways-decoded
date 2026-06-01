/**
 * NatalChartWheel — SVG natal chart in DCode's gold-on-dark palette.
 * Pure SVG, no API calls, no side effects, no external dependencies.
 * Safe to add/remove without affecting any other chamber.
 */
import { useMemo } from "react";
import type { NatalChart } from "@/lib/natal-chart";

// ── Constants ──────────────────────────────────────────────────────────────

const SIGN_INDEX: Record<string, number> = {
  Aries: 0, Taurus: 1, Gemini: 2, Cancer: 3, Leo: 4, Virgo: 5,
  Libra: 6, Scorpio: 7, Sagittarius: 8, Capricorn: 9, Aquarius: 10, Pisces: 11,
};

const ZODIAC_GLYPHS = ["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"] as const;

const PLANETS = [
  { key: "sun",     glyph: "☉", label: "Sun",     color: "#C5A059" },
  { key: "moon",    glyph: "☽", label: "Moon",    color: "#E8DFC8" },
  { key: "mercury", glyph: "☿", label: "Mercury", color: "#88C0D0" },
  { key: "venus",   glyph: "♀", label: "Venus",   color: "#DFAAC0" },
  { key: "mars",    glyph: "♂", label: "Mars",    color: "#E07868" },
] as const;

type PlanetKey = typeof PLANETS[number]["key"];

type AspectType = "conjunction" | "sextile" | "square" | "trine" | "opposition";

const ASPECT_COLORS: Record<AspectType, string> = {
  conjunction: "#C5A059",
  sextile:     "#88C0D0",
  trine:       "#88C0D0",
  square:      "#E07868",
  opposition:  "#E07868",
};

// SVG dimensions
const CX = 160, CY = 160;
const R_OUTER = 148; // outer edge of zodiac ring
const R_ZODIAC = 126; // inner edge of zodiac ring / chart outer boundary
const R_PLANET = 104; // planet glyph placement radius
const R_ASPECT  =  80; // aspect line endpoints
const R_INNER   =  20; // tiny center circle

// ── Math helpers ───────────────────────────────────────────────────────────

/** Convert sign + degree to ecliptic longitude 0–360° */
function eclipticLong(sign: string, degree: number): number {
  return (SIGN_INDEX[sign] ?? 0) * 30 + degree;
}

/**
 * Convert ecliptic longitude to SVG x,y.
 * Aries 0° = 9-o'clock (180° in SVG), increasing counterclockwise.
 * Formula: svgAngle = 180 - eclipticLongitude
 */
function toXY(r: number, eclLong: number): [number, number] {
  const rad = ((180 - eclLong) * Math.PI) / 180;
  return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)];
}

/** Detect major aspect between two ecliptic longitudes */
function detectAspect(a: number, b: number): AspectType | null {
  let diff = Math.abs(a - b) % 360;
  if (diff > 180) diff = 360 - diff;
  if (diff <= 10)                  return "conjunction";
  if (Math.abs(diff - 60)  <= 6)  return "sextile";
  if (Math.abs(diff - 90)  <= 8)  return "square";
  if (Math.abs(diff - 120) <= 8)  return "trine";
  if (Math.abs(diff - 180) <= 10) return "opposition";
  return null;
}

// ── Component ──────────────────────────────────────────────────────────────

interface Props {
  natal: NatalChart;
}

export function NatalChartWheel({ natal }: Props) {
  // Compute planet positions
  const planets = useMemo(() =>
    PLANETS.map(p => {
      const data = natal[p.key as PlanetKey];
      const long = eclipticLong(data.sign, data.degree);
      const [px, py]   = toXY(R_PLANET, long);
      const [ax, ay]   = toXY(R_ASPECT, long);
      const [dotX, dotY] = toXY(R_PLANET + 14, long); // label dot slightly outside glyph
      return { ...p, long, px, py, ax, ay, dotX, dotY, sign: data.sign, degree: data.degree };
    }),
  [natal]);

  // Detect aspects between all planet pairs
  const aspects = useMemo(() => {
    const result: Array<{ x1: number; y1: number; x2: number; y2: number; type: AspectType }> = [];
    for (let i = 0; i < planets.length; i++) {
      for (let j = i + 1; j < planets.length; j++) {
        const type = detectAspect(planets[i].long, planets[j].long);
        if (type) {
          result.push({
            x1: planets[i].ax, y1: planets[i].ay,
            x2: planets[j].ax, y2: planets[j].ay,
            type,
          });
        }
      }
    }
    return result;
  }, [planets]);

  return (
    <div className="flex flex-col items-center gap-3 mb-4">
      <svg
        viewBox="0 0 320 320"
        className="w-full max-w-[300px]"
        aria-label="Natal chart wheel"
        style={{ overflow: "visible" }}
      >
        <defs>
          {/* Radial background gradient */}
          <radialGradient id="ncw-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#112020" />
            <stop offset="100%" stopColor="#070f0f" />
          </radialGradient>

          {/* Glow filter for planet symbols */}
          <filter id="ncw-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── Background ──────────────────────────────── */}
        <circle cx={CX} cy={CY} r={R_OUTER} fill="url(#ncw-bg)" />

        {/* ── Structural rings ─────────────────────────── */}
        <circle cx={CX} cy={CY} r={R_OUTER}  fill="none" stroke="#C5A059" strokeWidth={1}    strokeOpacity={0.35} />
        <circle cx={CX} cy={CY} r={R_ZODIAC} fill="none" stroke="#C5A059" strokeWidth={0.75} strokeOpacity={0.25} />
        <circle cx={CX} cy={CY} r={R_ASPECT} fill="none" stroke="#C5A059" strokeWidth={0.4}  strokeOpacity={0.12} />

        {/* ── Zodiac ring: 12 sign segments ────────────── */}
        {ZODIAC_GLYPHS.map((glyph, i) => {
          const divLong          = i * 30;
          const [lx1, ly1]       = toXY(R_ZODIAC, divLong);
          const [lx2, ly2]       = toXY(R_OUTER,  divLong);
          const midLong          = i * 30 + 15;
          const [gx, gy]         = toXY((R_ZODIAC + R_OUTER) / 2, midLong);
          const isOdd            = i % 2 === 1;
          return (
            <g key={glyph + i}>
              {/* Subtle alternating fill for readability */}
              {isOdd && (() => {
                const [ax, ay] = toXY(R_ZODIAC, i * 30);
                const [bx, by] = toXY(R_OUTER,  i * 30);
                const [cx2, cy2] = toXY(R_OUTER,  (i + 1) * 30);
                const [dx, dy]   = toXY(R_ZODIAC, (i + 1) * 30);
                // We use a thin arc band — approximate with a polygon for simplicity
                void [ax, ay, bx, by, cx2, cy2, dx, dy];
                return null;
              })()}

              {/* Divider between signs */}
              <line
                x1={lx1} y1={ly1} x2={lx2} y2={ly2}
                stroke="#C5A059" strokeWidth={0.5} strokeOpacity={0.4}
              />

              {/* Zodiac glyph */}
              <text
                x={gx} y={gy}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={9}
                fill="#FFFDD0"
                fillOpacity={0.55}
              >
                {glyph}
              </text>
            </g>
          );
        })}

        {/* ── House spokes (12 equal, subtle) ──────────── */}
        {Array.from({ length: 12 }, (_, i) => {
          const [hx, hy] = toXY(R_ZODIAC, i * 30);
          return (
            <line key={`house-${i}`}
              x1={CX} y1={CY} x2={hx} y2={hy}
              stroke="#C5A059" strokeWidth={0.35} strokeOpacity={0.13}
            />
          );
        })}

        {/* ── Aspect lines ─────────────────────────────── */}
        {aspects.map((a, i) => (
          <line key={`asp-${i}`}
            x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2}
            stroke={ASPECT_COLORS[a.type]}
            strokeWidth={0.85}
            strokeOpacity={0.45}
          />
        ))}

        {/* ── Planet glyphs ────────────────────────────── */}
        {planets.map(p => (
          <text
            key={p.key}
            x={p.px} y={p.py}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={15}
            fill={p.color}
            filter="url(#ncw-glow)"
            style={{ fontFamily: "serif", fontWeight: "bold" }}
          >
            {p.glyph}
          </text>
        ))}

        {/* ── Center point ─────────────────────────────── */}
        <circle cx={CX} cy={CY} r={2.5}        fill="#C5A059" fillOpacity={0.9} />
        <circle cx={CX} cy={CY} r={R_INNER / 2} fill="none" stroke="#C5A059" strokeWidth={0.5} strokeOpacity={0.3} />
      </svg>

      {/* Planet legend */}
      <div className="flex items-center gap-3 flex-wrap justify-center">
        {PLANETS.map(p => (
          <span key={p.key} className="flex items-center gap-1 text-[10px] tracking-wide">
            <span style={{ color: p.color, fontFamily: "serif", fontSize: 13 }}>{p.glyph}</span>
            <span style={{ color: "#FFFDD0", opacity: 0.5 }}>{p.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
