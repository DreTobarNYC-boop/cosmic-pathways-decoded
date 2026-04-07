// Zodiac sign calculation from DOB
const ZODIAC_SIGNS = [
  { sign: "Capricorn", symbol: "♑", element: "Earth", start: [12, 22], end: [1, 19] },
  { sign: "Aquarius", symbol: "♒", element: "Air", start: [1, 20], end: [2, 18] },
  { sign: "Pisces", symbol: "♓", element: "Water", start: [2, 19], end: [3, 20] },
  { sign: "Aries", symbol: "♈", element: "Fire", start: [3, 21], end: [4, 19] },
  { sign: "Taurus", symbol: "♉", element: "Earth", start: [4, 20], end: [5, 20] },
  { sign: "Gemini", symbol: "♊", element: "Air", start: [5, 21], end: [6, 20] },
  { sign: "Cancer", symbol: "♋", element: "Water", start: [6, 21], end: [7, 22] },
  { sign: "Leo", symbol: "♌", element: "Fire", start: [7, 23], end: [8, 22] },
  { sign: "Virgo", symbol: "♍", element: "Earth", start: [8, 23], end: [9, 22] },
  { sign: "Libra", symbol: "♎", element: "Air", start: [9, 23], end: [10, 22] },
  { sign: "Scorpio", symbol: "♏", element: "Water", start: [10, 23], end: [11, 21] },
  { sign: "Sagittarius", symbol: "♐", element: "Fire", start: [11, 22], end: [12, 21] },
] as const;

const CUSP_RANGE = 3; // days from boundary to be considered "on the cusp"

export function getZodiacSign(month: number, day: number) {
  for (const z of ZODIAC_SIGNS) {
    const [sm, sd] = z.start;
    const [em, ed] = z.end;
    if (sm === em) {
      if (month === sm && day >= sd && day <= ed) return z;
    } else if (sm > em) {
      // Capricorn wraps year
      if ((month === sm && day >= sd) || (month === em && day <= ed)) return z;
    } else {
      if ((month === sm && day >= sd) || (month === em && day <= ed)) return z;
    }
  }
  return ZODIAC_SIGNS[0]; // fallback
}

export function getZodiacFromDOB(dob: Date) {
  return getZodiacSign(dob.getMonth() + 1, dob.getDate());
}

/** Detect if a date falls on a cusp and return cusp info */
export function getCuspInfo(month: number, day: number): { onCusp: boolean; cuspSign?: string; cuspDescription?: string } {
  const primary = getZodiacSign(month, day);
  
  for (let i = 0; i < ZODIAC_SIGNS.length; i++) {
    const z = ZODIAC_SIGNS[i];
    const [em, ed] = z.end;
    const nextIdx = (i + 1) % ZODIAC_SIGNS.length;
    const next = ZODIAC_SIGNS[nextIdx];
    
    // Check if near the END of this sign (within CUSP_RANGE days)
    if (month === em && day >= ed - CUSP_RANGE + 1 && day <= ed) {
      if (primary.sign === z.sign) {
        return {
          onCusp: true,
          cuspSign: next.sign,
          cuspDescription: `${z.sign}-${next.sign} cusp (cusp of ${getCuspName(z.sign, next.sign)})`,
        };
      }
    }
    
    // Check if near the START of next sign (within CUSP_RANGE days)
    const [sm, sd] = next.start;
    if (month === sm && day >= sd && day <= sd + CUSP_RANGE - 1) {
      if (primary.sign === next.sign) {
        return {
          onCusp: true,
          cuspSign: z.sign,
          cuspDescription: `${z.sign}-${next.sign} cusp (cusp of ${getCuspName(z.sign, next.sign)})`,
        };
      }
    }
  }
  
  return { onCusp: false };
}

function getCuspName(sign1: string, sign2: string): string {
  const cuspNames: Record<string, string> = {
    "Capricorn-Aquarius": "Mystery & Imagination",
    "Aquarius-Pisces": "Sensitivity",
    "Pisces-Aries": "Rebirth",
    "Aries-Taurus": "Power",
    "Taurus-Gemini": "Energy",
    "Gemini-Cancer": "Magic",
    "Cancer-Leo": "Oscillation",
    "Leo-Virgo": "Exposure",
    "Virgo-Libra": "Beauty",
    "Libra-Scorpio": "Drama & Criticism",
    "Scorpio-Sagittarius": "Revolution",
    "Sagittarius-Capricorn": "Prophecy",
  };
  return cuspNames[`${sign1}-${sign2}`] || "Transition";
}

// Reduce a number to a single digit (or master number 11, 22, 33)
export function reduceToSingle(n: number): number {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = String(n).split('').reduce((s, d) => s + parseInt(d), 0);
  }
  return n;
}

// Life Path number from DOB
export function getLifePath(dob: Date): number {
  const d = dob.getDate();
  const m = dob.getMonth() + 1;
  const y = dob.getFullYear();
  const sum = reduceToSingle(d) + reduceToSingle(m) + reduceToSingle(
    String(y).split('').reduce((s, digit) => s + parseInt(digit), 0)
  );
  return reduceToSingle(sum);
}

// Universal Day Number
export function getUniversalDay(date: Date = new Date()): number {
  const d = date.getDate();
  const m = date.getMonth() + 1;
  const y = date.getFullYear();
  return reduceToSingle(d + m + y);
}

// Personal Day Number
export function getPersonalDay(dob: Date, date: Date = new Date()): number {
  const personalYear = reduceToSingle(
    (dob.getMonth() + 1) + dob.getDate() + date.getFullYear()
  );
  const personalMonth = reduceToSingle(personalYear + (date.getMonth() + 1));
  return reduceToSingle(personalMonth + date.getDate());
}

// Chinese zodiac
const CHINESE_ANIMALS = [
  "Rat", "Ox", "Tiger", "Rabbit", "Dragon", "Snake",
  "Horse", "Goat", "Monkey", "Rooster", "Dog", "Pig"
] as const;

export function getChineseZodiac(year: number) {
  const index = (year - 4) % 12;
  return CHINESE_ANIMALS[index >= 0 ? index : index + 12];
}

// Number meanings
export const UNIVERSAL_DAY_MEANINGS: Record<number, string> = {
  1: "New beginnings & initiative",
  2: "Cooperation & balance",
  3: "Creativity & self-expression",
  4: "Foundation & discipline",
  5: "Change & freedom",
  6: "Harmony & responsibility",
  7: "Reflection & inner wisdom",
  8: "Power & abundance",
  9: "Completion & humanitarianism",
  11: "Spiritual insight & intuition",
  22: "Master builder energy",
  33: "Master teacher vibration",
};

export const PERSONAL_DAY_MEANINGS: Record<number, string> = {
  1: "Your personal power peaks — initiate boldly",
  2: "Seek partnerships and listen deeply",
  3: "Express yourself — creativity flows freely",
  4: "Build structures that support your vision",
  5: "Embrace the unexpected — adventure calls",
  6: "Nurture your closest relationships",
  7: "Retreat inward — meditation reveals answers",
  8: "Financial and career energy is amplified",
  9: "Release what no longer serves your evolution",
  11: "Heightened intuition — trust your visions",
  22: "Manifest your grandest ambitions today",
  33: "Your compassion transforms those around you",
};

const LOCALE_MAP: Record<string, string> = {
  en: "en-US",
  es: "es-ES",
  "pt-BR": "pt-BR",
  pt: "pt-BR",
};

export function formatDate(date: Date = new Date(), lang?: string): string {
  const locale = lang ? (LOCALE_MAP[lang] || lang) : "en-US";
  return date.toLocaleDateString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
