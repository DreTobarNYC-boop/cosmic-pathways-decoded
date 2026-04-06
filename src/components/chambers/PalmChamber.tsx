import { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ChamberLayout } from "@/components/ChamberLayout";
import { Camera, RotateCcw, Scan, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Phase = "capture" | "preview" | "analyzing" | "result";

export function PalmChamber({ onBack }: { onBack: () => void }) {
  const { t, i18n } = useTranslation();
  const [phase, setPhase] = useState<Phase>("capture");
  const [imageData, setImageData] = useState<string | null>(null);
  const [reading, setReading] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 960 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      toast.error(t("palm.cameraError"));
    }
  }, [t]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

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

  const analyzepalm = useCallback(async () => {
    if (!imageData) return;
    setPhase("analyzing");

    try {
      const base64 = imageData.split(",")[1];
      const { data, error } = await supabase.functions.invoke("palm-reading", {
        body: { image_base64: base64, language: i18n.language },
      });

      if (error) throw new Error(error.message);
      if (!data?.content) throw new Error("No reading returned");

      setReading(data.content);
      setPhase("result");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Analysis failed";
      toast.error(msg);
      setPhase("preview");
    }
  }, [imageData, i18n.language]);

  const reset = useCallback(() => {
    setPhase("capture");
    setImageData(null);
    setReading(null);
  }, []);

  return (
    <ChamberLayout title={t("palm.title")} subtitle={t("palm.subtitle")} onBack={onBack}>
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {phase === "capture" && (
        <div className="space-y-4 mt-4 animate-fade-up">
          {/* Instructions card */}
          <div className="card-cosmic rounded-2xl p-6 text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
              style={{ backgroundColor: "hsl(280, 40%, 55%, 0.15)" }}>
              <Scan className="w-8 h-8" style={{ color: "hsl(280, 40%, 55%)" }} />
            </div>
            <h3 className="font-display text-lg font-bold text-foreground">
              {t("palm.scanTitle")}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("palm.scanInstructions")}
            </p>
          </div>

          {/* Camera + Upload buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={async () => {
                await startCamera();
                setPhase("capture");
                // Small delay to let camera initialize, then show video
                setTimeout(() => {
                  if (videoRef.current && streamRef.current) {
                    videoRef.current.srcObject = streamRef.current;
                  }
                }, 100);
              }}
              className="card-cosmic border-copper rounded-2xl h-auto py-6 flex flex-col items-center gap-2 hover:glow-gold"
              variant="ghost"
            >
              <Camera className="w-6 h-6 text-primary" />
              <span className="text-sm font-display text-foreground">{t("palm.takePhoto")}</span>
            </Button>
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="card-cosmic border-copper rounded-2xl h-auto py-6 flex flex-col items-center gap-2 hover:glow-gold"
              variant="ghost"
            >
              <Upload className="w-6 h-6 text-primary" />
              <span className="text-sm font-display text-foreground">{t("palm.uploadPhoto")}</span>
            </Button>
          </div>

          {/* Live camera feed (shows when camera is active) */}
          <div className="relative rounded-2xl overflow-hidden bg-black/50">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full aspect-[3/4] object-cover rounded-2xl"
            />
            {streamRef.current && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                <Button
                  onClick={capturePhoto}
                  className="w-16 h-16 rounded-full bg-primary text-primary-foreground shadow-lg"
                >
                  <Camera className="w-6 h-6" />
                </Button>
                <Button
                  onClick={() => { stopCamera(); setPhase("capture"); }}
                  variant="ghost"
                  className="w-12 h-12 rounded-full bg-muted/50 text-foreground"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="card-cosmic rounded-2xl p-4">
            <p className="text-[11px] uppercase tracking-[0.2em] text-primary/70 mb-2">
              {t("palm.tipsTitle")}
            </p>
            <ul className="text-xs text-muted-foreground space-y-1.5">
              <li>• {t("palm.tip1")}</li>
              <li>• {t("palm.tip2")}</li>
              <li>• {t("palm.tip3")}</li>
              <li>• {t("palm.tip4")}</li>
            </ul>
          </div>
        </div>
      )}

      {phase === "preview" && imageData && (
        <div className="space-y-4 mt-4 animate-fade-up">
          <div className="relative rounded-2xl overflow-hidden">
            <img src={imageData} alt="Palm" className="w-full rounded-2xl" />
            <div className="absolute inset-0 border-2 border-primary/30 rounded-2xl pointer-events-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={reset}
              variant="ghost"
              className="card-cosmic border-copper rounded-xl h-12 font-display"
            >
              <RotateCcw className="w-4 h-4 mr-2" /> {t("palm.retake")}
            </Button>
            <Button
              onClick={analyzepalm}
              className="bg-primary text-primary-foreground rounded-xl h-12 font-display hover:bg-primary/90"
            >
              <Scan className="w-4 h-4 mr-2" /> {t("palm.analyze")}
            </Button>
          </div>
        </div>
      )}

      {phase === "analyzing" && (
        <div className="space-y-6 mt-8 animate-fade-up">
          <div className="card-cosmic rounded-2xl p-8 text-center space-y-4">
            <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center animate-pulse"
              style={{ backgroundColor: "hsl(280, 40%, 55%, 0.2)" }}>
              <Scan className="w-10 h-10 animate-spin" style={{ color: "hsl(280, 40%, 55%)" }} />
            </div>
            <p className="font-display text-lg font-bold text-foreground">
              {t("palm.analyzing")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("palm.analyzingSubtext")}
            </p>
            <div className="space-y-2">
              <div className="h-2 bg-muted/30 rounded-full animate-pulse w-full" />
              <div className="h-2 bg-muted/30 rounded-full animate-pulse w-4/5 mx-auto" />
              <div className="h-2 bg-muted/30 rounded-full animate-pulse w-3/5 mx-auto" />
            </div>
          </div>
        </div>
      )}

      {phase === "result" && reading && (
        <div className="space-y-4 mt-4 animate-fade-up">
          {/* Thumbnail of the palm */}
          {imageData && (
            <div className="flex items-center gap-3 card-cosmic rounded-2xl p-3">
              <img src={imageData} alt="Palm" className="w-16 h-16 rounded-xl object-cover" />
              <div>
                <p className="text-xs font-display font-bold text-foreground">{t("palm.yourReading")}</p>
                <p className="text-[10px] text-muted-foreground">{t("palm.poweredByAI")}</p>
              </div>
            </div>
          )}

          {/* Reading content */}
          <div className="card-cosmic rounded-2xl p-6 glow-gold relative overflow-hidden">
            <div className="animate-shimmer absolute inset-0 pointer-events-none rounded-2xl" />
            <div className="prose prose-sm prose-invert max-w-none">
              {reading.split("\n").map((line, i) => {
                if (!line.trim()) return <br key={i} />;
                // Section headers
                if (line.match(/^[🖐❤🧠🌿⭐✨🔮]/)) {
                  return (
                    <h3 key={i} className="font-display text-base font-bold text-primary mt-4 mb-2">
                      {line}
                    </h3>
                  );
                }
                return (
                  <p key={i} className="text-sm text-foreground/90 leading-relaxed mb-2">
                    {line}
                  </p>
                );
              })}
            </div>
          </div>

          {/* New scan button */}
          <Button
            onClick={reset}
            variant="ghost"
            className="w-full card-cosmic border-copper rounded-xl h-12 font-display"
          >
            <RotateCcw className="w-4 h-4 mr-2" /> {t("palm.newScan")}
          </Button>
        </div>
      )}
    </ChamberLayout>
  );
}
