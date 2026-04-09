import { useState, useRef } from "react";
import { Camera, RotateCcw, Loader2, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChamberLayout } from "@/components/ChamberLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface PalmChamberProps {
  onBack: () => void;
}

export function PalmChamber({ onBack }: PalmChamberProps) {
  const [phase, setPhase] = useState<"idle" | "scanning" | "done">("idle");
  const [reading, setReading] = useState<any>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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

    setImagePreview(URL.createObjectURL(file));
    setPhase("scanning");
    setReading(null);

    try {
      const base64 = await fileToBase64(file);
      const { data, error } = await supabase.functions.invoke("palm-reading", {
        body: { image_base64: base64 },
      });

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
        <div className="flex flex-col items-center text-center pt-8 space-y-6">
          {/* Matrix ring scanning container */}
          <div className="relative w-64 h-64 flex items-center justify-center">
            {/* Outer rotating ring */}
            <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-matrix-ring">
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rounded-full" />
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary/60 rounded-full" />
            </div>
            
            {/* Middle rotating ring (reverse) */}
            <div className="absolute inset-4 rounded-full border border-dashed border-primary/30 animate-matrix-ring-reverse" />
            
            {/* Inner pulsing ring */}
            <div className="absolute inset-8 rounded-full border border-primary/40 animate-pulse-glow" />
            
            {/* Palm image container */}
            {imagePreview && (
              <div className="relative w-44 h-44 rounded-2xl overflow-hidden border border-primary/50 animate-pulse-glow">
                <img src={imagePreview} alt="Your palm" className="w-full h-full object-cover" />
                
                {/* Scanning line overlay */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-b from-transparent via-primary/80 to-transparent animate-scan-line" />
                </div>
                
                {/* Corner brackets */}
                <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-primary animate-corner-pulse" />
                <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-primary animate-corner-pulse" style={{ animationDelay: '0.25s' }} />
                <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-primary animate-corner-pulse" style={{ animationDelay: '0.5s' }} />
                <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-primary animate-corner-pulse" style={{ animationDelay: '0.75s' }} />
                
                {/* Grid overlay */}
                <div className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{
                    backgroundImage: `linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px),
                      linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)`,
                    backgroundSize: '20px 20px'
                  }}
                />
              </div>
            )}
            
            {/* Orbiting dots */}
            <div className="absolute inset-0 animate-matrix-ring" style={{ animationDuration: '4s' }}>
              <div className="absolute top-1/2 -left-1 w-1.5 h-1.5 bg-primary rounded-full shadow-lg shadow-primary/50" />
            </div>
            <div className="absolute inset-0 animate-matrix-ring" style={{ animationDuration: '6s', animationDelay: '1s' }}>
              <div className="absolute top-1/2 -right-1 w-1 h-1 bg-primary/70 rounded-full" />
            </div>
          </div>
          
          {/* Status text with streaming effect */}
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-3 text-primary">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="font-display text-base">Analyzing palm patterns...</span>
            </div>
            
            {/* Simulated processing steps */}
            <div className="flex flex-col items-center gap-1.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-2 animate-data-stream" style={{ animationDelay: '0s' }}>
                <div className="w-1 h-1 bg-primary/60 rounded-full" />
                <span>Mapping line structures</span>
              </div>
              <div className="flex items-center gap-2 animate-data-stream" style={{ animationDelay: '0.5s' }}>
                <div className="w-1 h-1 bg-primary/60 rounded-full" />
                <span>Identifying mount formations</span>
              </div>
              <div className="flex items-center gap-2 animate-data-stream" style={{ animationDelay: '1s' }}>
                <div className="w-1 h-1 bg-primary/60 rounded-full" />
                <span>Decoding cosmic signatures</span>
              </div>
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
