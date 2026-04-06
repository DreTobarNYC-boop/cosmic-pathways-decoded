import { useTranslation } from "react-i18next";
import { ChamberLayout } from "@/components/ChamberLayout";
import { Star, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
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

export function StarsChamber({ onBack }: { onBack: () => void }) {
  const { t, i18n } = useTranslation();
  const { profile } = useAuth();

  const today = new Date();
  const dob = profile ? new Date(profile.dateOfBirth + "T00:00:00") : new Date();
  const zodiac = getZodiacFromDOB(dob);
  const lifePath = getLifePath(dob);
  const chineseZodiac = getChineseZodiac(dob.getFullYear());
  const universalDay = getUniversalDay(today);
  const personalDay = getPersonalDay(dob, today);
  const dateKey = today.toISOString().split("T")[0];
  const lang = i18n.language;

  const { content: horoscope, isLoading } = useCachedReading({
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
      name: profile?.fullName || "",
      language: lang,
    },
    fallback: getFallbackHoroscope(zodiac.element, today),
  });

  const formattedDate = formatDate(today, lang);

  return (
    <ChamberLayout title={t("chamberPages.stars.title")} subtitle={t("chamberPages.stars.subtitle")} onBack={onBack}>
      {/* Zodiac badge */}
      <div className="flex items-center justify-center gap-2 mt-2 mb-6">
        <div className="flex items-center gap-2 bg-muted/40 rounded-full px-4 py-2">
          <span className="text-lg">{zodiac.symbol}</span>
          <span className="text-sm font-display font-bold text-primary uppercase tracking-wider">
            {zodiac.sign}
          </span>
        </div>
      </div>

      {/* Full daily reading */}
      <div className="card-cosmic rounded-2xl p-6 glow-gold relative overflow-hidden">
        <div className="animate-shimmer absolute inset-0 pointer-events-none rounded-2xl" />

        <div className="flex items-start justify-between mb-4">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">
            {formattedDate}
          </p>
          <Star className="w-5 h-5 text-primary/60" />
        </div>

        <p className="text-[11px] uppercase tracking-[0.2em] text-primary/80 mb-3">
          {t("briefing.yourDailyHoroscope")}
        </p>

        {isLoading ? (
          <div className="space-y-3">
            <div className="h-4 bg-muted/30 rounded animate-pulse w-full" />
            <div className="h-4 bg-muted/30 rounded animate-pulse w-full" />
            <div className="h-4 bg-muted/30 rounded animate-pulse w-4/5" />
            <div className="h-4 bg-muted/30 rounded animate-pulse w-full" />
            <div className="h-4 bg-muted/30 rounded animate-pulse w-3/5" />
          </div>
        ) : (
          <p className="text-base text-foreground/90 leading-relaxed font-display">
            {horoscope}
          </p>
        )}

        <div className="flex items-center gap-2 mt-5 text-xs text-muted-foreground">
          <span>{t("briefing.elementSign", { element: zodiac.element })}</span>
          <span className="text-muted-foreground/30">·</span>
          <span className="text-primary/80">{t("briefing.path", { number: lifePath })}</span>
          <span className="text-muted-foreground/30">·</span>
          <span>戌 {chineseZodiac}</span>
        </div>
      </div>

      {/* Day numbers */}
      <div className="grid grid-cols-2 gap-3 mt-4">
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
    </ChamberLayout>
  );
}
