// DCode — Daily Numerology Engine
// Universal Day, Personal Day, Life Path, Chinese Zodiac, Cusp, Zodiac from DOB

export function getUniversalDay(date: Date = new Date()): number {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const y = date.getFullYear();
  return reduce(m + d + y);
}

export function getUniversalMonth(date: Date = new Date()): number {
  const m = date.getMonth() + 1;
  const y = date.getFullYear();
  return reduce(m + y);
}

export function getPersonalDay(dob: Date, date: Date = new Date()): number {
  const bm = dob.getMonth() + 1;
  const bd = dob.getDate();
  const universalMonth = getUniversalMonth(date);
  const universalDay = getUniversalDay(date);
  return reduce(bm + bd + universalMonth + universalDay);
}

export function getLifePath(dob: Date): number {
  const m = dob.getMonth() + 1;
  const d = dob.getDate();
  const y = dob.getFullYear();
  return reduce(m + d + y);
}

export function reduce(n: number): number {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = String(n).split("").reduce((a, c) => a + parseInt(c), 0);
  }
  return n;
}

export function getZodiacFromDOB(dob: Date): { sign: string; element: string; cusp: boolean; cuspSign?: string } {
  const m = dob.getMonth() + 1;
  const d = dob.getDate();
  const signs: { sign: string; element: string; from: [number, number]; to: [number, number] }[] = [
    { sign: "Aries",       element: "Fire",  from: [3, 21], to: [4, 19] },
    { sign: "Taurus",      element: "Earth", from: [4, 20], to: [5, 20] },
    { sign: "Gemini",      element: "Air",   from: [5, 21], to: [6, 20] },
    { sign: "Cancer",      element: "Water", from: [6, 21], to: [7, 22] },
    { sign: "Leo",         element: "Fire",  from: [7, 23], to: [8, 22] },
    { sign: "Virgo",       element: "Earth", from: [8, 23], to: [9, 22] },
    { sign: "Libra",       element: "Air",   from: [9, 23], to: [10, 22] },
    { sign: "Scorpio",     element: "Water", from: [10, 23], to: [11, 21] },
    { sign: "Sagittarius", element: "Fire",  from: [11, 22], to: [12, 21] },
    { sign: "Capricorn",   element: "Earth", from: [12, 22], to: [1, 19] },
    { sign: "Aquarius",    element: "Air",   from: [1, 20], to: [2, 18] },
    { sign: "Pisces",      element: "Water", from: [2, 19], to: [3, 20] },
  ];

  const mmdd = m * 100 + d;

  let matched = signs.find(s => {
    const from = s.from[0] * 100 + s.from[1];
    const to = s.to[0] * 100 + s.to[1];
    if (from <= to) return mmdd >= from && mmdd <= to;
    return mmdd >= from || mmdd <= to;
  }) ?? { sign: "Aquarius", element: "Air" };

  const cuspRange = 3;
  let cusp = false;
  let cuspSign: string | undefined;
  for (let i = 0; i < signs.length; i++) {
    const boundary = signs[i].from[0] * 100 + signs[i].from[1];
    const diff = Math.abs(mmdd - boundary);
    if (diff <= cuspRange) {
      cusp = true;
      const prev = signs[(i - 1 + signs.length) % signs.length];
      cuspSign = `${prev.sign}-${signs[i].sign} Cusp`;
      break;
    }
  }

  return { sign: matched.sign, element: matched.element, cusp, cuspSign };
}

export function getChineseZodiac(year: number): string {
  const animals = ["Rat","Ox","Tiger","Rabbit","Dragon","Snake","Horse","Goat","Monkey","Rooster","Dog","Pig"];
  return animals[(year - 1900) % 12];
}

export function formatDate(date: Date = new Date()): string {
  return date.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}
