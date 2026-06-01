import React from "react";
import { useTranslation } from "react-i18next";

interface TodayReading {
  title?: string;
  subtitle?: string;
  reading?: string;
  cosmicAdvice?: string;
  luckyNumber?: number | string;
  powerColor?: string;
  sunSign?: string;
  affirmation?: string;
}

interface Props {
  data: TodayReading | string | null;
  isLoading?: boolean;
  error?: string | null | boolean;
  onRetry?: () => void;
}

function parseReading(data: TodayReading | string | null): TodayReading {
  if (!data) return {};

  // Already a plain object
  if (typeof data === "object" && !Array.isArray(data)) {
    return data as TodayReading;
  }

  if (typeof data === "string") {
    const trimmed = data.trim();

    // Looks like JSON — try to parse it
    if (trimmed.startsWith("{")) {
      try {
        const cleaned = trimmed.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        if (typeof parsed === "object" && parsed !== null) {
          return parsed as TodayReading;
        }
      } catch {
        // JSON parse failed — fall through to plain text
      }
    }

    // Plain prose string — render as reading body
    return { reading: data };
  }

  return {};
}

export function TodayReadingCard({ data, isLoading, error, onRetry }: Props) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-[#C5A059]">
        <span className="animate-spin text-xl">◌</span>
        <span className="text-sm tracking-widest">{t("reading.consultingStars")}</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <span className="text-3xl">☆</span>
        <p className="text-[#FFFDD0]/60 text-sm">
          {t("reading.unableToChannel")}
          <br />
          {t("reading.tryAgainShortly")}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 px-4 py-1.5 rounded-full border border-[#C5A059]/30 text-[#C5A059]/70 text-xs tracking-wider hover:border-[#C5A059]/60 hover:text-[#C5A059] transition-colors"
          >
            {t("reading.tryAgain")}
          </button>
        )}
      </div>
    );
  }

  const parsed = parseReading(data);
  const { title, subtitle, reading, cosmicAdvice, luckyNumber, powerColor, sunSign, affirmation } = parsed;

  return (
    <div className="flex flex-col gap-5">
      {(title || subtitle) && (
        <div className="rounded-xl border border-[#C5A059]/20 bg-[#0B1A1A] p-5">
          {title && (
            <h2 className="font-['Libre_Baskerville'] text-2xl text-[#C5A059] mb-1">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-[#FFFDD0]/50 text-xs tracking-widest uppercase">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {reading && (
        <div className="rounded-xl border border-[#C5A059]/10 bg-[#0B1A1A] p-5">
          {reading.split("\n\n").map((para, i) => (
            <p
              key={i}
              className="text-[#FFFDD0]/80 text-sm leading-relaxed mb-3 last:mb-0"
            >
              {para}
            </p>
          ))}
        </div>
      )}

      {cosmicAdvice && (
        <div className="rounded-xl border border-[#C5A059]/30 bg-[#C5A059]/5 p-5">
          <p className="text-[#C5A059] text-[10px] tracking-[0.2em] uppercase mb-2">
            {t("reading.cosmicAdvice")}
          </p>
          <p className="font-['Libre_Baskerville'] text-[#FFFDD0] italic text-base">
            "{cosmicAdvice}"
          </p>
        </div>
      )}

      {(luckyNumber !== undefined || powerColor || sunSign) && (
        <div className="grid grid-cols-3 gap-3">
          {luckyNumber !== undefined && (
            <div className="rounded-xl border border-[#C5A059]/20 bg-[#0B1A1A] p-4 text-center">
              <p className="text-[#C5A059] text-[9px] tracking-[0.2em] uppercase mb-1">
                {t("reading.luckyNumber")}
              </p>
              <p className="font-['Libre_Baskerville'] text-[#FFFDD0] text-2xl">
                {luckyNumber}
              </p>
            </div>
          )}
          {powerColor && (
            <div className="rounded-xl border border-[#C5A059]/20 bg-[#0B1A1A] p-4 text-center">
              <p className="text-[#C5A059] text-[9px] tracking-[0.2em] uppercase mb-1">
                {t("reading.powerColor")}
              </p>
              <p className="text-[#FFFDD0] text-sm font-medium">{powerColor}</p>
            </div>
          )}
          {sunSign && (
            <div className="rounded-xl border border-[#C5A059]/20 bg-[#0B1A1A] p-4 text-center">
              <p className="text-[#C5A059] text-[9px] tracking-[0.2em] uppercase mb-1">
                {t("reading.sun")}
              </p>
              <p className="text-[#FFFDD0] text-sm font-medium">{sunSign}</p>
            </div>
          )}
        </div>
      )}

      {affirmation && (
        <div className="rounded-xl border border-[#C5A059]/10 bg-[#0B1A1A] p-5 text-center">
          <p className="text-[#C5A059] text-[10px] tracking-[0.2em] uppercase mb-2">
            {t("reading.todayAffirmation")}
          </p>
          <p className="font-['Libre_Baskerville'] text-[#FFFDD0] italic text-base">
            "{affirmation}"
          </p>
        </div>
      )}
    </div>
  );
}
