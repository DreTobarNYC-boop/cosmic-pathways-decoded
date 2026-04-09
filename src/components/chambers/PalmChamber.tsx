import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Camera, RotateCcw, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChamberLayout } from "@/components/ChamberLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

const SCAN_DURATION_MS = 3000;
const MATRIX_CHARS = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789";

// Keyframes CSS for matrix rain animation
const MATRIX_KEYFRAMES = `
@keyframes matrixFall {
  0% { transform: translateY(-100%); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(500%); opacity: 0; }
}
`;

// GPU-accelerated Matrix Rain column with inline animation
const MatrixColumn = ({ delay, duration, isActive }: { delay: number; duration: number; isActive: boolean }) => {
  const chars = useMemo(() => {
    const len = 8 + Math.floor(Math.random() * 12);
    return Array.from({ length: len }, () => 
      MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]
    ).join("\n");
  }, []);

  if (!isActive) return null;

  return (
    <div
      className="absolute text-[10px] leading-[1.2] font-mono whitespace-pre pointer-events-none select-none"
      style={{
        color: "#C5A059",
        textShadow: "0 0 8px #C5A059, 0 0 16px #C5A059",
        opacity: 1,
        animation: `matrixFall ${duration}s linear ${delay}s infinite`,
      }}
    >
      {chars}
    </div>
  );
};

// Laser scan line component - hardcoded to follow scanProgress
const LaserLine = ({ progress }: { progress: number }) => (
  <div
    className="absolute left-0 right-0 pointer-events-none z-30"
    style={{
      top: `${progress}%`,
      height: '4px',
      background: "linear-gradient(90deg, transparent 0%, #C5A059 10%, #FFD700 50%, #C5A059 90%, transparent 100%)",
      boxShadow: "0 0 20px 5px #C5A059, 0 0 40px 10px rgba(197, 160, 89, 0.6), 0 0 60px 15px rgba(197, 160, 89, 0.3)",
      transform: "translate3d(0, 0, 0)",
      willChange: "top",
    }}
  />
);

interface PalmChamberProps {
  onBack: () => void;
}

