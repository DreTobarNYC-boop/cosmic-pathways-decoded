// DCode — Natal Chart Engine
// Real ephemeris-based planet position calculator

export interface PlanetPosition {
  sign: string;
  degree: number;
  house: number;
}

export interface NatalChart {
  sun: PlanetPosition;
  moon: PlanetPosition;
  mercury: PlanetPosition;
  venus: PlanetPosition;
  mars: PlanetPosition;
  formatted: string;
}

const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

const SYMBOLS: Record<string, string> = {
  sun: "☉", moon: "☽", mercury: "☿", venus: "♀", mars: "♂"
};

function toJulianDay(date: Date): number {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate() + date.getUTCHours() / 24;
  const A = Math.floor((14 - m) / 12);
  const Y = y + 4800 - A;
  const M = m + 12 * A - 3;
  return d + Math.floor((153 * M + 2) / 5) + 365 * Y +
    Math.floor(Y / 4) - Math.floor(Y / 100) + Math.floor(Y / 400) - 32045;
}

function normalizeAngle(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

function longitudeToSign(longitude: number): { sign: string; degree: number } {
  const norm = normalizeAngle(longitude);
  const index = Math.floor(norm / 30);
  const degree = Math.round(norm % 30);
  return { sign: SIGNS[index], degree };
}

function getSunLongitude(jd: number): number {
  const n = jd - 2451545.0;
  const L = normalizeAngle(280.46646 + 0.9856474 * n);
  const M = normalizeAngle(357.52911 + 0.98560028 * n) * (Math.PI / 180);
  const C = (1.914602 - 0.004817 * n / 36525) * Math.sin(M)
    + 0.019993 * Math.sin(2 * M)
    + 0.000289 * Math.sin(3 * M);
  return normalizeAngle(L + C);
}

function getMoonLongitude(jd: number): number {
  const n = jd - 2451545.0;
  const L = normalizeAngle(218.3165 + 13.1763966 * n);
  const M = normalizeAngle(134.9634 + 13.0649929 * n) * (Math.PI / 180);
  const F = normalizeAngle(93.2721 + 13.2299927 * n) * (Math.PI / 180);
  const D = normalizeAngle(297.8502 + 12.1900933 * n) * (Math.PI / 180);
  const lon = L
    + 6.2886 * Math.sin(M)
    - 1.2740 * Math.sin(2 * D - M)
    + 0.6583 * Math.sin(2 * D)
    - 0.2136 * Math.sin(2 * M)
    + 0.1851 * Math.sin(2 * D + M)
    - 0.1143 * Math.sin(2 * F);
  return normalizeAngle(lon);
}

function getMercuryLongitude(jd: number): number {
  const n = jd - 2451545.0;
  const L = normalizeAngle(252.2509 + 4.0923345 * n);
  const M = normalizeAngle(174.7948 + 4.0923345 * n) * (Math.PI / 180);
  return normalizeAngle(L + 23.4400 * Math.sin(M) + 2.9818 * Math.sin(2 * M));
}

function getVenusLongitude(jd: number): number {
  const n = jd - 2451545.0;
  const L = normalizeAngle(181.9798 + 1.6021303 * n);
  const M = normalizeAngle(50.4161 + 1.6021687 * n) * (Math.PI / 180);
  return normalizeAngle(L + 0.7758 * Math.sin(M) + 0.0033 * Math.sin(2 * M));
}

function getMarsLongitude(jd: number): number {
  const n = jd - 2451545.0;
  const L = normalizeAngle(355.4333 + 0.5240207 * n);
  const M = normalizeAngle(19.3730 + 0.5240207 * n) * (Math.PI / 180);
  return normalizeAngle(L + 10.6912 * Math.sin(M) + 0.6228 * Math.sin(2 * M));
}

function getHouse(longitude: number, ascendant: number): number {
  const rel = normalizeAngle(longitude - ascendant);
  return Math.floor(rel / 30) + 1;
}

function getAscendant(jd: number, lat: number): number {
  const n = jd - 2451545.0;
  const LST = normalizeAngle(100.4606 + 360.98564736 * n + lat);
  return normalizeAngle(LST + 90);
}

export function calculateNatalChart(dob: Date, birthLat: number = 4.711): NatalChart {
  const jd = toJulianDay(dob);
  const asc = getAscendant(jd, birthLat);

  const sunLon = getSunLongitude(jd);
  const moonLon = getMoonLongitude(jd);
  const mercuryLon = getMercuryLongitude(jd);
  const venusLon = getVenusLongitude(jd);
  const marsLon = getMarsLongitude(jd);

  const sun = { ...longitudeToSign(sunLon), house: getHouse(sunLon, asc) };
  const moon = { ...longitudeToSign(moonLon), house: getHouse(moonLon, asc) };
  const mercury = { ...longitudeToSign(mercuryLon), house: getHouse(mercuryLon, asc) };
  const venus = { ...longitudeToSign(venusLon), house: getHouse(venusLon, asc) };
  const mars = { ...longitudeToSign(marsLon), house: getHouse(marsLon, asc) };

  const formatted = `${SYMBOLS.sun} ${sun.sign} · ${SYMBOLS.moon} ${moon.sign} · ${SYMBOLS.mercury} ${mercury.sign} · ${SYMBOLS.venus} ${venus.sign} · ${SYMBOLS.mars} ${mars.sign}`;

  return { sun, moon, mercury, venus, mars, formatted };
}
