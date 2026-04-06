import { useState, useMemo } from "react";
import { ChamberLayout } from "@/components/ChamberLayout";
import { useAuth } from "@/hooks/use-auth";
import { useCachedReading } from "@/hooks/use-cached-reading";
import { Share2, RotateCcw, Loader2, ChevronRight, ChevronDown } from "lucide-react";

/* ─── Hawkins Map of Consciousness ─── */

interface HawkinsLevel {
  level: string;
  emotion: string;
  calibration: number;
  color: string;
  description: string;
  arcDeg: number; // position on the 180° arc
}

const HAWKINS_LEVELS: HawkinsLevel[] = [
  { level: "Shame", emotion: "Humiliation", calibration: 20, color: "hsl(0, 50%, 30%)", description: "The field of self-destruction. Energy turns against itself.", arcDeg: 10 },
  { level: "Guilt", emotion: "Blame", calibration: 30, color: "hsl(0, 45%, 35%)", description: "Unresolved pain projected inward. Punishment loops.", arcDeg: 20 },
  { level: "Apathy", emotion: "Despair", calibration: 50, color: "hsl(0, 30%, 40%)", description: "Hopelessness. The world feels dead and meaningless.", arcDeg: 30 },
  { level: "Grief", emotion: "Regret", calibration: 75, color: "hsl(15, 40%, 40%)", description: "Deep sadness. The heart is heavy but beginning to feel.", arcDeg: 40 },
  { level: "Fear", emotion: "Anxiety", calibration: 100, color: "hsl(30, 50%, 42%)", description: "Survival mode. The mind scans for threats constantly.", arcDeg: 50 },
  { level: "Desire", emotion: "Craving", calibration: 125, color: "hsl(40, 60%, 45%)", description: "Addiction to external validation. Wanting without fulfillment.", arcDeg: 60 },
  { level: "Anger", emotion: "Hate", calibration: 150, color: "hsl(45, 70%, 48%)", description: "Frustrated energy seeking a target. Powerful but destructive.", arcDeg: 70 },
  { level: "Pride", emotion: "Scorn", calibration: 175, color: "hsl(50, 60%, 50%)", description: "The ego inflates. Feels good but blocks true growth.", arcDeg: 80 },
  { level: "Courage", emotion: "Affirmation", calibration: 200, color: "hsl(120, 35%, 45%)", description: "The turning point. Life is seen as exciting and manageable.", arcDeg: 90 },
  { level: "Neutrality", emotion: "Trust", calibration: 250, color: "hsl(140, 40%, 45%)", description: "Non-attachment. Inner confidence regardless of outcomes.", arcDeg: 100 },
  { level: "Willingness", emotion: "Optimism", calibration: 310, color: "hsl(150, 45%, 45%)", description: "Open to growth. Genuine desire to serve and improve.", arcDeg: 110 },
  { level: "Acceptance", emotion: "Forgiveness", calibration: 350, color: "hsl(170, 45%, 42%)", description: "Responsibility taken. Transformation begins from within.", arcDeg: 120 },
  { level: "Reason", emotion: "Understanding", calibration: 400, color: "hsl(200, 50%, 50%)", description: "The intellect illuminated. Comprehension of complex systems.", arcDeg: 130 },
  { level: "Love", emotion: "Reverence", calibration: 500, color: "hsl(270, 50%, 55%)", description: "Unconditional. The field that heals without effort.", arcDeg: 145 },
  { level: "Joy", emotion: "Serenity", calibration: 540, color: "hsl(280, 55%, 60%)", description: "Sustained inner radiance. Compassion flows effortlessly.", arcDeg: 155 },
  { level: "Peace", emotion: "Bliss", calibration: 600, color: "hsl(290, 50%, 65%)", description: "Transcendence. The separate self dissolves into unity.", arcDeg: 165 },
  { level: "Enlightenment", emotion: "Ineffable", calibration: 700, color: "hsl(300, 60%, 70%)", description: "Pure consciousness. Beyond description.", arcDeg: 178 },
];

