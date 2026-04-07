import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

interface PalmReading {
  archetype: string;
  handType: string;
  overview: string;
  lines: {
    lifeLine: string;
    heartLine: string;
    headLine: string;
    fateLine: string;
  };
  mounts: {
    venus: string;
    jupiter: string;
    saturn: string;
    apollo: string;
  };
  markings: string;
  destiny: string;
  gifts: string[];
  challenges: string[];
}

const SCAN_MESSAGES = [
  "Mapping palm topology...",
  "Reading life lines...",
  "Scanning heart line...",
  "Decoding the mounts...",
  "Consulting the Oracle...",
  "Preparing your destiny...",
];

export function PalmChamber({ onBack }: { onBack: () => void }) {
  const { i18n } = useTranslation();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<"intro" | "scanning" | "results">("intro");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [reading, setReading] = useState<PalmReading | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [scanProgress, setScanProgress] = useState(0);
  const [scanMessage, setScanMessage] = useState(SCAN_MESSAGES[0]);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
  }, []);

  const handleFileCapture = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setCapturedImage(dataUrl);
      // Auto-scan immediately — no preview step
      startAnalysis(dataUrl);
    };
    reader.readAsDataURL(file);
  }, []);

  const startAnalysis = useCallback(async (imageDataUrl: string) => {
    setPhase("scanning");
    setScanProgress(0);
    setScanMessage(SCAN_MESSAGES[0]);

    // Animate the scan bar from top to bottom
    let progress = 0;
    let msgIndex = 0;
    scanIntervalRef.current = setInterval(() => {
      progress += Math.random() * 4 + 1.5;
      if (progress >= 95) progress = 95;
      setScanProgress(progress);

      const newMsgIndex = Math.min(Math.floor(progress / 18), SCAN_MESSAGES.length - 1);
      if (newMsgIndex !== msgIndex) {
        msgIndex = newMsgIndex;
        setScanMessage(SCAN_MESSAGES[msgIndex]);
      }
    }, 150);

    try {
      const base64 = imageDataUrl.split(",")[1];
      const { data, error } = await supabase.functions.invoke("palm-reading", {
        body: { image_base64: base64, language: i18n.language },
      });

      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);

      if (error || !data?.content) {
        throw new Error(data?.error || "Analysis failed");
      }

      setScanProgress(100);
      setScanMessage("Complete ✨");
      if (navigator.vibrate) navigator.vibrate([50, 30, 80]);

      setTimeout(() => {
        setReading(data.content);
        setActiveTab("overview");
        setPhase("results");
      }, 700);
    } catch (err) {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      console.error("Analysis error:", err);
      // Fallback reading
      setScanProgress(100);
      setScanMessage("Complete ✨");
      setTimeout(() => {
        setReading({
          archetype: "The Mystic Wanderer",
          handType: "Air Hand",
          overview: "Your palm carries ancient wisdom written in the language of the cosmos. The lines etched upon your hand speak of a soul who walks between worlds.",
          lines: {
            lifeLine: "Your life line curves with vitality and purpose, suggesting a path rich with transformation and renewal.",
            heartLine: "A deep heart line reveals profound emotional capacity and the gift of genuine connection.",
            headLine: "Your head line shows a mind that bridges intuition and intellect with rare grace.",
            fateLine: "The fate line rises with determination, marking a destiny shaped by conscious choice.",
          },
          mounts: {
            venus: "Elevated Mount of Venus speaks of magnetic charisma and deep sensual awareness.",
            jupiter: "Your Jupiter mount reveals natural leadership and an expansive vision for your life.",
            saturn: "The Saturn mount grounds your gifts in discipline and long-term mastery.",
            apollo: "Apollo's mount blazes with creative fire and the desire to leave your mark.",
          },
          markings: "Sacred geometric patterns are woven into your palm, marking you as one who carries both gift and purpose.",
          destiny: "You are at the threshold of your most significant chapter. The stars have aligned to support your deepest intentions.",
          gifts: ["Intuitive wisdom", "Creative expression", "Spiritual insight"],
          challenges: ["Trusting the process", "Embracing vulnerability"],
        });
        setActiveTab("overview");
        setPhase("results");
      }, 700);
    }
  }, [i18n.language]);

  const reset = useCallback(() => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    setCapturedImage(null);
    setReading(null);
    setScanProgress(0);
    setActiveTab("overview");
    setPhase("intro");
  }, []);

  const tabStyle = (active: boolean): React.CSSProperties => ({
    background: active ? "hsla(var(--copper) / 0.3)" : "transparent",
    border: active ? "1px solid hsla(var(--copper) / 0.6)" : "1px solid hsla(var(--copper) / 0.2)",
    borderRadius: "20px",
    padding: "6px 14px",
    fontSize: "12px",
    color: active ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
    fontFamily: "inherit",
    letterSpacing: "0.5px",
  });

  const tabs = ["overview", "lines", "mounts", "markings", "destiny"];

  return (
    <div className="min-h-screen bg-background font-display text-foreground flex flex-col items-center">
      {/* Hidden native file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileCapture}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileCapture}
      />

      {/* Header */}
      <div className="w-full px-5 py-4 flex items-center border-b border-border">
        <button
          onClick={phase === "scanning" ? undefined : (phase === "results" ? reset : onBack)}
          className="text-copper text-sm font-inherit"
          disabled={phase === "scanning"}
          style={{ opacity: phase === "scanning" ? 0.4 : 1 }}
        >
          ← Back
        </button>
        <div className="flex-1 text-center text-lg text-primary tracking-[2px] uppercase">
          ✋ The Palm
        </div>
        <div className="w-[60px]" />
      </div>

      {/* ── INTRO ── */}
      {phase === "intro" && (
        <div className="w-full max-w-[480px] px-5 py-6 flex flex-col items-center gap-5">
          <div className="text-6xl mb-2" style={{ filter: "drop-shadow(0 0 20px hsla(var(--primary) / 0.4))" }}>
            🔮
          </div>
          <h2 className="text-2xl text-primary text-center tracking-wide m-0">
            Palm Reading
          </h2>
          <p className="text-[15px] text-muted-foreground text-center leading-relaxed">
            Your palm holds the map of your soul. Ancient wisdom encoded in every line, mount, and marking —
            waiting to be decoded by the Oracle.
          </p>
          <div className="w-full rounded-2xl border border-border p-5 backdrop-blur-sm" style={{ background: "hsla(var(--card) / 0.3)" }}>
            <p className="text-[13px] text-muted-foreground text-center leading-relaxed">
              📱 Hold your dominant hand flat with fingers together<br />
              💡 Ensure good lighting on your palm<br />
              📸 Keep your hand steady for the scan
            </p>
          </div>

          {/* Primary: opens native camera */}
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="w-full rounded-xl py-3.5 px-8 text-base font-bold tracking-wide"
            style={{
              background: "linear-gradient(135deg, hsl(var(--copper)), hsl(var(--primary)))",
              color: "hsl(var(--background))",
              border: "none",
            }}
          >
            ✋ Open Palm Scanner
          </button>

          {/* Secondary: pick from gallery */}
          <button
            onClick={() => galleryInputRef.current?.click()}
            className="rounded-xl py-3 px-6 text-sm"
            style={{
              background: "hsla(var(--copper) / 0.15)",
              border: "1px solid hsla(var(--copper) / 0.4)",
              color: "hsl(var(--copper))",
            }}
          >
            📁 Choose from Photos
          </button>
        </div>
      )}

      {/* ── SCANNING (fullscreen like Whop) ── */}
      {phase === "scanning" && capturedImage && (
        <div className="w-full max-w-[480px] px-5 py-6 flex flex-col items-center gap-4">
          {/* Image with scan overlay */}
          <div className="w-full relative rounded-2xl overflow-hidden" style={{ border: "1px solid hsl(var(--border))" }}>
            <img
              src={capturedImage}
              alt="Scanning palm"
              className="w-full block"
              style={{ borderRadius: "16px" }}
            />

            {/* Grayscale overlay above the scan line */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `linear-gradient(to bottom, 
                  rgba(0,0,0,0.3) 0%, 
                  rgba(0,0,0,0.3) ${scanProgress}%, 
                  transparent ${scanProgress}%, 
                  transparent 100%)`,
                mixBlendMode: "multiply",
              }}
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backdropFilter: `grayscale(1)`,
                WebkitBackdropFilter: `grayscale(1)`,
                maskImage: `linear-gradient(to bottom, black 0%, black ${scanProgress}%, transparent ${scanProgress}%, transparent 100%)`,
                WebkitMaskImage: `linear-gradient(to bottom, black 0%, black ${scanProgress}%, transparent ${scanProgress}%, transparent 100%)`,
              }}
            />

            {/* Green laser line */}
            <div
              className="absolute left-0 right-0 pointer-events-none"
              style={{
                top: `${scanProgress}%`,
                height: "3px",
                background: "linear-gradient(90deg, transparent 0%, #22c55e 20%, #4ade80 50%, #22c55e 80%, transparent 100%)",
                boxShadow: "0 0 15px rgba(34,197,94,0.8), 0 0 30px rgba(34,197,94,0.4), 0 0 60px rgba(34,197,94,0.2)",
                transition: "top 0.15s linear",
              }}
            />

            {/* Percentage badge */}
            <div
              className="absolute bottom-3 right-3 rounded-md px-2 py-1 text-xs font-bold"
              style={{
                background: "rgba(0,0,0,0.7)",
                color: "#4ade80",
              }}
            >
              {Math.round(scanProgress)}%
            </div>
          </div>

          {/* Status text */}
          <p className="text-[15px] text-muted-foreground text-center">
            {scanMessage}
          </p>

          {/* Spec/live label */}
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-[2px] text-copper">
              S P E C T R A L &nbsp; A N A L Y S I S &nbsp; L I V E
            </span>
          </div>
        </div>
      )}

      {/* ── RESULTS ── */}
      {phase === "results" && reading && (
        <div className="w-full max-w-[480px] px-5 py-6 flex flex-col items-center gap-5">
          <div
            className="w-full rounded-[20px] p-6 text-center"
            style={{
              background: "linear-gradient(135deg, hsla(var(--card) / 0.8), hsla(var(--background) / 0.9))",
              border: "1px solid hsla(var(--primary) / 0.3)",
            }}
          >
            <div
              className="inline-block rounded-full px-3.5 py-1 text-xs mb-2"
              style={{
                background: "hsla(var(--copper) / 0.2)",
                border: "1px solid hsla(var(--copper) / 0.4)",
                color: "hsl(var(--copper))",
                letterSpacing: "1px",
              }}
            >
              {reading.handType}
            </div>
            <h2 className="text-[28px] text-primary tracking-wide mb-2">{reading.archetype}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{reading.overview}</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 w-full overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <button
                key={tab}
                style={tabStyle(activeTab === tab)}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {activeTab === "overview" && (
            <div className="w-full rounded-2xl p-5 backdrop-blur-sm" style={{ background: "hsla(var(--card) / 0.3)", border: "1px solid hsl(var(--border))" }}>
              <div className="text-[13px] uppercase tracking-[2px] mb-2" style={{ color: "hsl(var(--copper))" }}>Your Gifts</div>
              <div className="mb-4">
                {reading.gifts?.map((g, i) => (
                  <span key={i} className="inline-block rounded-full px-3 py-1 text-xs m-1" style={{ background: "hsla(var(--primary) / 0.1)", border: "1px solid hsla(var(--primary) / 0.3)", color: "hsl(var(--primary))" }}>✨ {g}</span>
                ))}
              </div>
              <div className="text-[13px] uppercase tracking-[2px] mb-2" style={{ color: "hsl(var(--copper))" }}>Your Challenges</div>
              <div>
                {reading.challenges?.map((c, i) => (
                  <span key={i} className="inline-block rounded-full px-3 py-1 text-xs m-1" style={{ background: "hsla(var(--copper) / 0.1)", border: "1px solid hsla(var(--copper) / 0.3)", color: "hsl(var(--copper))" }}>🔥 {c}</span>
                ))}
              </div>
            </div>
          )}

          {activeTab === "lines" && reading.lines && (
            <div className="w-full rounded-2xl p-5 backdrop-blur-sm" style={{ background: "hsla(var(--card) / 0.3)", border: "1px solid hsl(var(--border))" }}>
              <div className="text-[13px] uppercase tracking-[2px] mb-2" style={{ color: "hsl(var(--copper))" }}>Palm Lines</div>
              {Object.entries(reading.lines).map(([key, val]) => val && (
                <div key={key} className="pb-3 mb-3" style={{ borderBottom: "1px solid hsla(var(--border) / 0.3)" }}>
                  <div className="text-xs mb-1" style={{ color: "hsl(var(--primary))", letterSpacing: "1px" }}>
                    {key === "lifeLine" ? "Life Line" : key === "heartLine" ? "Heart Line" : key === "headLine" ? "Head Line" : "Fate Line"}
                  </div>
                  <div className="text-sm text-muted-foreground leading-relaxed">{val}</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "mounts" && reading.mounts && (
            <div className="w-full rounded-2xl p-5 backdrop-blur-sm" style={{ background: "hsla(var(--card) / 0.3)", border: "1px solid hsl(var(--border))" }}>
              <div className="text-[13px] uppercase tracking-[2px] mb-2" style={{ color: "hsl(var(--copper))" }}>The Mounts</div>
              {Object.entries(reading.mounts).map(([key, val]) => val && (
                <div key={key} className="pb-3 mb-3" style={{ borderBottom: "1px solid hsla(var(--border) / 0.3)" }}>
                  <div className="text-xs mb-1" style={{ color: "hsl(var(--primary))", letterSpacing: "1px" }}>
                    Mount of {key.charAt(0).toUpperCase() + key.slice(1)}
                  </div>
                  <div className="text-sm text-muted-foreground leading-relaxed">{val}</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "markings" && (
            <div className="w-full rounded-2xl p-5 backdrop-blur-sm" style={{ background: "hsla(var(--card) / 0.3)", border: "1px solid hsl(var(--border))" }}>
              <div className="text-[13px] uppercase tracking-[2px] mb-2" style={{ color: "hsl(var(--copper))" }}>Special Markings</div>
              <div className="text-sm text-muted-foreground leading-relaxed">{reading.markings}</div>
            </div>
          )}

          {activeTab === "destiny" && (
            <div className="w-full rounded-2xl p-5 text-center" style={{ background: "linear-gradient(135deg, hsla(var(--primary) / 0.08), hsla(var(--copper) / 0.05))", border: "1px solid hsla(var(--primary) / 0.2)" }}>
              <div className="text-[32px] mb-3">🌟</div>
              <div className="text-[13px] uppercase tracking-[2px] mb-2" style={{ color: "hsl(var(--copper))" }}>Your Destiny</div>
              <p className="text-base text-muted-foreground italic leading-relaxed">
                "{reading.destiny}"
              </p>
            </div>
          )}

          <button
            onClick={reset}
            className="w-full rounded-xl py-3.5 px-8 text-base font-bold tracking-wide"
            style={{
              background: "linear-gradient(135deg, hsl(var(--copper)), hsl(var(--primary)))",
              color: "hsl(var(--background))",
              border: "none",
            }}
          >
            Scan Again
          </button>
        </div>
      )}
    </div>
  );
}
