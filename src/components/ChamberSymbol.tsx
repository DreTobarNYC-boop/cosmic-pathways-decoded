/**
 * ChamberSymbol — premium gold line-art symbols for each chamber.
 * Replaces the flat colored-square icons with mystical, on-brand graphics
 * that match the DCode mandala aesthetic.
 */

const GOLD = "#C5A059";

interface SymbolProps {
  size?: number;
  color?: string;
}

/** ☉ The Stars — a radiant sun/star with an orbital ring */
function StarsSymbol({ size = 28, color = GOLD }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <ellipse cx="24" cy="24" rx="20" ry="9" stroke={color} strokeOpacity="0.4" strokeWidth="1" transform="rotate(-20 24 24)" />
      <circle cx="24" cy="24" r="6.5" stroke={color} strokeWidth="1.5" />
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i * Math.PI) / 4;
        const x1 = 24 + Math.cos(a) * 9, y1 = 24 + Math.sin(a) * 9;
        const x2 = 24 + Math.cos(a) * 13, y2 = 24 + Math.sin(a) * 13;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="1.4" strokeLinecap="round" />;
      })}
      <circle cx="24" cy="24" r="2" fill={color} />
    </svg>
  );
}

/** # The Numbers — sacred geometry: circle, triangle, orbiting dots */
function NumbersSymbol({ size = 28, color = GOLD }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="15" stroke={color} strokeOpacity="0.4" strokeWidth="1" />
      <path d="M24 11 L36 31 L12 31 Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="24" cy="24" r="4" stroke={color} strokeWidth="1.4" />
      <circle cx="24" cy="11" r="1.6" fill={color} />
      <circle cx="36" cy="31" r="1.6" fill={color} />
      <circle cx="12" cy="31" r="1.6" fill={color} />
    </svg>
  );
}

/** ✋ The Palm — a hand with reading lines */
function PalmSymbol({ size = 28, color = GOLD }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {/* palm + fingers silhouette */}
      <path
        d="M16 34 V22 M20 34 V16 M24 34 V14 M28 34 V17 M32 33 V21
           M16 34 c0 5 4 8 8 8 s8-3 8-8"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* palm lines */}
      <path d="M18 27 q6 3 12 0" stroke={color} strokeOpacity="0.6" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M19 31 q5 2 9 0" stroke={color} strokeOpacity="0.45" strokeWidth="1.1" strokeLinecap="round" />
      <circle cx="24" cy="29" r="1.3" fill={color} />
    </svg>
  );
}

/** 龍 The Dynasty — a Chinese coin (circle with square center) */
function DynastySymbol({ size = 28, color = GOLD }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="15" stroke={color} strokeWidth="1.5" />
      <circle cx="24" cy="24" r="11.5" stroke={color} strokeOpacity="0.4" strokeWidth="1" />
      <rect x="18.5" y="18.5" width="11" height="11" stroke={color} strokeWidth="1.5" />
      {/* four cardinal ticks */}
      <line x1="24" y1="9" x2="24" y2="13" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      <line x1="24" y1="35" x2="24" y2="39" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      <line x1="9" y1="24" x2="13" y2="24" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      <line x1="35" y1="24" x2="39" y2="24" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

/** 👁 The Oracle — an all-seeing eye within a triangle */
function OracleSymbol({ size = 28, color = GOLD }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M24 9 L40 37 L8 37 Z" stroke={color} strokeOpacity="0.45" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M14 27 q10 -10 20 0 q-10 10 -20 0 Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="24" cy="27" r="3.4" stroke={color} strokeWidth="1.4" />
      <circle cx="24" cy="27" r="1.3" fill={color} />
      {/* rays above */}
      <line x1="24" y1="13" x2="24" y2="16" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

const SYMBOLS: Record<string, (p: SymbolProps) => JSX.Element> = {
  stars: StarsSymbol,
  numbers: NumbersSymbol,
  palm: PalmSymbol,
  "palm-cta": PalmSymbol,
  dynasty: DynastySymbol,
  oracle: OracleSymbol,
};

export function ChamberSymbol({ id, size, color }: { id: string; size?: number; color?: string }) {
  const Symbol = SYMBOLS[id] ?? StarsSymbol;
  return <Symbol size={size} color={color} />;
}

export function hasChamberSymbol(id: string): boolean {
  return id in SYMBOLS;
}