/* ─── Quiz Questions ─── */

interface QuizQuestion {
  category: string;
  question: string;
  answers: { text: string; score: number }[];
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    category: "EMOTIONAL BASELINE",
    question: "How do you feel at the end of most days?",
    answers: [
      { text: "Drained and defeated", score: 1 },
      { text: "Restless — replaying what went wrong", score: 2 },
      { text: "Fine, nothing special", score: 3 },
      { text: "Satisfied with what I built today", score: 4 },
      { text: "At peace — today served its purpose", score: 5 },
    ],
  },
  {
    category: "SELF-WORTH",
    question: "When you look in the mirror, what's your first thought?",
    answers: [
      { text: "I avoid mirrors", score: 1 },
      { text: "I focus on flaws and things I want to change", score: 2 },
      { text: "I don't think much — it's just routine", score: 3 },
      { text: "I see someone doing their best", score: 4 },
      { text: "I see a reflection of something sacred", score: 5 },
    ],
  },
  {
    category: "FEAR / COURAGE",
    question: "How do you handle conflict with someone close to you?",
    answers: [
      { text: "I avoid it completely — I shut down", score: 1 },
      { text: "I get angry and say things I regret", score: 2 },
      { text: "I wait until I've cooled off, then address it", score: 3 },
      { text: "I speak my truth calmly and hold boundaries", score: 4 },
      { text: "I see it as a mirror — what is this teaching me?", score: 5 },
    ],
  },
  {
    category: "ATTACHMENT",
    question: "How do you respond when something you love is taken away?",
    answers: [
      { text: "I feel destroyed — like I can't go on", score: 1 },
      { text: "I obsess over getting it back", score: 2 },
      { text: "I grieve but eventually accept it", score: 3 },
      { text: "I trust that what's meant for me will return or be replaced", score: 4 },
      { text: "I release with gratitude for what it taught me", score: 5 },
    ],
  },
  {
    category: "PURPOSE",
    question: "How connected do you feel to your life's purpose?",
    answers: [
      { text: "I have no idea why I'm here", score: 1 },
      { text: "I feel like I'm wasting my potential", score: 2 },
      { text: "I'm searching — trying different paths", score: 3 },
      { text: "I'm building something meaningful", score: 4 },
      { text: "I am the purpose — every moment is the mission", score: 5 },
    ],
  },
  {
    category: "RELATIONSHIPS",
    question: "How would you describe your closest relationships?",
    answers: [
      { text: "Toxic or nonexistent", score: 1 },
      { text: "Draining — I give more than I receive", score: 2 },
      { text: "Comfortable but surface-level", score: 3 },
      { text: "Deep and mutually supportive", score: 4 },
      { text: "Sacred — we help each other evolve", score: 5 },
    ],
  },
  {
    category: "SPIRITUAL AWARENESS",
    question: "How often do you notice synchronicities or signs?",
    answers: [
      { text: "Never — life feels random", score: 1 },
      { text: "Occasionally, but I dismiss them", score: 2 },
      { text: "Sometimes — I notice patterns forming", score: 3 },
      { text: "Regularly — I track them and act on them", score: 4 },
      { text: "Constantly — I live inside the synchronicity field", score: 5 },
    ],
  },
  {
    category: "FORGIVENESS",
    question: "Is there someone you haven't forgiven — including yourself?",
    answers: [
      { text: "Yes — and I don't plan to", score: 1 },
      { text: "Yes — I think about it often", score: 2 },
      { text: "I'm working on it", score: 3 },
      { text: "I've forgiven most things, still processing a few", score: 4 },
      { text: "I carry no resentment — forgiveness is my default", score: 5 },
    ],
  },
  {
    category: "GRATITUDE",
    question: "How often do you feel genuinely grateful?",
    answers: [
      { text: "Rarely — life feels unfair", score: 1 },
      { text: "Only when good things happen", score: 2 },
      { text: "I try to practice it, but it feels forced", score: 3 },
      { text: "Daily — I notice beauty in small things", score: 4 },
      { text: "It's my baseline state — gratitude breathes through me", score: 5 },
    ],
  },
  {
    category: "PHYSICAL ENERGY",
    question: "How often do you intentionally disconnect from screens and noise?",
    answers: [
      { text: "Almost never — I'm always plugged in", score: 1 },
      { text: "Rarely — I know I should but don't", score: 2 },
      { text: "A few times a week", score: 3 },
      { text: "Daily — I have a grounding practice", score: 4 },
      { text: "I live with intentional stillness built into every day", score: 5 },
    ],
  },
];

