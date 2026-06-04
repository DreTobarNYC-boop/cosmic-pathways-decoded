// DCode — Natal Chart Engine
// Real ephemeris-based planet position calculator

import { getZodiacFromDOB } from "@/lib/daily";

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
  const rad = Math.PI / 180;
  // Mean elements
  const Lp = normalizeAngle(218.3164477 + 13.17639648 * n);   // mean longitude
  const D  = normalizeAngle(297.8501921 + 12.19074912 * n) * rad; // mean elongation
  const M  = normalizeAngle(357.5291092 + 0.98560028 * n) * rad;  // sun mean anomaly
  const Mp = normalizeAngle(134.9633964 + 13.06499295 * n) * rad; // moon mean anomaly
  const F  = normalizeAngle(93.2720950 + 13.22935024 * n) * rad;  // argument of latitude

  // Main periodic terms of lunar longitude (degrees)
  const lon = Lp
    + 6.288774 * Math.sin(Mp)
    + 1.274027 * Math.sin(2 * D - Mp)
    + 0.658314 * Math.sin(2 * D)
    + 0.213618 * Math.sin(2 * Mp)
    - 0.185116 * Math.sin(M)
    - 0.114332 * Math.sin(2 * F)
    + 0.058793 * Math.sin(2 * D - 2 * Mp)
    + 0.057066 * Math.sin(2 * D - M - Mp)
    + 0.053322 * Math.sin(2 * D + Mp)
    + 0.045758 * Math.sin(2 * D - M)
    - 0.040923 * Math.sin(M - Mp)
    - 0.034720 * Math.sin(D)
    - 0.030383 * Math.sin(M + Mp)
    + 0.015327 * Math.sin(2 * D - 2 * F)
    - 0.012528 * Math.sin(Mp + 2 * F)
    + 0.010980 * Math.sin(Mp - 2 * F)
    + 0.010675 * Math.sin(4 * D - Mp)
    + 0.010034 * Math.sin(3 * Mp)
    + 0.008548 * Math.sin(4 * D - 2 * Mp);
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

  // The Sun's tropical sign is fully determined by the calendar date.
  // Use the authoritative date-based sign (matches the Stars header) instead
  // of the astronomical approximation, which can land on the wrong sign at
  // sign boundaries. Degree is derived relative to that sign's start.
  // Read the date from UTC components to match the Julian-day calc above and
  // stay timezone-independent.
  const calendarDate = new Date(dob.getUTCFullYear(), dob.getUTCMonth(), dob.getUTCDate(), 12);
  const sunSignName = getZodiacFromDOB(calendarDate).sign;
  const sunSignIndex = SIGNS.indexOf(sunSignName);
  const sunDegree = Math.max(0, Math.min(29,
    Math.round(normalizeAngle(sunLon - sunSignIndex * 30))));
  const sun = { sign: sunSignName, degree: sunDegree, house: getHouse(sunLon, asc) };

  const moon = { ...longitudeToSign(moonLon), house: getHouse(moonLon, asc) };
  const mercury = { ...longitudeToSign(mercuryLon), house: getHouse(mercuryLon, asc) };
  const venus = { ...longitudeToSign(venusLon), house: getHouse(venusLon, asc) };
  const mars = { ...longitudeToSign(marsLon), house: getHouse(marsLon, asc) };

  const formatted = `${SYMBOLS.sun} ${sun.sign} · ${SYMBOLS.moon} ${moon.sign} · ${SYMBOLS.mercury} ${mercury.sign} · ${SYMBOLS.venus} ${venus.sign} · ${SYMBOLS.mars} ${mars.sign}`;

  return { sun, moon, mercury, venus, mars, formatted };
}
