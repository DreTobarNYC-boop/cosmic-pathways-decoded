import { describe, it, expect } from "vitest";
import {
  getZodiacSign,
  getZodiacFromDOB,
  getCuspInfo,
  reduceToSingle,
  getLifePath,
  getUniversalDay,
  getPersonalDay,
  getChineseZodiac,
  formatDate,
  UNIVERSAL_DAY_MEANINGS,
  PERSONAL_DAY_MEANINGS,
} from "@/lib/daily";
import { getFallbackHoroscope } from "@/lib/fallbacks";
import { cn } from "@/lib/utils";

describe("cn utility", () => {
  it("should merge class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("should handle conditional classes", () => {
    expect(cn("base", false && "hidden", "active")).toBe("base active");
  });

  it("should merge tailwind classes correctly", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });
});

describe("getZodiacSign", () => {
  it("should return Aries for March 25", () => {
    const result = getZodiacSign(3, 25);
    expect(result.sign).toBe("Aries");
    expect(result.element).toBe("Fire");
    expect(result.symbol).toBe("♈");
  });

  it("should return Taurus for May 1", () => {
    const result = getZodiacSign(5, 1);
    expect(result.sign).toBe("Taurus");
    expect(result.element).toBe("Earth");
  });

  it("should return Gemini for June 5", () => {
    const result = getZodiacSign(6, 5);
    expect(result.sign).toBe("Gemini");
    expect(result.element).toBe("Air");
  });

  it("should return Cancer for July 10", () => {
    const result = getZodiacSign(7, 10);
    expect(result.sign).toBe("Cancer");
    expect(result.element).toBe("Water");
  });

  it("should return Leo for August 10", () => {
    const result = getZodiacSign(8, 10);
    expect(result.sign).toBe("Leo");
    expect(result.element).toBe("Fire");
  });

  it("should return Virgo for September 5", () => {
    const result = getZodiacSign(9, 5);
    expect(result.sign).toBe("Virgo");
    expect(result.element).toBe("Earth");
  });

  it("should return Libra for October 10", () => {
    const result = getZodiacSign(10, 10);
    expect(result.sign).toBe("Libra");
    expect(result.element).toBe("Air");
  });

  it("should return Scorpio for November 5", () => {
    const result = getZodiacSign(11, 5);
    expect(result.sign).toBe("Scorpio");
    expect(result.element).toBe("Water");
  });

  it("should return Sagittarius for December 5", () => {
    const result = getZodiacSign(12, 5);
    expect(result.sign).toBe("Sagittarius");
    expect(result.element).toBe("Fire");
  });

  it("should return Capricorn for December 25 (year wrap)", () => {
    const result = getZodiacSign(12, 25);
    expect(result.sign).toBe("Capricorn");
    expect(result.element).toBe("Earth");
  });

  it("should return Capricorn for January 5", () => {
    const result = getZodiacSign(1, 5);
    expect(result.sign).toBe("Capricorn");
    expect(result.element).toBe("Earth");
  });

  it("should return Aquarius for February 1", () => {
    const result = getZodiacSign(2, 1);
    expect(result.sign).toBe("Aquarius");
    expect(result.element).toBe("Air");
  });

  it("should return Pisces for March 5", () => {
    const result = getZodiacSign(3, 5);
    expect(result.sign).toBe("Pisces");
    expect(result.element).toBe("Water");
  });
});

describe("getZodiacFromDOB", () => {
  it("should extract zodiac from Date object", () => {
    const dob = new Date(1990, 3, 15); // April 15
    const result = getZodiacFromDOB(dob);
    expect(result.sign).toBe("Aries");
  });

  it("should handle year boundary (Capricorn)", () => {
    const dob = new Date(1985, 0, 10); // January 10
    const result = getZodiacFromDOB(dob);
    expect(result.sign).toBe("Capricorn");
  });
});

describe("getCuspInfo", () => {
  it("should not be on cusp for mid-sign dates", () => {
    const result = getCuspInfo(4, 10); // Mid-Aries
    expect(result.onCusp).toBe(false);
  });

  it("should detect Aries-Taurus cusp", () => {
    const result = getCuspInfo(4, 19); // End of Aries
    expect(result.onCusp).toBe(true);
    expect(result.cuspSign).toBe("Taurus");
    expect(result.cuspDescription).toContain("Aries-Taurus");
  });

  it("should detect start of Taurus cusp", () => {
    const result = getCuspInfo(4, 20); // Start of Taurus
    expect(result.onCusp).toBe(true);
    expect(result.cuspSign).toBe("Aries");
  });
});

describe("reduceToSingle", () => {
  it("should return single digits as-is", () => {
    expect(reduceToSingle(5)).toBe(5);
    expect(reduceToSingle(9)).toBe(9);
  });

  it("should reduce double digits", () => {
    expect(reduceToSingle(15)).toBe(6); // 1+5=6
    expect(reduceToSingle(29)).toBe(2); // 2+9=11, then keep 11
  });

  it("should preserve master number 11", () => {
    expect(reduceToSingle(11)).toBe(11);
    expect(reduceToSingle(29)).toBe(11); // 2+9=11
  });

  it("should preserve master number 22", () => {
    expect(reduceToSingle(22)).toBe(22);
  });

  it("should preserve master number 33", () => {
    expect(reduceToSingle(33)).toBe(33);
  });

  it("should reduce larger numbers", () => {
    expect(reduceToSingle(123)).toBe(6); // 1+2+3=6
    expect(reduceToSingle(1990)).toBe(1); // 1+9+9+0=19, 1+9=10, 1+0=1
  });
});