/* ─── Helpers ─── */

function getHawkinsLevel(score: number): { current: HawkinsLevel; next: HawkinsLevel | null; calibration: number; pointsToNext: number } {
  // Score range: 10-50, map to calibration ~20-700
  const t = (score - 10) / 40; // 0..1
  const calibration = Math.round(20 + t * 680);

  let current = HAWKINS_LEVELS[0];
  let next: HawkinsLevel | null = null;

  for (let i = 0; i < HAWKINS_LEVELS.length; i++) {
    if (calibration >= HAWKINS_LEVELS[i].calibration) {
      current = HAWKINS_LEVELS[i];
      next = HAWKINS_LEVELS[i + 1] || null;
    }
  }

  const pointsToNext = next ? next.calibration - calibration : 0;

  return { current, next, calibration, pointsToNext };
}

/* ─── Sonic Prescriptions ─── */

const SONIC_PRESCRIPTIONS: Record<string, { freq: number; name: string; description: string }> = {
  Shame: { freq: 396, name: "Liberation", description: "396 Hz liberates from guilt and fear, the foundational blocks holding your field down." },
  Guilt: { freq: 396, name: "Liberation", description: "396 Hz dissolves guilt patterns and frees the subconscious from self-punishment loops." },
  Apathy: { freq: 417, name: "Change", description: "417 Hz facilitates change and undoing situations. It breaks crystallized emotional patterns." },
  Grief: { freq: 417, name: "Change", description: "417 Hz helps process grief by facilitating emotional transmutation and renewal." },
  Fear: { freq: 528, name: "Transformation", description: "528 Hz — the Love frequency — repairs DNA and transforms fear into courage at the cellular level." },
  Desire: { freq: 528, name: "Transformation", description: "528 Hz redirects craving into creative transformation. The miracle tone of manifestation." },
  Anger: { freq: 639, name: "Connection", description: "639 Hz harmonizes relationships and transmutes anger into constructive communication." },
  Pride: { freq: 639, name: "Connection", description: "639 Hz dissolves ego barriers and opens the heart to genuine connection beyond pride." },
  Courage: { freq: 741, name: "Expression", description: "741 Hz awakens intuition and authentic self-expression. Your voice becomes your power." },
  Neutrality: { freq: 741, name: "Expression", description: "741 Hz deepens your neutral awareness with clearer perception and intuitive knowing." },
  Willingness: { freq: 852, name: "Awakening", description: "852 Hz activates the third eye and deepens intuitive sight. Spiritual perception sharpens." },
  Acceptance: { freq: 852, name: "Awakening", description: "852 Hz elevates your acceptance into spiritual awakening. The inner eye opens wider." },
  Reason: { freq: 963, name: "Divine Connection", description: "963 Hz connects you to pure consciousness. The crown opens to universal wisdom." },
  Love: { freq: 852, name: "Awakening", description: "852 Hz activates the third eye and deepens intuitive sight. At your frequency, the next leap is from Love to sustained Joy." },
  Joy: { freq: 963, name: "Divine Connection", description: "963 Hz — the God frequency — connects to infinite consciousness. Pure radiance." },
  Peace: { freq: 963, name: "Divine Connection", description: "963 Hz sustains your connection to the infinite field. Bliss stabilizes." },
  Enlightenment: { freq: 963, name: "Divine Connection", description: "963 Hz maintains your alignment with pure source consciousness." },
};

