import { useState } from "react";

const translations = {
  en: {
    dailyHoroscope: "YOUR DAILY HOROSCOPE",
    monthlyHoroscope: "MONTHLY HOROSCOPE",
    yearlyHoroscope: "2026 FORECAST",
    love: "LOVE & RELATIONSHIPS",
    career: "CAREER & PURPOSE",
    wellness: "WELLNESS & ENERGY",
    compatibility: "COMPATIBILITY",
    birthChart: "BIRTH CHART",
    today: "TODAY",
  },
  es: {
    dailyHoroscope: "TU HORÓSCOPO DIARIO",
    monthlyHoroscope: "HORÓSCOPO MENSUAL",
    yearlyHoroscope: "PRONÓSTICO 2026",
    love: "AMOR Y RELACIONES",
    career: "CARRERA Y PROPÓSITO",
    wellness: "BIENESTAR Y ENERGÍA",
    compatibility: "COMPATIBILIDAD",
    birthChart: "CARTA NATAL",
    today: "HOY",
  },
  pt: {
    dailyHoroscope: "SEU HORÓSCOPO DIÁRIO",
    monthlyHoroscope: "HORÓSCOPO MENSAL",
    yearlyHoroscope: "PREVISÃO 2026",
    love: "AMOR E RELACIONAMENTOS",
    career: "CARREIRA E PROPÓSITO",
    wellness: "BEM-ESTAR E ENERGIA",
    compatibility: "COMPATIBILIDADE",
    birthChart: "MAPA NATAL",
    today: "HOJE",
  },
};

function parseReading(raw: string): string {
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw);
    return parsed.content || parsed.text || parsed.reading || parsed.title || raw;
  } catch {
    return raw;
  }
}

interface StarsChamberProps {
  horoscope?: string;
  monthlyReading?: string;
  yearlyReading?: string;
  loveReading?: string;
  careerReading?: string;
  wellnessReading?: string;
  language?: "en" | "es" | "pt";
}

export function StarsChamber({
    horoscope = "",
  monthlyReading = "",
  yearlyReading = "",
  loveReading = "",
  careerReading = "",
  wellnessReading = "",
  language = "en",
}: StarsChamberProps) {
  const [activeTab, setActiveTab] = useState("today");
  const t = translations[language] || translations.en;

  const tabs = [
    { key: "today", label: t.today },
    { key: "monthly", label: t.monthlyHoroscope },
    { key: "yearly", label: t.yearlyHoroscope },
    { key: "love", label: t.love },
    { key: "career", label: t.career },
    { key: "wellness", label: t.wellness },
  ];

  const readings: Record<string, string> = {
    today: parseReading(horoscope),
    monthly: parseReading(monthlyReading),
    yearly: parseReading(yearlyReading),
    love: parseReading(loveReading),
    career: parseReading(careerReading),
    wellness: parseReading(wellnessReading),
  };

  return (
    <div className="min-h-screen bg-[#0B1A1A] text-[#FFFDD0] p-4">
      <h2 className="text-center text-[#F5D060] font-display text-sm tracking-widest mb-6">
        {t.dailyHoroscope}
      </h2>

      <div className="flex flex-wrap gap-2 justify-center mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`text-xs tracking-widest px-3 py-1 rounded-full border transition-all ${
              activeTab === tab.key
                ? "border-[#F5D060] text-[#F5D060] bg-[#F5D060]/10"
                : "border-[#FFFDD0]/20 text-[#FFFDD0]/60"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="max-w-xl mx-auto bg-[#2A1F0F]/30 border border-[#B87333]/20 rounded-2xl p-6 backdrop-blur-md">
        <p className="text-[#FFFDD0] leading-relaxed text-sm whitespace-pre-wrap">
          {readings[activeTab] || "Loading your reading..."}
        </p>
      </div>
    </div>
  );
}
