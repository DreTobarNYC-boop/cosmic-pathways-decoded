import { useTranslation } from "react-i18next";
import {
  formatDate,
  getZodiacFromDOB,
  getLifePath,
  getChineseZodiac,
  getUniversalDay,
  getPersonalDay,
  getCuspInfo,
} from "@/lib/daily";
import { getFallbackHoroscope } from "@/lib/fallbacks";
import { useCachedReading } from "@/hooks/use-cached-reading";
import { ChevronRight } from "lucide-react";
import { getZodiacImage } from "@/lib/zodiac-images";

interface DailyBriefingProps {
  dob: Date;
  name: string;
  birthPlace?: string | null;
  birthTime?: string | null;
  onOpenStars?: () => void;
}

/** Truncate to roughly the first 2-3 sentences */
function getPreview(text: string): string {
  const sentences = text.match(/[^.!?]+[.!?]+/g);
  if (!sentences || sentences.length <= 2) return text;
  return sentences.slice(0, 2).join("").trim();
}

export function DailyBriefing({ dob, name, birthPlace, birthTime, onOpenStars }: DailyBriefingProps) {
  const { t, i18n } = useTranslation();
  const today = new Date();
  const zodiac = getZodiacFromDOB(dob);
  const lifePath = getLifePath(dob);
  const chineseZodiac = getChineseZodiac(dob.getFullYear());
  const universalDay = getUniversalDay(today);
  const personalDay = getPersonalDay(dob, today);
  const cusp = getCuspInfo(dob.getMonth() + 1, dob.getDate());
  const dateKey = today.toISOString().split("T")[0];

  const lang = i18n.language;

  const { content: horoscope, isLoading, error } = useCachedReading({
    readingType: "daily_horoscope",
    cacheKey: `${dateKey}_${lang}`,
    context: {
      zodiacSign: zodiac.sign,
      element: zodiac.element,
      lifePath,
      chineseZodiac,
      date: formatDate(today, lang),
      universalDay,
      personalDay,
      name,
      birthPlace: birthPlace || "Unknown",
      birthTime: birthTime || "Unknown",
      cuspInfo: cusp.onCusp ? cusp.cuspDescription : null,
      language: lang,
    },
    fallback: getFallbackHoroscope(zodiac.element, today),
  });

  const formattedDate = formatDate(today, lang);
  const preview = horoscope ? getPreview(horoscope) : "";

  return (
    <div className="space-y-4 animate-fade-up">
      <button
        onClick={onOpenStars}
        className="card-cosmic rounded-2xl p-6 glow-gold relative overflow-hidden w-full text-left transition-all"
      >
        <div className="animate-shimmer absolute inset-0 pointer-events-none rounded-2xl" />

        <div className="flex items-start justify-between mb-4">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">
            {formattedDate}
          </p>
          <div className="flex items-center gap-1.5 bg-muted/40 rounded-full px-3 py-1">
            {getZodiacImage(zodiac.sign) ? (
              <img src={getZodiacImage(zodiac.sign)} alt={zodiac.sign} className="w-6 h-6 object-contain" loading="lazy" />
            ) : (
              <span className="text-sm">{zodiac.symbol}</span>
            )}
            <span className="text-xs font-display font-bold text-primary uppercase tracking-wider">
              {zodiac.sign}
            </span>
            {cusp.onCusp && cusp.cuspSign && (
              <span className="text-xs text-muted-foreground/70">/ {cusp.cuspSign}</span>
            )}
          </div>
        </div>

        <p className="text-[11px] uppercase tracking-[0.2em] text-primary/80 mb-3">
          {t("briefing.yourDailyHoroscope")}
        </p>

        {isLoading ? (
          <div className="space-y-3">
            <div className="h-4 bg-muted/30 rounded animate-pulse w-full" />
            <div className="h-4 bg-muted/30 rounded animate-pulse w-full" />
            <div className="h-4 bg-muted/30 rounded animate-pulse w-4/5" />
          </div>
        ) : (
          <div>
            <p className="text-base text-foreground/90 leading-relaxed font-display">
              {preview}
              {horoscope && horoscope.length > preview.length && (
                <span className="text-primary/60">…</span>
              )}
            </p>
            <div className="flex items-center justify-center gap-1 mt-3 text-xs text-primary/70">
              <span>{t("briefing.readMore")}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        )}

        {error && !horoscope && (
          <p className="text-xs text-destructive mt-2">
            {t("briefing.errorMessage")}
          </p>
        )}

        <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
          <span>{t("briefing.elementSign", { element: t(`elements.${zodiac.element}`, zodiac.element) })}</span>
          <span className="text-muted-foreground/30">·</span>
          <span className="text-primary/80">{t("briefing.path", { number: lifePath })}</span>
          <span className="text-muted-foreground/30">·</span>
          <span>{t(`chineseAnimals.${chineseZodiac}`, chineseZodiac)}</span>
          <ChevronRight className="w-3 h-3 ml-auto text-muted-foreground/40" />
        </div>
      </button>

      <div className="grid grid-cols-2 gap-3">
        <div className="card-cosmic rounded-2xl p-4">
          <p className="text-[11px] uppercase tracking-[0.2em] text-primary/70 mb-1">
            {t("briefing.universalDay")}
          </p>
          <p className="text-3xl font-display font-bold text-primary">{universalDay}</p>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            {t(`universalDayMeanings.${universalDay}`)}
          </p>
        </div>
        <div className="card-cosmic rounded-2xl p-4">
          <p className="text-[11px] uppercase tracking-[0.2em] text-primary/70 mb-1">
            {t("briefing.personalDay")}
          </p>
          <p className="text-3xl font-display font-bold text-primary">{personalDay}</p>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            {t(`personalDayMeanings.${personalDay}`)}
          </p>
        </div>
      </div>
    </div>
  );
}