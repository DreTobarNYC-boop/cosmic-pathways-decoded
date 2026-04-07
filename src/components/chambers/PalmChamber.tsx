import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ChamberLayout } from "@/components/ChamberLayout";
import { ArrowLeft, Camera, RotateCcw, Upload } from "lucide-react";
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
  const [scanProgress, setScanProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scanAnimRef = useRef<number | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
  }, []);

  const attachStreamToVideo = useCallback(async () => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream) return;

    video.srcObject = stream;
    video.muted = true;
    video.setAttribute("playsinline", "true");
    video.setAttribute("autoplay", "true");

    try {
      await video.play();
    } catch (error) {
      console.warn("Video play failed", error);
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 1920 },
        },
        audio: false,
      });

      streamRef.current = stream;
      setPhase("camera");
    } catch {
      toast.error(t("palm.cameraError"));
    }
  }, [stopCamera, t]);

  useEffect(() => {
    if (phase !== "camera" || !streamRef.current) return;

    const frame = requestAnimationFrame(() => {
      void attachStreamToVideo();
    });

    return () => cancelAnimationFrame(frame);
  }, [phase, attachStreamToVideo]);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth || !video.videoHeight) {
      toast.error(t("palm.cameraError"));
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setImageData(dataUrl);
    setPhase("preview");
    stopCamera();
  }, [stopCamera, t]);

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
    startScanSound();

    const scanDuration = SCAN_PHASES.length * 1800;
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
    stopCamera();
    stopScanSound();
    if (scanAnimRef.current) cancelAnimationFrame(scanAnimRef.current);
    setPhase("permission");
    setImageData(null);
    setReading(null);
    setScanStep(0);
    setScanProgress(0);
  }, [stopCamera]);

  useEffect(() => {
    return () => {
      stopCamera();
      stopScanSound();
      if (scanAnimRef.current) cancelAnimationFrame(scanAnimRef.current);
    };
  }, [stopCamera]);

  const currentScan = SCAN_PHASES[scanStep] || SCAN_PHASES[0];

  if (phase === "camera") {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-transparent to-background/90" />

        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-6">
          <button
            onClick={() => {
              stopCamera();
              setPhase("permission");
            }}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background/70 text-foreground backdrop-blur-sm"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold text-foreground">{t("palm.title")}</h1>
            <p className="text-sm text-foreground/75">{t("palm.positionHand")}</p>
          </div>
          <div className="h-11 w-11" />
        </div>

        <div className="absolute inset-0 flex items-center justify-center px-6 pointer-events-none">
          <div className="relative h-[68vh] w-full max-w-sm rounded-[2rem] border border-foreground/20">
            <div className="absolute inset-x-6 top-6 h-px bg-foreground/30" />
            <div className="absolute inset-x-6 bottom-6 h-px bg-foreground/30" />
            <div className="absolute inset-y-6 left-6 w-px bg-foreground/30" />
            <div className="absolute inset-y-6 right-6 w-px bg-foreground/30" />
            <div className="absolute inset-x-8 top-1/2 h-px -translate-y-1/2 bg-primary/40" />
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 px-4 pb-6 pt-10">
          <div className="mx-auto flex max-w-sm items-center justify-between gap-4 rounded-[2rem] border border-border bg-background/65 p-4 backdrop-blur-md">
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="ghost"
              className="h-14 min-w-14 rounded-full border border-border bg-background/60 px-0 text-foreground"
            >
              <Upload className="h-5 w-5" />
            </Button>

            <button
              onClick={capturePhoto}
              className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-primary bg-background shadow-lg shadow-primary/20"
            >
              <div className="h-16 w-16 rounded-full bg-primary" />
            </button>

            <Button
              onClick={() => {
                stopCamera();
                startCamera();
              }}
              variant="ghost"
              className="h-14 min-w-14 rounded-full border border-border bg-background/60 px-0 text-foreground"
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
      </div>
    );
  }

  if (phase === "preview" && imageData) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <img src={imageData} alt="Palm preview" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/75 via-transparent to-background/90" />

        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-6">
          <button
            onClick={reset}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background/70 text-foreground backdrop-blur-sm"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold text-foreground">{t("palm.title")}</h1>
          </div>
          <div className="h-11 w-11" />
        </div>

        <div className="absolute inset-x-0 bottom-0 px-4 pb-6 pt-10">
          <div className="mx-auto grid max-w-sm grid-cols-2 gap-3 rounded-[2rem] border border-border bg-background/65 p-4 backdrop-blur-md">
            <Button onClick={reset} variant="ghost" className="h-12 rounded-xl border border-border bg-background/60 font-display">
              <RotateCcw className="mr-2 h-4 w-4" /> {t("palm.retake")}
            </Button>
            <Button onClick={analyzePalm} className="h-12 rounded-xl bg-primary text-primary-foreground font-display hover:bg-primary/90">
              {t("palm.analyze")}
            </Button>
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
      </div>
    );
  }

  if (phase === "scanning" && imageData) {
    return (
      <div className="fixed inset-0 z-50 bg-background overflow-hidden">
        <img
          src={imageData}
          alt="Palm scan"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: "grayscale(0.65) brightness(0.78) contrast(1.15)" }}
        />

        <div className="absolute inset-0 bg-gradient-to-b from-background/75 via-transparent to-background/90" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              repeating-linear-gradient(0deg, transparent, transparent 29px, hsl(160 50% 55% / 0.25) 30px),
              repeating-linear-gradient(90deg, transparent, transparent 29px, hsl(160 50% 55% / 0.12) 30px)
            `,
            backgroundSize: "30px 30px",
          }}
        />

        <div
          className="absolute left-0 right-0"
          style={{
            top: `${scanProgress}%`,
            height: "3px",
            background: "linear-gradient(90deg, transparent 0%, hsl(145 100% 60%) 15%, hsl(145 100% 75%) 50%, hsl(145 100% 60%) 85%, transparent 100%)",
            boxShadow: "0 0 8px 2px hsl(145 100% 55% / 0.8), 0 0 25px 8px hsl(145 100% 50% / 0.45), 0 0 60px 20px hsl(145 80% 45% / 0.25)",
          }}
        />
        <div
          className="absolute left-0 right-0 pointer-events-none"
          style={{
            top: `${Math.min(scanProgress + 1, 100)}%`,
            height: "44px",
            background: "linear-gradient(180deg, hsl(145 100% 55% / 0.22) 0%, transparent 100%)",
          }}
        />

        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-6">
          <button
            onClick={reset}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background/70 text-foreground backdrop-blur-sm"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="rounded-full border border-border bg-background/60 px-3 py-1.5 text-[11px] font-display uppercase tracking-[0.2em] text-foreground backdrop-blur-sm">
            {t("palm.palmScan")}
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 px-4 pb-6 pt-10">
          <div className="mx-auto max-w-sm rounded-[2rem] border border-border bg-background/70 p-5 text-center backdrop-blur-md">
            <div className="mb-3 flex items-center justify-between text-sm font-display text-foreground">
              <span>{t(currentScan.labelKey)}</span>
              <span style={{ color: "hsl(145 80% 55%)" }}>{Math.round(scanProgress)}%</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${scanProgress}%`,
                  background: "linear-gradient(90deg, hsl(145 80% 40%), hsl(145 100% 55%))",
                  boxShadow: "0 0 8px hsl(145 100% 55% / 0.5)",
                }}
              />
            </div>
            <p className="mt-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              {t("palm.speculative")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ChamberLayout title={t("palm.title")} subtitle={t("palm.subtitle")} onBack={onBack}>
      <canvas ref={canvasRef} className="hidden" />
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />

      {phase === "permission" && (
        <div className="flex min-h-[60vh] flex-col items-center justify-center animate-fade-in px-4">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted/40">
            <Camera className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-3 text-center font-display text-xl font-bold text-foreground">
            {t("palm.needsAccess")}
          </h2>
          <p className="mb-8 max-w-xs text-center text-sm leading-relaxed text-muted-foreground">
            {t("palm.privacyNote")}
          </p>
          <Button
            onClick={startCamera}
            className="h-14 w-full max-w-xs rounded-2xl bg-primary font-display text-lg font-bold text-primary-foreground hover:bg-primary/90"
          >
            {t("palm.openCamera")}
          </Button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Upload className="h-4 w-4" /> {t("palm.uploadInstead")}
          </button>
        </div>
      )}

      {phase === "result" && reading && (
        <div className="mt-4 space-y-4 animate-fade-in">
          <div className="space-y-3 text-center">
            <p className="text-[11px] uppercase tracking-[0.2em] text-primary/70">
              {t("palm.palmReading")}
            </p>
            {imageData && (
              <div className="mx-auto h-24 w-24 overflow-hidden rounded-full border-2 border-primary/30">
                <img src={imageData} alt="Palm" className="h-full w-full object-cover" />
              </div>
            )}
            <h2 className="font-display text-2xl font-bold text-foreground">{reading.handType}</h2>
            <p className="text-sm text-primary">{reading.element}</p>
          </div>

          <Button
            onClick={reset}
            variant="ghost"
            className="h-12 w-full rounded-xl border border-border bg-card font-display"
          >
            <Camera className="mr-2 h-4 w-4" /> {t("palm.newScan")}
          </Button>

          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
            {(["reading", "lines", "mounts", "markings"] as ResultTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-display transition-colors ${
                  activeTab === tab
                    ? "bg-primary/20 font-bold text-primary"
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

          <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5">
            {activeTab === "reading" && (
              <div className="space-y-4">
                <div>
                  <p className="mb-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                    {t("palm.palmArchetype")}
                  </p>
                  <h3 className="font-display text-xl font-bold text-primary">
                    {reading.archetype.name}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {reading.archetype.traits.map((trait) => (
                    <span key={trait} className="rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-display text-primary/90">
                      {trait}
                    </span>
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-foreground/90">
                  {reading.archetype.summary}
                </p>
                <p className="text-sm italic leading-relaxed text-primary/60">
                  {reading.archetype.shadow}
                </p>
                {reading.reading?.overview && (
                  <div className="border-t border-border pt-3">
                    <p className="text-sm leading-relaxed text-foreground/85">
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
                    <div className="mb-1 flex items-center justify-between">
                      <h4 className="font-display text-sm font-bold capitalize text-foreground">
                        {t(`palm.line_${key}`)}
                      </h4>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                        line.strength === "strong"
                          ? "bg-primary/20 text-primary"
                          : line.strength === "moderate"
                            ? "bg-secondary text-secondary-foreground"
                            : line.strength === "absent"
                              ? "bg-muted text-muted-foreground"
                              : "bg-accent text-accent-foreground"
                      }`}>
                        {line.strength}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">{line.description}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "mounts" && reading.mounts && (
              <div className="space-y-5">
                {Object.entries(reading.mounts).map(([key, mount]) => (
                  <div key={key}>
                    <div className="mb-1 flex items-center justify-between">
                      <h4 className="font-display text-sm font-bold capitalize text-foreground">
                        {t(`palm.mount_${key}`)}
                      </h4>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                        mount.prominence === "high"
                          ? "bg-primary/20 text-primary"
                          : mount.prominence === "moderate"
                            ? "bg-secondary text-secondary-foreground"
                            : "bg-muted text-muted-foreground"
                      }`}>
                        {mount.prominence}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">{mount.meaning}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "markings" && (
              <div className="space-y-5">
                {reading.markings && reading.markings.length > 0 ? (
                  reading.markings.map((mark, i) => (
                    <div key={i}>
                      <div className="mb-1 flex items-center gap-2">
                        <h4 className="font-display text-sm font-bold text-foreground">{mark.type}</h4>
                        <span className="text-[10px] text-primary/60">— {mark.location}</span>
                      </div>
                      <p className="text-xs leading-relaxed text-muted-foreground">{mark.meaning}</p>
                    </div>
                  ))
                ) : (
                  <p className="py-4 text-center text-sm text-muted-foreground">
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
