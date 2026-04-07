import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ChamberLayout } from "@/components/ChamberLayout";
import { Camera, RotateCcw, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { startScanSound, stopScanSound } from "@/lib/scan-sound";

type Phase = "permission" | "camera" | "preview" | "scanning" | "result";
type ResultTab = "reading" | "lines" | "mounts" | "markings";

interface PalmLine {
  strength: string;
  description: string;
}

interface PalmMount {
  prominence: string;
  meaning: string;
}

interface PalmMarking {
  type: string;
  location: string;
  meaning: string;
}

interface PalmReading {
  handType: string;
  element: string;
  archetype: {
    name: string;
    traits: string[];
    summary: string;
    shadow: string;
  };
  reading: { overview: string };
  lines: Record<string, PalmLine>;
  mounts: Record<string, PalmMount>;
  markings: PalmMarking[];
}

const SCAN_PHASES = [
  { key: "heart", labelKey: "palm.scanningHeart", pct: 20 },
  { key: "head", labelKey: "palm.scanningHead", pct: 40 },
  { key: "life", labelKey: "palm.scanningLife", pct: 60 },
  { key: "fate", labelKey: "palm.scanningFate", pct: 80 },
  { key: "channel", labelKey: "palm.channeling", pct: 100 },
];

export function PalmChamber({ onBack }: { onBack: () => void }) {
  const { t, i18n } = useTranslation();
  const [phase, setPhase] = useState<Phase>("permission");
  const [imageData, setImageData] = useState<string | null>(null);
  const [reading, setReading] = useState<PalmReading | null>(null);
  const [activeTab, setActiveTab] = useState<ResultTab>("reading");
  const [scanStep, setScanStep] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const scanAnimRef = useRef<number | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 960 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setPhase("camera");
    } catch {
      toast.error(t("palm.cameraError"));
    }
  }, [t]);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setImageData(dataUrl);
    setPhase("preview");
    stopCamera();
  }, [stopCamera]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageData(reader.result as string);
      setPhase("preview");
    };
    reader.readAsDataURL(file);
  }, []);

  const analyzePalm = useCallback(async () => {
    if (!imageData) return;
    setPhase("scanning");
    setScanStep(0);
    setScanProgress(0);

    // Start scanning sound
    startScanSound();

    // Smooth laser animation from 0 to ~95% over the scan duration
    const scanDuration = SCAN_PHASES.length * 1800; // total ms
    const startTime = performance.now();
    const animateLaser = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min((elapsed / scanDuration) * 95, 95);
      setScanProgress(progress);
      if (progress < 95) {
        scanAnimRef.current = requestAnimationFrame(animateLaser);
      }
    };
    scanAnimRef.current = requestAnimationFrame(animateLaser);

    // Animate scan step labels
    const stepInterval = setInterval(() => {
      setScanStep((prev) => {
        if (prev >= SCAN_PHASES.length - 1) {
          clearInterval(stepInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 1800);

    try {
      const base64 = imageData.split(",")[1];
      const { data, error } = await supabase.functions.invoke("palm-reading", {
        body: { image_base64: base64, language: i18n.language },
      });

      clearInterval(stepInterval);
      if (scanAnimRef.current) cancelAnimationFrame(scanAnimRef.current);

      if (error) throw new Error(error.message);
      if (!data?.content) throw new Error("No reading returned");

      // Animate to 100%
      setScanStep(SCAN_PHASES.length - 1);
      setScanProgress(100);
      await new Promise((r) => setTimeout(r, 800));

      stopScanSound();
      setReading(data.content);
      setActiveTab("reading");
      setPhase("result");
    } catch (err) {
      clearInterval(stepInterval);
      if (scanAnimRef.current) cancelAnimationFrame(scanAnimRef.current);
      stopScanSound();
      const msg = err instanceof Error ? err.message : "Analysis failed";
      toast.error(msg);
      setPhase("preview");
    }
  }, [imageData, i18n.language]);

  const reset = useCallback(() => {
    setPhase("permission");
    setImageData(null);
    setReading(null);
    setScanStep(0);
    setScanProgress(0);
    stopScanSound();
  }, []);

  // Cleanup camera on unmount
  useEffect(() => () => stopCamera(), [stopCamera]);

  const currentScan = SCAN_PHASES[scanStep] || SCAN_PHASES[0];

  return (
    <ChamberLayout title={t("palm.title")} subtitle={t("palm.subtitle")} onBack={onBack}>
      <canvas ref={canvasRef} className="hidden" />
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />

      {/* ── PERMISSION SCREEN ── */}
      {phase === "permission" && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-up px-4">
          <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
            style={{ backgroundColor: "hsl(160, 30%, 25%)" }}>
            <Camera className="w-10 h-10" style={{ color: "hsl(160, 50%, 55%)" }} />
          </div>
          <h2 className="font-display text-xl font-bold text-foreground text-center mb-3">
            {t("palm.needsAccess")}
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-8 max-w-xs leading-relaxed">
            {t("palm.privacyNote")}
          </p>
          <Button
            onClick={startCamera}
            className="w-full max-w-xs h-14 rounded-2xl bg-primary text-primary-foreground font-display text-lg font-bold hover:bg-primary/90"
          >
            {t("palm.openCamera")}
          </Button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 text-sm text-muted-foreground flex items-center gap-2 hover:text-foreground transition-colors"
          >
            <Upload className="w-4 h-4" /> {t("palm.uploadInstead")}
          </button>
        </div>
      )}

      {/* ── LIVE CAMERA ── */}
      {phase === "camera" && (
        <div className="mt-4 animate-fade-up">
          <div className="relative rounded-2xl overflow-hidden bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full aspect-[3/4] object-cover"
            />
            {/* Scan guide overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[70%] h-[60%] border-2 border-primary/40 rounded-3xl" />
            </div>
            <p className="absolute top-4 left-0 right-0 text-center text-xs text-foreground/70 font-display">
              {t("palm.positionHand")}
            </p>
          </div>
          <div className="flex gap-3 mt-4">
            <Button
              onClick={() => { stopCamera(); setPhase("permission"); }}
              variant="ghost"
              className="flex-1 card-cosmic border-copper rounded-xl h-12 font-display"
            >
              {t("palm.cancel")}
            </Button>
            <Button
              onClick={capturePhoto}
              className="flex-1 bg-primary text-primary-foreground rounded-xl h-12 font-display hover:bg-primary/90"
            >
              <Camera className="w-4 h-4 mr-2" /> {t("palm.capture")}
            </Button>
          </div>
        </div>
      )}

      {/* ── PREVIEW ── */}
      {phase === "preview" && imageData && (
        <div className="space-y-4 mt-4 animate-fade-up">
          <div className="relative rounded-2xl overflow-hidden">
            <img src={imageData} alt="Palm" className="w-full rounded-2xl" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={reset} variant="ghost" className="card-cosmic border-copper rounded-xl h-12 font-display">
              <RotateCcw className="w-4 h-4 mr-2" /> {t("palm.retake")}
            </Button>
            <Button onClick={analyzePalm} className="bg-primary text-primary-foreground rounded-xl h-12 font-display hover:bg-primary/90">
              {t("palm.analyze")}
            </Button>
          </div>
        </div>
      )}

      {/* ── SCANNING ANIMATION ── */}
      {phase === "scanning" && imageData && (
        <div className="mt-4 animate-fade-up">
          <div className="relative rounded-2xl overflow-hidden">
            {/* Palm image with dramatic filter */}
            <img
              src={imageData}
              alt="Palm"
              className="w-full rounded-2xl"
              style={{ filter: "grayscale(0.6) brightness(0.7) contrast(1.2)" }}
            />

            {/* Full-screen green tint overlay */}
            <div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                background: "radial-gradient(ellipse at center, hsl(160, 60%, 40%, 0.15) 0%, hsl(160, 80%, 20%, 0.25) 70%, hsl(160, 90%, 10%, 0.4) 100%)",
                mixBlendMode: "screen",
              }}
            />

            {/* Animated scan grid lines */}
            <div
              className="absolute inset-0 rounded-2xl pointer-events-none opacity-20"
              style={{
                backgroundImage: `
                  repeating-linear-gradient(0deg, transparent, transparent 29px, hsl(160, 50%, 55%, 0.3) 30px),
                  repeating-linear-gradient(90deg, transparent, transparent 29px, hsl(160, 50%, 55%, 0.15) 30px)
                `,
                backgroundSize: "30px 30px",
              }}
            />

            {/* PRIMARY LASER LINE — bright green, tall glow */}
            <div
              className="absolute left-0 right-0 transition-all duration-[1600ms] ease-in-out"
              style={{
                top: `${currentScan.pct}%`,
                height: "3px",
                background: "linear-gradient(90deg, transparent 0%, hsl(145, 100%, 60%) 15%, hsl(145, 100%, 75%) 50%, hsl(145, 100%, 60%) 85%, transparent 100%)",
                boxShadow: `
                  0 0 8px 2px hsl(145, 100%, 55%, 0.8),
                  0 0 25px 8px hsl(145, 100%, 50%, 0.5),
                  0 0 60px 20px hsl(145, 80%, 45%, 0.3),
                  0 0 100px 40px hsl(145, 60%, 40%, 0.15)
                `,
              }}
            />

            {/* Secondary trailing glow below laser */}
            <div
              className="absolute left-0 right-0 transition-all duration-[1600ms] ease-in-out pointer-events-none"
              style={{
                top: `${Math.min(currentScan.pct + 1, 100)}%`,
                height: "40px",
                background: "linear-gradient(180deg, hsl(145, 100%, 55%, 0.2) 0%, transparent 100%)",
              }}
            />

            {/* Corner brackets — sci-fi targeting UI */}
            <div className="absolute inset-4 pointer-events-none">
              {/* Top-left */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 rounded-tl-md" style={{ borderColor: "hsl(145, 80%, 55%, 0.6)" }} />
              {/* Top-right */}
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 rounded-tr-md" style={{ borderColor: "hsl(145, 80%, 55%, 0.6)" }} />
              {/* Bottom-left */}
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 rounded-bl-md" style={{ borderColor: "hsl(145, 80%, 55%, 0.6)" }} />
              {/* Bottom-right */}
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 rounded-br-md" style={{ borderColor: "hsl(145, 80%, 55%, 0.6)" }} />
            </div>

            {/* Progress badge */}
            <div className="absolute bottom-3 right-3 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-primary/20">
              <span className="text-sm font-display font-bold" style={{ color: "hsl(145, 80%, 55%)" }}>{currentScan.pct}%</span>
            </div>

            {/* Scan type badge */}
            <div className="absolute top-3 left-3 bg-background/60 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-primary/10">
              <span className="text-[10px] uppercase tracking-[0.15em] font-display font-bold" style={{ color: "hsl(145, 60%, 55%)" }}>
                ◉ {t("palm.palmScan")}
              </span>
            </div>
          </div>

          {/* Status text */}
          <div className="text-center mt-5 space-y-2">
            <p className="font-display text-lg font-bold animate-pulse" style={{ color: "hsl(145, 70%, 55%)" }}>
              {t(currentScan.labelKey)}
            </p>
            {/* Mini progress bar */}
            <div className="w-48 h-1 mx-auto rounded-full overflow-hidden" style={{ backgroundColor: "hsl(160, 20%, 15%)" }}>
              <div
                className="h-full rounded-full transition-all duration-[1600ms] ease-in-out"
                style={{
                  width: `${currentScan.pct}%`,
                  background: "linear-gradient(90deg, hsl(145, 80%, 40%), hsl(145, 100%, 55%))",
                  boxShadow: "0 0 8px hsl(145, 100%, 55%, 0.5)",
                }}
              />
            </div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground/60">
              {t("palm.speculative")}
            </p>
          </div>
        </div>
      )}

      {/* ── RESULTS ── */}
      {phase === "result" && reading && (
        <div className="mt-4 space-y-4 animate-fade-up">
          {/* Header: Hand type + thumbnail */}
          <div className="text-center space-y-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-primary/70">
              {t("palm.palmReading")}
            </p>
            {imageData && (
              <div className="w-24 h-24 rounded-full mx-auto overflow-hidden border-2 border-primary/30">
                <img src={imageData} alt="Palm" className="w-full h-full object-cover" />
              </div>
            )}
            <h2 className="font-display text-2xl font-bold text-foreground">{reading.handType}</h2>
            <p className="text-sm text-primary">{reading.element}</p>
          </div>

          {/* Scan Another */}
          <Button
            onClick={reset}
            variant="ghost"
            className="w-full card-cosmic border-copper rounded-xl h-12 font-display"
          >
            <Camera className="w-4 h-4 mr-2" /> {t("palm.newScan")}
          </Button>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
            {(["reading", "lines", "mounts", "markings"] as ResultTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full text-sm font-display whitespace-nowrap transition-colors ${
                  activeTab === tab
                    ? "bg-primary/20 text-primary font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "reading" && "◉ "}
                {tab === "lines" && "≈ "}
                {tab === "mounts" && "△ "}
                {tab === "markings" && "✦ "}
                {t(`palm.tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="card-cosmic rounded-2xl p-5 glow-gold relative overflow-hidden">
            <div className="animate-shimmer absolute inset-0 pointer-events-none rounded-2xl" />

            {activeTab === "reading" && (
              <div className="space-y-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-1">
                    {t("palm.palmArchetype")}
                  </p>
                  <h3 className="font-display text-xl font-bold text-primary">
                    {reading.archetype.name}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {reading.archetype.traits.map((trait) => (
                    <span key={trait} className="px-3 py-1 rounded-full text-xs font-display border border-primary/30 text-primary/90 bg-primary/5">
                      {trait}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {reading.archetype.summary}
                </p>
                <p className="text-sm text-primary/60 italic leading-relaxed">
                  {reading.archetype.shadow}
                </p>
                {reading.reading?.overview && (
                  <div className="pt-3 border-t border-copper">
                    <p className="text-sm text-foreground/85 leading-relaxed">
                      {reading.reading.overview}
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "lines" && reading.lines && (
              <div className="space-y-5">
                {Object.entries(reading.lines).map(([key, line]) => (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-display text-sm font-bold text-foreground capitalize">
                        {t(`palm.line_${key}`)}
                      </h4>
                      <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        line.strength === "strong" ? "bg-emerald-500/20 text-emerald-400" :
                        line.strength === "moderate" ? "bg-amber-500/20 text-amber-400" :
                        line.strength === "absent" ? "bg-muted/30 text-muted-foreground" :
                        "bg-blue-500/20 text-blue-400"
                      }`}>
                        {line.strength}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{line.description}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "mounts" && reading.mounts && (
              <div className="space-y-5">
                {Object.entries(reading.mounts).map(([key, mount]) => (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-display text-sm font-bold text-foreground capitalize">
                        {t(`palm.mount_${key}`)}
                      </h4>
                      <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        mount.prominence === "high" ? "bg-emerald-500/20 text-emerald-400" :
                        mount.prominence === "moderate" ? "bg-amber-500/20 text-amber-400" :
                        "bg-muted/30 text-muted-foreground"
                      }`}>
                        {mount.prominence}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{mount.meaning}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "markings" && (
              <div className="space-y-5">
                {reading.markings && reading.markings.length > 0 ? (
                  reading.markings.map((mark, i) => (
                    <div key={i}>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-display text-sm font-bold text-foreground">{mark.type}</h4>
                        <span className="text-[10px] text-primary/60">— {mark.location}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{mark.meaning}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {t("palm.noMarkings")}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </ChamberLayout>
  );
}