export function PalmChamber({ onBack }: PalmChamberProps) {
  const [phase, setPhase] = useState<"idle" | "scanning" | "done">("idle");
  const [reading, setReading] = useState<any>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const scanStartTimeRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  // GPU-accelerated scan progress animation using requestAnimationFrame
  const animateScan = useCallback(() => {
    const elapsed = performance.now() - scanStartTimeRef.current;
    const progress = Math.min((elapsed / SCAN_DURATION_MS) * 100, 100);
    setScanProgress(progress);
    
    if (progress < 100) {
      rafRef.current = requestAnimationFrame(animateScan);
    }
  }, []);

  // Start scanning animation immediately when phase changes
  useEffect(() => {
    if (phase === "scanning") {
      scanStartTimeRef.current = performance.now();
      setScanProgress(0);
      rafRef.current = requestAnimationFrame(animateScan);
    }
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [phase, animateScan]);

  // Generate matrix columns once
  const matrixColumns = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: `${(i / 30) * 100}%`,
      delay: Math.random() * 2,
      duration: 1.5 + Math.random() * 1.5,
    }));
  }, []);

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Immediately set scanning state and preview - no delay
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setReading(null);
    setPhase("scanning"); // Force scanning state immediately

    try {
      const base64Promise = fileToBase64(file);
      
      // Run API call in parallel with animation
      const apiPromise = base64Promise.then(base64 => 
        supabase.functions.invoke("palm-reading", {
          body: { image_base64: base64 },
        })
      );

      // Wait for both scan animation minimum time and API response
      const [apiResult] = await Promise.all([
        apiPromise,
        new Promise(resolve => setTimeout(resolve, SCAN_DURATION_MS))
      ]);

      const { data, error } = apiResult;

      if (error) throw new Error(error.message || "Reading failed");
      if (data?.error) throw new Error(data.error);

      setReading(data.content);
      setPhase("done");
    } catch (err: any) {
      console.error("Palm reading error:", err);
      toast({ title: "Reading failed", description: err.message, variant: "destructive" });
      setPhase("idle");
    }
  };

  const handleReset = () => {
    setPhase("idle");
    setReading(null);
    setImagePreview(null);
    setScanProgress(0);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <ChamberLayout title="The Palm" subtitle="Palm Reading" onBack={onBack}>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />

      {phase === "idle" && (
        <div className="flex flex-col items-center text-center pt-12 space-y-8">
          <div className="w-24 h-24 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Fingerprint className="w-12 h-12 text-primary" />
          </div>
          <div className="space-y-2 max-w-xs">
            <h2 className="font-display text-xl text-foreground">Palm Oracle</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Take a clear photo of your palm and let the cosmos reveal the secrets written in your hand.
            </p>
          </div>
          <Button
            onClick={() => fileRef.current?.click()}
            size="lg"
            className="rounded-full px-8"
          >
            <Camera className="w-5 h-5 mr-2" />
            Open Camera
          </Button>
        </div>
      )}

      {phase === "scanning" && (
        <div className="relative flex flex-col items-center justify-center min-h-[400px] -mx-4 -mt-4 overflow-hidden">
          {/* Inject keyframes for matrix animation */}
          <style dangerouslySetInnerHTML={{ __html: MATRIX_KEYFRAMES }} />
          
          {/* Full-screen Matrix background overlay */}
          <div 
            className="absolute inset-0 bg-black z-0"
          >
            {/* Matrix Rain - GPU accelerated columns */}
            {matrixColumns.map(col => (
              <div
                key={col.id}
                className="absolute top-0 h-full overflow-visible"
                style={{ left: col.left }}
              >
                <MatrixColumn delay={col.delay} duration={col.duration} isActive={true} />
              </div>
            ))}
          </div>

          {/* Palm image with scan overlay */}
          <div className="relative z-10 w-56 h-56 rounded-2xl overflow-hidden border-2 border-[#C5A059]/50 shadow-[0_0_30px_rgba(197,160,89,0.3)]">
            {imagePreview && (
              <img 
                src={imagePreview} 
                alt="Your palm" 
                className="w-full h-full object-cover opacity-70"
                style={{ filter: "sepia(30%) hue-rotate(-10deg)" }}
              />
            )}
            {/* Laser scan line - follows scanProgress */}
            <LaserLine progress={scanProgress} />
            
            {/* Scan grid overlay */}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(197, 160, 89, 0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(197, 160, 89, 0.1) 1px, transparent 1px)
                `,
                backgroundSize: "20px 20px",
              }}
            />
          </div>

          {/* Scanning text - covers any spinner */}
          <div className="relative z-10 mt-6 text-center">
            <div className="font-mono text-[#C5A059] text-sm tracking-wider animate-pulse">
              ANALYZING PALM DATA
            </div>
            <div className="font-mono text-[#C5A059]/60 text-xs mt-2">
              {Math.round(scanProgress)}% COMPLETE
            </div>
          </div>

          </div>
      )}

      {phase === "done" && reading && (
        <div className="space-y-6 pb-6">
          {/* Archetype header */}
          {reading.archetype && (
            <div className="text-center space-y-3 pt-4">
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5">
                <span className="text-xs text-muted-foreground">{reading.handType} · {reading.element}</span>
              </div>
              <h2 className="font-display text-2xl text-primary">{reading.archetype.name}</h2>
              <div className="flex justify-center gap-2">
                {reading.archetype.traits?.map((t: string) => (
                  <span key={t} className="text-xs bg-muted/40 border border-border rounded-full px-3 py-1 text-foreground/80">{t}</span>
                ))}
              </div>
              <p className="text-sm text-foreground/70 max-w-sm mx-auto leading-relaxed">{reading.archetype.summary}</p>
              {reading.archetype.shadow && (
                <p className="text-xs text-muted-foreground max-w-sm mx-auto italic">{reading.archetype.shadow}</p>
              )}
            </div>
          )}

          {/* Overview */}
          {reading.reading?.overview && (
            <div className="bg-muted/20 border border-border rounded-2xl p-4">
              <h3 className="font-display text-sm text-primary mb-2">Overview</h3>
              <p className="text-sm text-foreground/80 leading-relaxed">{reading.reading.overview}</p>
            </div>
          )}

          {/* Lines */}
          {reading.lines && (
            <div className="space-y-3">
              <h3 className="font-display text-sm text-primary">Lines</h3>
              {Object.entries(reading.lines).map(([key, line]: [string, any]) => (
                <div key={key} className="bg-muted/20 border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-display text-sm text-foreground capitalize">{key} Line</span>
                    <span className="text-xs text-muted-foreground capitalize">{line.strength}</span>
                  </div>
                  <p className="text-sm text-foreground/70 leading-relaxed">{line.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* Mounts */}
          {reading.mounts && (
            <div className="space-y-3">
              <h3 className="font-display text-sm text-primary">Mounts</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(reading.mounts).map(([key, mount]: [string, any]) => (
                  <div key={key} className="bg-muted/20 border border-border rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-display text-xs text-foreground capitalize">{key}</span>
                      <span className="text-[10px] text-muted-foreground capitalize">{mount.prominence}</span>
                    </div>
                    <p className="text-xs text-foreground/70 leading-relaxed">{mount.meaning}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Markings */}
          {reading.markings && reading.markings.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-display text-sm text-primary">Markings</h3>
              {reading.markings.map((m: any, i: number) => (
                <div key={i} className="bg-muted/20 border border-border rounded-xl p-3">
                  <span className="font-display text-xs text-foreground">{m.type} — {m.location}</span>
                  <p className="text-xs text-foreground/70 mt-1">{m.meaning}</p>
                </div>
              ))}
            </div>
          )}

          {/* Reset */}
          <div className="flex justify-center pt-2">
            <Button variant="outline" onClick={handleReset} className="rounded-full">
              <RotateCcw className="w-4 h-4 mr-2" />
              Scan Another Palm
            </Button>
          </div>
        </div>
      )}
    </ChamberLayout>
  );
}

export default PalmChamber;
