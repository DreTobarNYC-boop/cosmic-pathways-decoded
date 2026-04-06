import {
  formatDate,
  getZodiacFromDOB,
  getLifePath,
  getChineseZodiac,
  getDailyHoroscope,
  getUniversalDay,
  getPersonalDay,
  UNIVERSAL_DAY_MEANINGS,
  PERSONAL_DAY_MEANINGS,
} from "@/lib/daily";

interface DailyBriefingProps {
  dob: Date;
}

export function DailyBriefing({ dob }: DailyBriefingProps) {
  const today = new Date();
  const zodiac = getZodiacFromDOB(dob);
  const lifePath = getLifePath(dob);
  const chineseZodiac = getChineseZodiac(dob.getFullYear());
  const horoscope = getDailyHoroscope(zodiac.element, today);
  const universalDay = getUniversalDay(today);
  const personalDay = getPersonalDay(dob, today);

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Hero */}
      <div className="card-cosmic rounded-2xl p-6 glow-gold relative overflow-hidden">
        <div className="animate-shimmer absolute inset-0 pointer-events-none rounded-2xl" />
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
          Daily Cosmic Briefing
        </p>
        <p className="text-sm text-muted-foreground mb-4">{formatDate(today)}</p>

        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{zodiac.symbol}</span>
          <div>
            <h2 className="font-display text-lg font-bold text-foreground">
              {zodiac.sign}
            </h2>
            <p className="text-xs text-muted-foreground">{zodiac.element} Sign</p>
          </div>
        </div>

        <p className="text-sm text-foreground/80 leading-relaxed font-display italic">
          "{horoscope}"
        </p>

        {/* Cosmic identity strip */}
        <div className="flex gap-3 mt-5 flex-wrap">
          <span className="text-xs bg-muted/50 text-muted-foreground px-3 py-1 rounded-full">
            {zodiac.element} Element
          </span>
          <span className="text-xs bg-muted/50 text-muted-foreground px-3 py-1 rounded-full">
            Life Path {lifePath}
          </span>
          <span className="text-xs bg-muted/50 text-muted-foreground px-3 py-1 rounded-full">
            {chineseZodiac} 🐉
          </span>
        </div>
      </div>

      {/* Daily Numbers */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card-cosmic rounded-2xl p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            Universal Day
          </p>
          <p className="text-2xl font-display font-bold text-gold">{universalDay}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {UNIVERSAL_DAY_MEANINGS[universalDay]}
          </p>
        </div>
        <div className="card-cosmic rounded-2xl p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            Personal Day
          </p>
          <p className="text-2xl font-display font-bold text-gold">{personalDay}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {PERSONAL_DAY_MEANINGS[personalDay]}
          </p>
        </div>
      </div>
    </div>
  );
}
