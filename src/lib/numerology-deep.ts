// DCode — Deep Numerology Engine
// Pythagorean system: A=1, B=2, C=3, D=4, E=5, F=6, G=7, H=8, I=9

export interface NumerologyProfile {
  lifePath: number;
  expression: number;
  soulUrge: number;
  personality: number;
  descriptions: {
    lifePath: string;
    expression: string;
    soulUrge: string;
    personality: string;
  };
}

const PYTHAGOREAN: Record<string, number> = {
  A:1, B:2, C:3, D:4, E:5, F:6, G:7, H:8, I:9,
  J:1, K:2, L:3, M:4, N:5, O:6, P:7, Q:8, R:9,
  S:1, T:2, U:3, V:4, W:5, X:6, Y:7, Z:8
};

const VOWELS = new Set(["A","E","I","O","U"]);

function reduce(n: number): number {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = String(n).split("").reduce((a, c) => a + parseInt(c), 0);
  }
  return n;
}

function letterValue(char: string): number {
  return PYTHAGOREAN[char.toUpperCase()] ?? 0;
}

export function getExpression(fullName: string): number {
  const total = fullName.toUpperCase().replace(/[^A-Z]/g, "")
    .split("").reduce((sum, c) => sum + letterValue(c), 0);
  return reduce(total);
}

export function getSoulUrge(fullName: string): number {
  const total = fullName.toUpperCase().replace(/[^A-Z]/g, "")
    .split("").filter(c => VOWELS.has(c))
    .reduce((sum, c) => sum + letterValue(c), 0);
  return reduce(total);
}

export function getPersonality(fullName: string): number {
  const total = fullName.toUpperCase().replace(/[^A-Z]/g, "")
    .split("").filter(c => !VOWELS.has(c))
    .reduce((sum, c) => sum + letterValue(c), 0);
  return reduce(total);
}

export function getLifePath(dob: Date): number {
  const m = dob.getMonth() + 1;
  const d = dob.getDate();
  const y = dob.getFullYear();
  return reduce(m + d + y);
}

const DESCRIPTIONS: Record<number, string> = {
  1: "The Leader — independent, pioneering, driven",
  2: "The Diplomat — cooperative, sensitive, harmonious",
  3: "The Creative — expressive, joyful, communicative",
  4: "The Builder — practical, stable, disciplined",
  5: "The Freedom Seeker — adventurous, versatile, curious",
  6: "The Nurturer — responsible, loving, protective",
  7: "The Seeker — analytical, introspective, spiritual",
  8: "The Achiever — ambitious, powerful, material mastery",
  9: "The Humanitarian — compassionate, wise, universal",
  11: "The Intuitive — highly sensitive, visionary, inspirational",
  22: "The Master Builder — visionary pragmatist, world-scale thinking",
  33: "The Master Teacher — selfless service, spiritual upliftment"
};

export function getNumerologyProfile(fullName: string, dob: Date): NumerologyProfile {
  const lifePath = getLifePath(dob);
  const expression = getExpression(fullName);
  const soulUrge = getSoulUrge(fullName);
  const personality = getPersonality(fullName);

  return {
    lifePath,
    expression,
    soulUrge,
    personality,
    descriptions: {
      lifePath: DESCRIPTIONS[lifePath] ?? "",
      expression: DESCRIPTIONS[expression] ?? "",
      soulUrge: DESCRIPTIONS[soulUrge] ?? "",
      personality: DESCRIPTIONS[personality] ?? ""
    }
  };
}
