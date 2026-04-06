import { useTranslation } from "react-i18next";
import {
  formatDate,
  getZodiacFromDOB,
  getLifePath,
  getChineseZodiac,
  getUniversalDay,
  getPersonalDay,
} from "@/lib/daily";
import { getFallbackHoroscope } from "@/lib/fallbacks";
import { useCachedReading } from "@/hooks/use-cached-reading";
import { ChevronRight } from "lucide-react";

interface DailyBriefingProps {
  dob: Date;
  name: string;
}

export function DailyBriefing({ dob, name }: DailyBriefingProps) {
  const { t, i18n } = useTranslation();
  const today = new Date();
  const zodiac = getZodiacFromDOB(dob);
  const lifePath = getLifePath(dob);
  const chineseZodiac = getChineseZodiac(dob.getFullYear());
  const universalDay = getUniversalDay(today);
  const personalDay = getPersonalDay(dob, today);
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
      language: lang,
    },
    fallback: getFallbackHoroscope(zodiac.element, today),
  });

  const formattedDate = formatDate(today, lang);

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="card-cosmic rounded-2xl p-6 glow-gold relative overflow-hidden">
        <div className="animate-shimmer absolute inset-0 pointer-events-none rounded-2xl" />

        <div className="flex items-start justify-between mb-4">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">
            {formattedDate}
          </p>
          <div className="flex items-center gap-1.5 bg-muted/40 rounded-full px-3 py-1">
            <span className="text-sm">{zodiac.symbol}</span>
            <span className="text-xs font-display font-bold text-primary uppercase tracking-wider">
              {zodiac.sign}
            </span>
          </div>
        </div>

        <p className="text-[11px] uppercase tracking-[0.2em] text-primary/80 mb-3">
          {t("briefing.yourDailyHoroscope")}
        </p>

        {isLoading ? (
          <div className="space-y-3">
            <div className="h-4 bg-muted/30 rounded animate-pulse w-full" />
            <div className="h-4 bg-muted/30 rounded animate-pulse w-full" />
            <div className="h-4 bg-muted/30 rounded animate-pulse w-11/12" />
            <div className="h-4 bg-muted/30 rounded animate-pulse w-4/5" />
          </div>
        ) : (
          <p className="text-base text-foreground/90 leading-relaxed font-display">
            {horoscope}
          </p>
        )}

        {error && !horoscope && (
          <p className="text-xs text-destructive mt-2">
            {t("briefing.errorMessage")}
          </p>
        )}

        <div className="flex items-center gap-2 mt-5 text-xs text-muted-foreground">
          <span>{t("briefing.elementSign", { element: zodiac.element })}</span>
          <span className="text-muted-foreground/30">·</span>
          <span className="text-primary/80">{t("briefing.path", { number: lifePath })}</span>
          <span className="text-muted-foreground/30">·</span>
          <span>戌 {chineseZodiac}</span>
          <ChevronRight className="w-3 h-3 ml-auto text-muted-foreground/40" />
        </div>
      </div>

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