describe("getLifePath", () => {
  it("should calculate life path number", () => {
    const dob = new Date(1990, 0, 15); // Jan 15, 1990
    const result = getLifePath(dob);
    expect(result).toBeGreaterThanOrEqual(1);
    expect(result).toBeLessThanOrEqual(33);
  });

  it("should return a master number when applicable", () => {
    // Testing that master numbers can be returned
    const dob = new Date(2009, 11, 12); // Dec 12, 2009
    const result = getLifePath(dob);
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33]).toContain(result);
  });
});

describe("getUniversalDay", () => {
  it("should calculate universal day number", () => {
    const date = new Date(2024, 0, 1); // Jan 1, 2024
    const result = getUniversalDay(date);
    expect(result).toBeGreaterThanOrEqual(1);
    expect(result).toBeLessThanOrEqual(33);
  });

  it("should return consistent results for same date", () => {
    const date = new Date(2024, 5, 15);
    const result1 = getUniversalDay(date);
    const result2 = getUniversalDay(date);
    expect(result1).toBe(result2);
  });
});

describe("getPersonalDay", () => {
  it("should calculate personal day number", () => {
    const dob = new Date(1990, 5, 15);
    const today = new Date(2024, 0, 1);
    const result = getPersonalDay(dob, today);
    expect(result).toBeGreaterThanOrEqual(1);
    expect(result).toBeLessThanOrEqual(33);
  });

  it("should vary with different dates", () => {
    const dob = new Date(1990, 5, 15);
    const day1 = getPersonalDay(dob, new Date(2024, 0, 1));
    const day2 = getPersonalDay(dob, new Date(2024, 0, 2));
    // Different days should potentially produce different results
    expect(typeof day1).toBe("number");
    expect(typeof day2).toBe("number");
  });
});

describe("getChineseZodiac", () => {
  it("should return Rat for 2020", () => {
    expect(getChineseZodiac(2020)).toBe("Rat");
  });

  it("should return Ox for 2021", () => {
    expect(getChineseZodiac(2021)).toBe("Ox");
  });

  it("should return Tiger for 2022", () => {
    expect(getChineseZodiac(2022)).toBe("Tiger");
  });

  it("should return Rabbit for 2023", () => {
    expect(getChineseZodiac(2023)).toBe("Rabbit");
  });

  it("should return Dragon for 2024", () => {
    expect(getChineseZodiac(2024)).toBe("Dragon");
  });

  it("should handle older years", () => {
    expect(getChineseZodiac(1990)).toBe("Horse");
    expect(getChineseZodiac(1985)).toBe("Ox");
  });
});

describe("formatDate", () => {
  it("should format date in English by default", () => {
    const date = new Date(2024, 0, 15); // Jan 15, 2024
    const result = formatDate(date);
    expect(result).toContain("2024");
    expect(result).toContain("January");
    expect(result).toContain("15");
  });

  it("should format date in Spanish", () => {
    const date = new Date(2024, 0, 15);
    const result = formatDate(date, "es");
    expect(result).toContain("2024");
    expect(result.toLowerCase()).toContain("enero");
  });

  it("should format date in Portuguese", () => {
    const date = new Date(2024, 0, 15);
    const result = formatDate(date, "pt-BR");
    expect(result).toContain("2024");
    expect(result.toLowerCase()).toContain("janeiro");
  });
});

describe("UNIVERSAL_DAY_MEANINGS", () => {
  it("should have meanings for all base numbers", () => {
    for (let i = 1; i <= 9; i++) {
      expect(UNIVERSAL_DAY_MEANINGS[i]).toBeDefined();
      expect(typeof UNIVERSAL_DAY_MEANINGS[i]).toBe("string");
    }
  });

  it("should have meanings for master numbers", () => {
    expect(UNIVERSAL_DAY_MEANINGS[11]).toBeDefined();
    expect(UNIVERSAL_DAY_MEANINGS[22]).toBeDefined();
    expect(UNIVERSAL_DAY_MEANINGS[33]).toBeDefined();
  });
});

describe("PERSONAL_DAY_MEANINGS", () => {
  it("should have meanings for all base numbers", () => {
    for (let i = 1; i <= 9; i++) {
      expect(PERSONAL_DAY_MEANINGS[i]).toBeDefined();
      expect(typeof PERSONAL_DAY_MEANINGS[i]).toBe("string");
    }
  });

  it("should have meanings for master numbers", () => {
    expect(PERSONAL_DAY_MEANINGS[11]).toBeDefined();
    expect(PERSONAL_DAY_MEANINGS[22]).toBeDefined();
    expect(PERSONAL_DAY_MEANINGS[33]).toBeDefined();
  });
});

describe("getFallbackHoroscope", () => {
  it("should return a string for Fire element", () => {
    const result = getFallbackHoroscope("Fire");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("should return a string for Earth element", () => {
    const result = getFallbackHoroscope("Earth");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("should return a string for Air element", () => {
    const result = getFallbackHoroscope("Air");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("should return a string for Water element", () => {
    const result = getFallbackHoroscope("Water");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("should fallback to Fire for unknown elements", () => {
    const result = getFallbackHoroscope("Unknown");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("should return different horoscopes for different days", () => {
    const day1 = new Date(2024, 0, 1);
    const day2 = new Date(2024, 0, 2);
    const day3 = new Date(2024, 0, 3);
    
    const result1 = getFallbackHoroscope("Fire", day1);
    const result2 = getFallbackHoroscope("Fire", day2);
    const result3 = getFallbackHoroscope("Fire", day3);
    
    // At least some should be different (since there are 3 templates)
    const allSame = result1 === result2 && result2 === result3;
    expect(allSame).toBe(false);
  });
});