/* ─── Arc Gauge Component ─── */

function ArcGauge({ level, calibration }: { level: HawkinsLevel; calibration: number }) {
  const radius = 120;
  const cx = 150;
  const cy = 150;
  const startAngle = Math.PI;
  const endAngle = 0;

  // Position on arc based on level's arcDeg (0-180)
  const angle = Math.PI - (level.arcDeg / 180) * Math.PI;
  const dotX = cx + radius * Math.cos(angle);
  const dotY = cy - radius * Math.sin(angle);

  // Arc path for background
  const arcPath = (start: number, end: number) => {
    const x1 = cx + radius * Math.cos(start);
    const y1 = cy - radius * Math.sin(start);
    const x2 = cx + radius * Math.cos(end);
    const y2 = cy - radius * Math.sin(end);
    return `M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`;
  };

  // Filled arc from start to current position
  const filledArcEnd = angle;
  const filledPath = arcPath(startAngle, filledArcEnd);
  const bgPath = arcPath(startAngle, endAngle);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 300 170" className="w-64 h-auto">
        {/* Background arc */}
        <path d={bgPath} fill="none" stroke="hsl(var(--muted) / 0.3)" strokeWidth="12" strokeLinecap="round" />
        {/* Filled arc */}
        <path d={filledPath} fill="none" stroke={level.color} strokeWidth="12" strokeLinecap="round" />
        {/* Glow */}
        <circle cx={dotX} cy={dotY} r="8" fill={level.color} opacity="0.6">
          <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx={dotX} cy={dotY} r="5" fill={level.color} />
      </svg>
      <h2 className="text-3xl font-display font-bold mt-[-10px]" style={{ color: level.color }}>
        {level.level}
      </h2>
      <p className="text-sm text-muted-foreground italic">{level.emotion}</p>
      <p className="text-sm text-foreground/70 text-center mt-2 max-w-xs">
        {level.description}
      </p>
    </div>
  );
}

/* ─── Quiz Screen ─── */

