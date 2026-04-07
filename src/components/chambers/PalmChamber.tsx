import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ChamberLayout } from "@/components/ChamberLayout";
import { ArrowLeft, Camera, RotateCcw, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { startScanSound, stopScanSound, updateScanPitch, playCompletionChime } from "@/lib/scan-sound";

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
  const [cameraLoading, setCameraLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);
  const scanAnimRef = useRef<number | null>(null);
  const hapticIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopCamera = useCallback(() => {
    const video = videoRef.current;

    if (video) {
      video.onloadedmetadata = null;
      video.oncanplay = null;
      video.onplaying = null;
      try {
        video.pause();
      } catch {
        // ignore
      }
      video.srcObject = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraLoading(false);
  }, []);

  const openNativeCamera = useCallback(() => {
    setCameraLoading(false);
    stopCamera();
    nativeCameraInputRef.current?.click();
  }, [stopCamera]);

  const startCamera = useCallback(async () => {
    openNativeCamera();
  }, [openNativeCamera]);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.videoWidth === 0 || video.videoHeight === 0) {
      toast.error(t("palm.cameraError"));
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);

    stopCamera();
    setImageData(dataUrl);
    setPhase("preview");
  }, [stopCamera, t]);

  const handleImageSelection = useCallback((file?: File | null) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      stopCamera();
      setImageData(reader.result as string);
      setPhase("preview");
    };
    reader.readAsDataURL(file);
  }, [stopCamera]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleImageSelection(e.target.files?.[0] ?? null);
    e.target.value = "";
  }, [handleImageSelection]);

  const analyzePalm = useCallback(async () => {
    if (!imageData) return;

    setPhase("scanning");
    setScanStep(0);
    setScanProgress(0);
    startScanSound();

    if (navigator.vibrate) {
      hapticIntervalRef.current = setInterval(() => {
        navigator.vibrate(15);
      }, 400);
    }

    const scanDuration = 3600;
    const startTime = performance.now();
    let waitingForApi = false;

    const animateLaser = (now: number) => {
      const elapsed = now - startTime;
      const progress = waitingForApi ? 100 : Math.min((elapsed / scanDuration) * 100, 100);

      if (progress >= 100) {
        waitingForApi = true;
      }

      setScanProgress(progress);
      updateScanPitch(progress);
      scanAnimRef.current = requestAnimationFrame(animateLaser);
    };

    scanAnimRef.current = requestAnimationFrame(animateLaser);

    const stepInterval = setInterval(() => {
      setScanStep((prev) => {
        if (navigator.vibrate) navigator.vibrate(30);
        if (prev >= SCAN_PHASES.length - 1) {
          clearInterval(stepInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 720);

    try {
      const base64 = imageData.split(",")[1];
      const { data, error } = await supabase.functions.invoke("palm-reading", {
        body: { image_base64: base64, language: i18n.language },
      });

      clearInterval(stepInterval);
      if (scanAnimRef.current) cancelAnimationFrame(scanAnimRef.current);
      if (hapticIntervalRef.current) clearInterval(hapticIntervalRef.current);

      if (error) {
        const errBody = typeof error === "object" && error !== null ? error : {};
        const message = ((errBody as Record<string, unknown>).message as string) || "Analysis failed";
        throw new Error(message);
      }

      if (!data?.content) {
        if (data?.error) throw new Error(data.error);
        throw new Error("No reading returned");
      }

      setScanStep(SCAN_PHASES.length - 1);
      setScanProgress(100);
      updateScanPitch(100);
      stopScanSound();

      if (navigator.vibrate) navigator.vibrate([50, 30, 80]);
      playCompletionChime();

      await new Promise((resolve) => setTimeout(resolve, 350));
      setReading(data.content);
      setActiveTab("reading");
      setPhase("result");
    } catch (err) {
      clearInterval(stepInterval);
      if (scanAnimRef.current) cancelAnimationFrame(scanAnimRef.current);
      if (hapticIntervalRef.current) clearInterval(hapticIntervalRef.current);
      stopScanSound();
      const message = err instanceof Error ? err.message : "Analysis failed";
      toast.error(message);
      setPhase("preview");
    }
  }, [imageData, i18n.language]);

  const reset = useCallback(() => {
    stopCamera();
    stopScanSound();
    if (scanAnimRef.current) cancelAnimationFrame(scanAnimRef.current);
    if (hapticIntervalRef.current) clearInterval(hapticIntervalRef.current);
    setPhase("permission");
    setImageData(null);
    setReading(null);
    setScanStep(0);
    setScanProgress(0);
    setCameraLoading(false);
  }, [stopCamera]);

  useEffect(() => {
    return () => {
      stopCamera();
      stopScanSound();
      if (scanAnimRef.current) cancelAnimationFrame(scanAnimRef.current);
      if (hapticIntervalRef.current) clearInterval(hapticIntervalRef.current);
    };
  }, [stopCamera]);

  const currentScan = SCAN_PHASES[scanStep] || SCAN_PHASES[0];

  if (phase === "camera") {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/60 to-background/85" />

        <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 pt-6">
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
            <h1 className="font-display text-xl font-bold text-foreground">{t("palm.scanYourPalm")}</h1>
            <p className="text-xs text-foreground/60">Use your camera to take a clear photo of your palm</p>
          </div>
          <div className="h-11 w-11" />
        </div>

        <div className="absolute inset-0 flex items-center justify-center px-4">
          <div className="w-full max-w-sm rounded-[2rem] border border-border bg-card/70 p-6 text-center backdrop-blur-md">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-muted/50">
              <Camera className="h-9 w-9 text-primary" />
            </div>
            <h2 className="font-display text-2xl text-foreground">Take a palm photo</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Open your device camera, center your full palm, and take the clearest photo you can.
            </p>

            <div className="mt-6 space-y-3">
              <Button
                onClick={openNativeCamera}
                className="h-14 w-full rounded-2xl bg-primary font-display text-lg font-bold text-primary-foreground hover:bg-primary/90"
              >
                Open Device Camera
              </Button>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="ghost"
                className="h-12 w-full rounded-2xl border border-border bg-background/60 font-display text-foreground"
              >
                <Upload className="mr-2 h-4 w-4" /> Choose Existing Photo
              </Button>
            </div>
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />
        <video ref={videoRef} className="hidden" />
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
        <input ref={nativeCameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload} />
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
            <Button onClick={analyzePalm} className="h-12 rounded-xl bg-primary font-display text-primary-foreground hover:bg-primary/90">
              {t("palm.analyze")}
            </Button>
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
        <input ref={nativeCameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload} />
      </div>
    );
  }

  if (phase === "scanning" && imageData) {
    const laserPct = scanProgress;
    const scanComplete = scanProgress >= 100;

    return (
      <div className="fixed inset-0 z-50 overflow-hidden bg-background">
        <img
          src={imageData}
          alt="Palm scan"
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            filter: scanComplete ? "grayscale(1) brightness(0.72) contrast(1.18)" : "brightness(0.88) contrast(1.08)",
            transition: scanComplete ? "filter 0.18s linear" : "none",
          }}
        />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/60 via-transparent to-background/70" />

        {!scanComplete && (
          <>
            <div
              className="absolute left-0 right-0"
              style={{
                top: `${laserPct}%`,
                height: "3px",
                background: "linear-gradient(90deg, transparent 0%, hsl(145 100% 60%) 15%, hsl(145 100% 75%) 50%, hsl(145 100% 60%) 85%, transparent 100%)",
                boxShadow: "0 0 8px 2px hsl(145 100% 55% / 0.8), 0 0 25px 8px hsl(145 100% 50% / 0.45), 0 0 60px 20px hsl(145 80% 45% / 0.25)",
                transition: "top 0.03s linear",
              }}
            />
            <div
              className="pointer-events-none absolute left-0 right-0"
              style={{
                top: `${Math.min(laserPct + 0.2, 100)}%`,
                height: "32px",
                background: "linear-gradient(180deg, hsl(145 100% 55% / 0.16) 0%, transparent 100%)",
              }}
            />
          </>
        )}

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
            <p className="mt-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{t("palm.speculative")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ChamberLayout title={t("palm.title")} subtitle={t("palm.subtitle")} onBack={onBack}>
      <canvas ref={canvasRef} className="hidden" />
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
      <input ref={nativeCameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload} />

      {phase === "permission" && (
        <div className="animate-fade-in flex min-h-[60vh] flex-col items-center justify-center px-4">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted/40">
            <Camera className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-3 text-center font-display text-xl font-bold text-foreground">{t("palm.needsAccess")}</h2>
          <p className="mb-8 max-w-xs text-center text-sm leading-relaxed text-muted-foreground">{t("palm.privacyNote")}</p>
          <Button
            onClick={openNativeCamera}
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
        <div className="mt-4 animate-fade-in space-y-4">
          <div className="space-y-3 text-center">
            <p className="text-[11px] uppercase tracking-[0.2em] text-primary/70">{t("palm.palmReading")}</p>
            {imageData && (
              <div className="mx-auto h-24 w-24 overflow-hidden rounded-full border-2 border-primary/30">
                <img src={imageData} alt="Palm" className="h-full w-full object-cover" />
              </div>
            )}
            <h2 className="font-display text-2xl font-bold text-foreground">{reading.handType}</h2>
            <p className="text-sm text-primary">{reading.element}</p>
          </div>

          <Button onClick={reset} variant="ghost" className="h-12 w-full rounded-xl border border-border bg-card font-display">
            <Camera className="mr-2 h-4 w-4" /> {t("palm.newScan")}
          </Button>

          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
            {(["reading", "lines", "mounts", "markings"] as ResultTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-display transition-colors ${
                  activeTab === tab ? "bg-primary/20 font-bold text-primary" : "text-muted-foreground hover:text-foreground"
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
                  <p className="mb-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{t("palm.palmArchetype")}</p>
                  <h3 className="font-display text-xl font-bold text-primary">{reading.archetype.name}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {reading.archetype.traits.map((trait) => (
                    <span key={trait} className="rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-display text-primary/90">
                      {trait}
                    </span>
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-foreground/90">{reading.archetype.summary}</p>
                <p className="text-sm italic leading-relaxed text-primary/60">{reading.archetype.shadow}</p>
                {reading.reading?.overview && (
                  <div className="border-t border-border pt-3">
                    <p className="text-sm leading-relaxed text-foreground/85">{reading.reading.overview}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "lines" && reading.lines && (
              <div className="space-y-5">
                {Object.entries(reading.lines).map(([key, line]) => (
                  <div key={key}>
                    <div className="mb-1 flex items-center justify-between">
                      <h4 className="font-display text-sm font-bold capitalize text-foreground">{t(`palm.line_${key}`)}</h4>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                          line.strength === "strong"
                            ? "bg-primary/20 text-primary"
                            : line.strength === "moderate"
                              ? "bg-secondary text-secondary-foreground"
                              : line.strength === "absent"
                                ? "bg-muted text-muted-foreground"
                                : "bg-accent text-accent-foreground"
                        }`}
                      >
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
                      <h4 className="font-display text-sm font-bold capitalize text-foreground">{t(`palm.mount_${key}`)}</h4>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                          mount.prominence === "high"
                            ? "bg-primary/20 text-primary"
                            : mount.prominence === "moderate"
                              ? "bg-secondary text-secondary-foreground"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
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
                  <p className="py-4 text-center text-sm text-muted-foreground">{t("palm.noMarkings")}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </ChamberLayout>
  );
}