function QuizScreen({ onComplete }: { onComplete: (answers: number[]) => void }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);

  const q = QUIZ_QUESTIONS[currentQ];
  const progress = ((currentQ + 1) / QUIZ_QUESTIONS.length) * 100;

  const handleAnswer = (score: number) => {
    const newAnswers = [...answers, score];
    if (currentQ + 1 >= QUIZ_QUESTIONS.length) {
      onComplete(newAnswers);
    } else {
      setAnswers(newAnswers);
      setCurrentQ(currentQ + 1);
    }
  };

  return (
    <div className="space-y-6 mt-2 animate-fade-up">
      {/* Progress */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <p className="text-[11px] uppercase tracking-[0.2em] text-primary font-bold">
            {q.category}
          </p>
          <span className="text-sm text-muted-foreground">{currentQ + 1}/{QUIZ_QUESTIONS.length}</span>
        </div>
        <div className="w-full h-1.5 bg-muted/30 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: `linear-gradient(90deg, hsl(43, 90%, 67%), hsl(170, 50%, 45%))` }}
          />
        </div>
      </div>

      {/* Question */}
      <h2 className="text-xl font-display font-bold text-foreground leading-tight">
        {q.question}
      </h2>

      {/* Answers */}
      <div className="space-y-3">
        {q.answers.map((answer, i) => (
          <button
            key={i}
            onClick={() => handleAnswer(answer.score)}
            className="w-full text-left card-cosmic rounded-xl p-4 text-sm text-foreground/90 hover:border-primary/40 transition-all active:scale-[0.98]"
          >
            {answer.text}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Results Screen ─── */

function ResultsScreen({
  answers,
  onScanAgain,
  onOpenSonicAlchemy,
  userName,
  birthPlace,
  birthTime,
  dateOfBirth,
}: {
  answers: number[];
  onScanAgain: () => void;
  onOpenSonicAlchemy: () => void;
  userName: string;
  birthPlace: string | null;
  birthTime: string | null;
  dateOfBirth: string | null;
}) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const totalScore = answers.reduce((a, b) => a + b, 0);
  const result = getHawkinsLevel(totalScore);
  const prescription = SONIC_PRESCRIPTIONS[result.current.level] || SONIC_PRESCRIPTIONS["Courage"];

  // Cache key for AI reading
  const cacheKey = `freq_${totalScore}`;
  const { content: aiReading, isLoading: readingLoading } = useCachedReading({
    readingType: "frequency_reading",
    cacheKey,
    context: {
      level: result.current.level,
      emotion: result.current.emotion,
      calibration: result.calibration,
      totalScore,
      answers: answers.map((a, i) => ({ category: QUIZ_QUESTIONS[i].category, score: a })),
      name: userName,
      nextLevel: result.next?.level || "Beyond",
      pointsToNext: result.pointsToNext,
      birthPlace: birthPlace || "Unknown",
      birthTime: birthTime || "Unknown",
      dateOfBirth: dateOfBirth || "Unknown",
    },
  });

  // Parse AI reading JSON
  const reading = useMemo(() => {
    if (!aiReading) return null;
    try {
      const cleaned = aiReading.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      return JSON.parse(cleaned);
    } catch {
      return { reading: aiReading, shadow: "", gift: "" };
    }
  }, [aiReading]);

  const handleShare = async () => {
    const text = `My consciousness frequency: ${result.current.level} (${result.calibration}) — ${result.current.emotion}. Scanned with DCode.`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "My Frequency — DCode", text });
      } catch {}
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  return (
    <div className="space-y-5 mt-2 animate-fade-up">
      {/* Arc Gauge */}
      <div className="card-cosmic rounded-2xl p-6 flex flex-col items-center">
        <ArcGauge level={result.current} calibration={result.calibration} />

        {result.next && (
          <p className="text-sm text-muted-foreground mt-4">
            <span className="font-bold" style={{ color: result.next.color }}>{result.pointsToNext}</span>
            {" "}points to {result.next.level}
          </p>
        )}

        {result.next && (
          <p className="text-xs text-foreground/60 text-center mt-2 max-w-xs">
            Moving from {result.current.level} to {result.next.level}{" "}
            {result.current.level === "Love"
              ? "means the heart has stabilized and begun to radiate. Compassion becomes effortless."
              : result.current.level === "Courage"
              ? "means expanding your comfort zone into genuine trust. Outcomes matter less."
              : `means deepening your ${result.current.emotion.toLowerCase()} into ${result.next.emotion.toLowerCase()}.`}
          </p>
        )}
      </div>

      {/* AI Reading */}
      <div className="card-cosmic rounded-2xl p-5">
        <p className="text-[11px] uppercase tracking-[0.2em] text-primary/70 font-bold mb-3">
          YOUR READING
        </p>
        {readingLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Channeling your frequency...</span>
          </div>
        ) : (
          <p className="text-base text-foreground/90 leading-relaxed font-display">
            {reading?.reading || "Your consciousness field resonates at a powerful frequency."}
          </p>
        )}
      </div>

      {/* Shadow & Gift */}
      {reading && (reading.shadow || reading.gift) && (
        <div className="grid grid-cols-2 gap-3">
          {reading.shadow && (
            <div className="card-cosmic rounded-2xl p-4">
              <p className="text-[10px] uppercase tracking-[0.15em] text-destructive font-bold mb-2">
                SHADOW
              </p>
              <p className="text-xs text-foreground/80 leading-relaxed">
                {reading.shadow}
              </p>
            </div>
          )}
          {reading.gift && (
            <div className="card-cosmic rounded-2xl p-4">
              <p className="text-[10px] uppercase tracking-[0.15em] text-primary font-bold mb-2">
                GIFT
              </p>
              <p className="text-xs text-foreground/80 leading-relaxed">
                {reading.gift}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Score Breakdown */}
      <button
        onClick={() => setShowBreakdown(!showBreakdown)}
        className="card-cosmic rounded-2xl p-4 w-full flex items-center justify-between"
      >
        <p className="text-[11px] uppercase tracking-[0.2em] text-primary/70 font-bold">
          SCORE BREAKDOWN
        </p>
        {showBreakdown ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {showBreakdown && (
        <div className="space-y-2 animate-fade-up">
          {answers.map((score, i) => (
            <div key={i} className="card-cosmic rounded-xl p-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{QUIZ_QUESTIONS[i].category}</span>
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <div
                      key={s}
                      className="w-2 h-2 rounded-full"
                      style={{
                        background: s <= score ? result.current.color : "hsl(var(--muted) / 0.3)",
                      }}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-foreground/70">{score}/5</span>
              </div>
            </div>
          ))}
          <div className="card-cosmic rounded-xl p-3 flex items-center justify-between border-primary/20">
            <span className="text-xs font-bold text-primary">TOTAL</span>
            <span className="text-sm font-bold text-primary">{totalScore}/50</span>
          </div>
        </div>
      )}

      {/* Sonic Prescription */}
      <div className="card-cosmic rounded-2xl p-5 space-y-3">
        <p className="text-[11px] uppercase tracking-[0.2em] text-primary/70 font-bold">
          YOUR SONIC PRESCRIPTION
        </p>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <span className="text-sm font-display font-bold text-primary">{prescription.freq}</span>
          </div>
          <div>
            <p className="text-base font-display font-bold text-foreground">
              {prescription.freq} Hz — {prescription.name}
            </p>
          </div>
        </div>
        <p className="text-sm text-foreground/70 leading-relaxed">
          {prescription.description}
        </p>
        <button
          onClick={onOpenSonicAlchemy}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm transition-all hover:bg-primary/90 active:scale-[0.98]"
        >
          Open Sonic Alchemy →
        </button>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onScanAgain}
          className="card-cosmic rounded-xl p-3 flex items-center justify-center gap-2 text-sm font-display font-bold text-foreground/80 hover:text-foreground transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Scan Again
        </button>
        <button
          onClick={handleShare}
          className="rounded-xl p-3 flex items-center justify-center gap-2 text-sm font-display font-bold text-primary-foreground transition-colors"
          style={{ background: `linear-gradient(135deg, hsl(30, 80%, 55%), hsl(40, 90%, 60%))` }}
        >
          <Share2 className="w-4 h-4" />
          Share Result
        </button>
      </div>
    </div>
  );
}

/* ─── Main Chamber ─── */

export function FrequencyChamber({ onBack }: { onBack: () => void }) {
  const { profile } = useAuth();
  const [phase, setPhase] = useState<"quiz" | "results">("quiz");
  const [answers, setAnswers] = useState<number[]>([]);

  const handleComplete = (quizAnswers: number[]) => {
    setAnswers(quizAnswers);
    setPhase("results");
  };

  const handleScanAgain = () => {
    setAnswers([]);
    setPhase("quiz");
  };

  const handleOpenSonicAlchemy = () => {
    // Navigate back and then to vault/sonic alchemy
    onBack();
    // Small delay to let state reset, then trigger sonic alchemy
    setTimeout(() => {
      const event = new CustomEvent("openChamber", { detail: "vault" });
      window.dispatchEvent(event);
    }, 100);
  };

  return (
    <ChamberLayout title="Frequency Scanner" subtitle="Consciousness Level" onBack={onBack}>
      {phase === "quiz" ? (
        <QuizScreen onComplete={handleComplete} />
      ) : (
        <ResultsScreen
          answers={answers}
          onScanAgain={handleScanAgain}
          onOpenSonicAlchemy={handleOpenSonicAlchemy}
          userName={profile?.fullName || ""}
          birthPlace={profile?.birthPlace || null}
          birthTime={profile?.birthTime || null}
          dateOfBirth={profile?.dateOfBirth || null}
        />
      )}
    </ChamberLayout>
  );
}
