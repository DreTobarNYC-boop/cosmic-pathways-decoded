import { useState, useRef } from "react";
import { Camera, RotateCcw, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChamberLayout } from "@/components/ChamberLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface PalmChamberProps {
  onBack: () => void;
}

const SCAN_STEPS = [
  "Mapping heart line trajectory",
  "Analyzing head line depth",
  "Tracing life line vitality",
  "Detecting fate line origin",
  "Reading Sun line potential",
  "Scanning mount formations",
  "Decoding finger ratios",
  "Identifying sacred markings",
  "Measuring thumb flexibility",
  "Channeling cosmic signature",
];

const BIOMETRIC_POINTS = [
  { top: "22%", left: "38%" },
  { top: "45%", left: "20%" },
  { top: "58%", left: "52%" },
  { top: "30%", left: "65%" },
  { top: "70%", left: "35%" },
  { top: "38%", left: "78%" },
];

function SectionHeader({ label }: { label: string }) {
  return (
    <p className="text-[#C5A059] text-[10px] tracking-[0.2em] uppercase mb-3">{label}</p>
  );
}

function ReadingCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-[#C5A059]/20 bg-[#0B1A1A] p-4 ${className}`}>
      {children}
    </div>
  );
}

function StrengthBadge({ value }: { value: string }) {
  const colors: Record<string, string> = {
    strong: "text-[#C5A059] border-[#C5A059]/40 bg-[#C5A059]/10",
    dominant: "text-[#C5A059] border-[#C5A059]/40 bg-[#C5A059]/10",
    moderate: "text-[#FFFDD0]/60 border-[#FFFDD0]/20 bg-[#FFFDD0]/5",
    present: "text-[#FFFDD0]/60 border-[#FFFDD0]/20 bg-[#FFFDD0]/5",
    faint: "text-[#FFFDD0]/30 border-[#FFFDD0]/10 bg-transparent",
    flat: "text-[#FFFDD0]/30 border-[#FFFDD0]/10 bg-transparent",
    absent: "text-muted-foreground border-muted/20 bg-transparent",
    overdeveloped: "text-amber-400 border-amber-400/30 bg-amber-400/10",
    high: "text-[#C5A059] border-[#C5A059]/40 bg-[#C5A059]/10",
    sensitive: "text-rose-400 border-rose-400/30 bg-rose-400/10",
  };
  const cls = colors[value?.toLowerCase?.()] ?? "text-[#FFFDD0]/50 border-[#FFFDD0]/10 bg-transparent";
  return (
    <span className={`text-[10px] border rounded-full px-2 py-0.5 capitalize tracking-wide ${cls}`}>
      {value}
    </span>
  );
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

    if (file.size > 4 * 1024 * 1024) {
      toast({ title: "Image too large", description: "Please use a photo under 4MB.", variant: "destructive" });
      return;
    }

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

      setReading(data);
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

      {/* ── IDLE ── */}
      {phase === "idle" && (
        <div className="flex flex-col items-center text-center pt-12 space-y-8">
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-[#C5A059]/10 border border-[#C5A059]/30 flex items-center justify-center animate-ring-breathe">
              <Fingerprint className="w-14 h-14 text-[#C5A059]" />
            </div>
            <div className="absolute inset-0 rounded-full border border-dashed border-[#C5A059]/20 scale-110 animate-matrix-ring-reverse" />
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
            className="rounded-full px-8 bg-[#C5A059] hover:bg-[#C5A059]/90 text-black font-semibold"
          >
            <Camera className="w-5 h-5 mr-2" />
            Scan Your Palm
          </Button>
        </div>
      )}

      {/* ── SCANNING ── */}
      {phase === "scanning" && (
        <div className="flex flex-col items-center text-center pt-4 space-y-6">

          {/* Scanner stage */}
          <div className="relative w-72 h-72 flex items-center justify-center">

            {/* Radar sweep layer */}
            <div className="absolute inset-0 rounded-full overflow-hidden animate-radar-sweep pointer-events-none">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: "conic-gradient(from 0deg, transparent 0deg, hsl(43 90% 67% / 0.18) 55deg, transparent 80deg)",
                }}
              />
            </div>

            {/* Ring 1 — outermost, very slow */}
            <div
              className="absolute inset-0 rounded-full border border-[#C5A059]/15 animate-matrix-ring"
              style={{ animationDuration: "16s" }}
            />

            {/* Ring 2 — dashed, reverse */}
            <div
              className="absolute inset-3 rounded-full border border-dashed border-[#C5A059]/25 animate-matrix-ring-reverse"
              style={{ animationDuration: "10s" }}
            />

            {/* Ring 3 — with orbiting dots */}
            <div
              className="absolute inset-7 rounded-full border-2 border-[#C5A059]/40 animate-matrix-ring"
              style={{ animationDuration: "6s" }}
            >
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#C5A059]"
                style={{ boxShadow: "0 0 12px hsl(43 90% 67% / 1), 0 0 24px hsl(43 90% 67% / 0.5)" }} />
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#C5A059]/60" />
              <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 rounded-full bg-[#C5A059]/70" />
              <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#C5A059]/50" />
            </div>

            {/* Ring 4 — inner breathe */}
            <div className="absolute inset-14 rounded-full border border-[#C5A059]/50 animate-ring-breathe" />

            {/* Palm image container */}
            {imagePreview && (
              <div
                className="relative w-40 h-40 rounded-2xl overflow-hidden border-2 border-[#C5A059]/70 animate-hud-flicker"
                style={{ boxShadow: "0 0 30px hsl(43 90% 67% / 0.35), 0 0 60px hsl(43 90% 67% / 0.12)" }}
              >
                <img src={imagePreview} alt="Your palm" className="w-full h-full object-cover" />

                {/* Laser sweep */}
                <div
                  className="absolute left-0 right-0 h-0.5 animate-laser-sweep pointer-events-none"
                  style={{
                    background: "linear-gradient(90deg, transparent, hsl(43 90% 67%), transparent)",
                    boxShadow: "0 0 16px hsl(43 90% 67% / 0.9), 0 0 32px hsl(43 90% 67% / 0.5)",
                  }}
                />

                {/* Sacred geometry SVG */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  viewBox="0 0 100 100"
                  style={{ opacity: 0.22 }}
                >
                  <polygon points="50,4 96,28 96,72 50,96 4,72 4,28"
                    fill="none" stroke="hsl(43,90%,67%)" strokeWidth="0.6" />
                  <polygon points="50,18 80,34 80,66 50,82 20,66 20,34"
                    fill="none" stroke="hsl(43,90%,67%)" strokeWidth="0.4" />
                  <line x1="50" y1="4"  x2="50" y2="96" stroke="hsl(43,90%,67%)" strokeWidth="0.25" />
                  <line x1="4"  y1="28" x2="96" y2="72" stroke="hsl(43,90%,67%)" strokeWidth="0.25" />
                  <line x1="96" y1="28" x2="4"  y2="72" stroke="hsl(43,90%,67%)" strokeWidth="0.25" />
                  <circle cx="50" cy="50" r="12" fill="none" stroke="hsl(43,90%,67%)" strokeWidth="0.3" />
                </svg>

                {/* Biometric detection pings */}
                {BIOMETRIC_POINTS.map((pt, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 rounded-full bg-[#C5A059] animate-biometric-ping pointer-events-none"
                    style={{
                      top: pt.top,
                      left: pt.left,
                      animationDelay: `${i * 0.35}s`,
                      animationDuration: `${1.8 + (i % 3) * 0.4}s`,
                      boxShadow: "0 0 6px hsl(43 90% 67% / 0.9)",
                    }}
                  />
                ))}

                {/* Corner brackets */}
                <div className="absolute top-2 left-2 w-5 h-5 border-l-2 border-t-2 border-[#C5A059] animate-corner-pulse" />
                <div className="absolute top-2 right-2 w-5 h-5 border-r-2 border-t-2 border-[#C5A059] animate-corner-pulse" style={{ animationDelay: "0.25s" }} />
                <div className="absolute bottom-2 left-2 w-5 h-5 border-l-2 border-b-2 border-[#C5A059] animate-corner-pulse" style={{ animationDelay: "0.5s" }} />
                <div className="absolute bottom-2 right-2 w-5 h-5 border-r-2 border-b-2 border-[#C5A059] animate-corner-pulse" style={{ animationDelay: "0.75s" }} />
              </div>
            )}

            {/* Rising particles */}
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-[#C5A059]/70 animate-particle-rise pointer-events-none"
                style={{
                  left: `${12 + i * 8}%`,
                  bottom: "8%",
                  animationDelay: `${i * 0.28}s`,
                  animationDuration: `${1.8 + (i % 4) * 0.4}s`,
                  boxShadow: "0 0 6px hsl(43 90% 67% / 0.8)",
                }}
              />
            ))}

            {/* Second orbiting dot ring — slower */}
            <div className="absolute inset-0 animate-matrix-ring" style={{ animationDuration: "4s" }}>
              <div className="absolute top-1/2 -left-1 w-1.5 h-1.5 bg-[#C5A059] rounded-full"
                style={{ boxShadow: "0 0 8px hsl(43 90% 67% / 0.8)" }} />
            </div>
            <div className="absolute inset-0 animate-matrix-ring" style={{ animationDuration: "7s", animationDelay: "1.5s" }}>
              <div className="absolute top-1/2 -right-1 w-1 h-1 bg-[#C5A059]/60 rounded-full" />
            </div>
          </div>

          {/* Status block */}
          <div className="w-full max-w-xs space-y-4">
            <p className="font-display text-base text-[#C5A059] animate-pulse">
              Reading your palm...
            </p>

            {/* Cycling scan steps */}
            <div className="flex flex-col items-center gap-1.5">
              {SCAN_STEPS.map((text, i) => (
                <div
                  key={text}
                  className="flex items-center gap-2 text-xs text-muted-foreground animate-data-stream"
                  style={{ animationDelay: `${i * 0.3}s` }}
                >
                  <div className="w-1 h-1 bg-[#C5A059]/60 rounded-full" />
                  <span>{text}</span>
                </div>
              ))}
            </div>

            {/* HUD counters */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { label: "Lines",   value: "6" },
                { label: "Mounts",  value: "8" },
                { label: "Markers", value: "…" },
              ].map(({ label, value }) => (
                <div key={label} className="text-center border border-[#C5A059]/20 rounded-lg p-2 bg-[#0B1A1A]">
                  <div className="text-[#C5A059] text-xl font-['Libre_Baskerville'] animate-pulse">{value}</div>
                  <div className="text-[9px] text-muted-foreground tracking-wider uppercase mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── DONE ── */}
      {phase === "done" && reading && (
        <div className="space-y-5 pb-8">

          {/* ① Archetype header */}
          {reading.archetype && (
            <div className="text-center space-y-3 pt-4">
              <div className="inline-flex items-center gap-2 bg-[#C5A059]/10 border border-[#C5A059]/30 rounded-full px-4 py-1.5">
                <span className="text-xs text-muted-foreground">{reading.handType} · {reading.element}</span>
              </div>
              <h2 className="font-display text-2xl text-[#C5A059]">{reading.archetype.name}</h2>
              <div className="flex justify-center flex-wrap gap-2">
                {reading.archetype.traits?.map((t: string) => (
                  <span key={t} className="text-xs bg-[#0B1A1A] border border-[#C5A059]/20 rounded-full px-3 py-1 text-[#FFFDD0]/80">{t}</span>
                ))}
              </div>
              <p className="text-sm text-[#FFFDD0]/80 max-w-sm mx-auto leading-relaxed">{reading.archetype.summary}</p>
              {reading.archetype.shadow && (
                <p className="text-xs text-muted-foreground max-w-sm mx-auto italic border-l-2 border-[#C5A059]/30 pl-3 text-left">
                  Shadow: {reading.archetype.shadow}
                </p>
              )}
              {reading.archetype.hiddenGift && (
                <p className="text-xs text-[#C5A059]/80 max-w-sm mx-auto border-l-2 border-[#C5A059]/50 pl-3 text-left">
                  ✦ {reading.archetype.hiddenGift}
                </p>
              )}
            </div>
          )}

          {/* ② Overall reading */}
          {reading.overallReading && (
            <ReadingCard>
              <SectionHeader label="Your Life Reading" />
              {reading.overallReading.lifeTheme && (
                <div className="mb-3">
                  <p className="text-[10px] text-[#C5A059]/60 uppercase tracking-wider mb-1">Life Theme</p>
                  <p className="text-sm text-[#FFFDD0]/80 leading-relaxed">{reading.overallReading.lifeTheme}</p>
                </div>
              )}
              {reading.overallReading.currentChapter && (
                <div className="mb-3">
                  <p className="text-[10px] text-[#C5A059]/60 uppercase tracking-wider mb-1">Right Now</p>
                  <p className="text-sm text-[#FFFDD0]/80 leading-relaxed">{reading.overallReading.currentChapter}</p>
                </div>
              )}
              {reading.overallReading.cosmicMessage && (
                <div className="bg-[#C5A059]/10 border border-[#C5A059]/20 rounded-xl p-3">
                  <p className="text-[10px] text-[#C5A059] uppercase tracking-wider mb-1">Cosmic Message</p>
                  <p className="text-sm text-[#FFFDD0]/90 leading-relaxed italic">{reading.overallReading.cosmicMessage}</p>
                </div>
              )}
            </ReadingCard>
          )}

          {/* ③ Major lines */}
          {reading.lines && Object.keys(reading.lines).filter(k => ["heart","head","life","fate"].includes(k)).length > 0 && (
            <div className="space-y-3">
              <SectionHeader label="The Major Lines" />
              {(["heart","head","life","fate"] as const).map((key) => {
                const line = reading.lines[key];
                if (!line) return null;
                const labels: Record<string, string> = { heart: "♡ Heart Line", head: "◎ Head Line", life: "✦ Life Line", fate: "↑ Fate Line" };
                return (
                  <ReadingCard key={key}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-display text-sm text-[#C5A059]">{labels[key]}</span>
                      <StrengthBadge value={line.strength} />
                    </div>
                    <p className="text-sm text-[#FFFDD0]/75 leading-relaxed mb-2">{line.description}</p>
                    {(line.loveStyle || line.thinkingStyle || line.vitalityMessage || line.careerMessage) && (
                      <p className="text-xs text-[#FFFDD0]/55 leading-relaxed italic border-t border-[#C5A059]/10 pt-2">
                        {line.loveStyle || line.thinkingStyle || line.vitalityMessage || line.careerMessage}
                      </p>
                    )}
                  </ReadingCard>
                );
              })}
            </div>
          )}

          {/* ④ Minor lines */}
          {reading.lines && (reading.lines.sun || reading.lines.mercury) && (
            <div className="space-y-3">
              <SectionHeader label="The Minor Lines" />
              {reading.lines.sun && (
                <ReadingCard>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-display text-sm text-[#C5A059]">☀ Sun Line</span>
                    <StrengthBadge value={reading.lines.sun.present ? "present" : "absent"} />
                  </div>
                  <p className="text-sm text-[#FFFDD0]/75 leading-relaxed">{reading.lines.sun.description}</p>
                </ReadingCard>
              )}
              {reading.lines.mercury && (
                <ReadingCard>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-display text-sm text-[#C5A059]">☿ Mercury Line</span>
                    <StrengthBadge value={reading.lines.mercury.present ? "present" : "absent"} />
                  </div>
                  <p className="text-sm text-[#FFFDD0]/75 leading-relaxed">{reading.lines.mercury.description}</p>
                </ReadingCard>
              )}
            </div>
          )}

          {/* ⑤ Mounts */}
          {reading.mounts && Object.keys(reading.mounts).length > 0 && (
            <div className="space-y-3">
              <SectionHeader label="The Mounts" />
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(reading.mounts).map(([key, mount]: [string, any]) => (
                  <ReadingCard key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-display text-xs text-[#C5A059] capitalize">{key}</span>
                      <StrengthBadge value={mount.prominence} />
                    </div>
                    <p className="text-xs text-[#FFFDD0]/65 leading-relaxed">{mount.meaning}</p>
                  </ReadingCard>
                ))}
              </div>
            </div>
          )}

          {/* ⑥ Fingers */}
          {reading.fingers && Object.keys(reading.fingers).length > 0 && (
            <ReadingCard>
              <SectionHeader label="Fingers &amp; Thumb" />
              <div className="space-y-3">
                {Object.entries(reading.fingers).map(([key, finger]: [string, any]) => (
                  <div key={key} className="border-b border-[#C5A059]/10 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[#C5A059] text-xs capitalize font-display">{key === "index" ? "Index Finger" : key === "middle" ? "Middle Finger" : key === "ring" ? "Ring Finger" : key === "pinky" ? "Pinky Finger" : "Thumb"}</span>
                      {finger.length && <StrengthBadge value={finger.length} />}
                      {finger.flexibility && <StrengthBadge value={finger.flexibility} />}
                    </div>
                    <p className="text-xs text-[#FFFDD0]/65 leading-relaxed">{finger.reading}</p>
                  </div>
                ))}
              </div>
            </ReadingCard>
          )}

          {/* ⑦ Love */}
          {reading.love && (
            <ReadingCard>
              <SectionHeader label="Love &amp; Soul Connection" />
              {reading.love.relationshipStyle && (
                <div className="mb-3">
                  <p className="text-[10px] text-[#C5A059]/60 uppercase tracking-wider mb-1">How You Love</p>
                  <p className="text-sm text-[#FFFDD0]/75 leading-relaxed">{reading.love.relationshipStyle}</p>
                </div>
              )}
              {reading.love.soulMateQualities && (
                <div className="mb-3">
                  <p className="text-[10px] text-[#C5A059]/60 uppercase tracking-wider mb-1">Your Soul Match</p>
                  <p className="text-sm text-[#FFFDD0]/75 leading-relaxed">{reading.love.soulMateQualities}</p>
                </div>
              )}
              {reading.love.currentLoveEnergy && (
                <div className="mb-3">
                  <p className="text-[10px] text-[#C5A059]/60 uppercase tracking-wider mb-1">Right Now</p>
                  <p className="text-sm text-[#FFFDD0]/75 leading-relaxed">{reading.love.currentLoveEnergy}</p>
                </div>
              )}
              {reading.love.advice && (
                <div className="bg-[#C5A059]/10 border border-[#C5A059]/20 rounded-xl p-3">
                  <p className="text-xs text-[#FFFDD0]/80 italic">{reading.love.advice}</p>
                </div>
              )}
            </ReadingCard>
          )}

          {/* ⑧ Career */}
          {reading.career && (
            <ReadingCard>
              <SectionHeader label="Career &amp; Destiny" />
              {reading.career.naturalTalents && (
                <div className="mb-3">
                  <p className="text-[10px] text-[#C5A059]/60 uppercase tracking-wider mb-1">Natural Gifts</p>
                  <p className="text-sm text-[#FFFDD0]/75 leading-relaxed">{reading.career.naturalTalents}</p>
                </div>
              )}
              {reading.career.successPotential && (
                <div className="mb-3">
                  <p className="text-[10px] text-[#C5A059]/60 uppercase tracking-wider mb-1">Success Potential</p>
                  <p className="text-sm text-[#FFFDD0]/75 leading-relaxed">{reading.career.successPotential}</p>
                </div>
              )}
              {reading.career.timing && (
                <div className="mb-3">
                  <p className="text-[10px] text-[#C5A059]/60 uppercase tracking-wider mb-1">Timing</p>
                  <p className="text-sm text-[#FFFDD0]/75 leading-relaxed">{reading.career.timing}</p>
                </div>
              )}
              {reading.career.advice && (
                <div className="bg-[#C5A059]/10 border border-[#C5A059]/20 rounded-xl p-3">
                  <p className="text-xs text-[#FFFDD0]/80 italic">{reading.career.advice}</p>
                </div>
              )}
            </ReadingCard>
          )}

          {/* ⑨ Health */}
          {reading.health && (
            <ReadingCard>
              <SectionHeader label="Health &amp; Vitality" />
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-[#FFFDD0]/50">Vitality level</span>
                {reading.health.vitalityLevel && <StrengthBadge value={reading.health.vitalityLevel} />}
              </div>
              {reading.health.strengths && (
                <p className="text-sm text-[#FFFDD0]/75 leading-relaxed mb-2">{reading.health.strengths}</p>
              )}
              {reading.health.areasToNurture && (
                <p className="text-sm text-[#FFFDD0]/60 leading-relaxed mb-2 italic">{reading.health.areasToNurture}</p>
              )}
              {reading.health.advice && (
                <div className="bg-[#C5A059]/10 border border-[#C5A059]/20 rounded-xl p-3">
                  <p className="text-xs text-[#FFFDD0]/80 italic">{reading.health.advice}</p>
                </div>
              )}
            </ReadingCard>
          )}

          {/* ⑩ Past · Present · Future */}
          {reading.timeline && (
            <ReadingCard>
              <SectionHeader label="Past · Present · Future" />
              <div className="space-y-4">
                {[
                  { key: "past",    label: "Past",    color: "text-[#FFFDD0]/50" },
                  { key: "present", label: "Present", color: "text-[#C5A059]" },
                  { key: "future",  label: "Future",  color: "text-[#FFFDD0]/80" },
                ].map(({ key, label, color }) => {
                  const val = (reading.timeline as any)[key];
                  if (!val) return null;
                  return (
                    <div key={key} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-2 h-2 rounded-full mt-1.5 ${key === "present" ? "bg-[#C5A059]" : "bg-[#C5A059]/30"}`} />
                        {key !== "future" && <div className="w-px flex-1 bg-[#C5A059]/15 mt-1" />}
                      </div>
                      <div className="pb-3">
                        <p className={`text-[10px] uppercase tracking-wider font-semibold mb-1 ${color}`}>{label}</p>
                        <p className="text-sm text-[#FFFDD0]/70 leading-relaxed">{val}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ReadingCard>
          )}

          {/* ⑪ Markings */}
          {reading.markings && reading.markings.length > 0 && (
            <div className="space-y-3">
              <SectionHeader label="Sacred Markings" />
              {reading.markings.map((m: any, i: number) => (
                <ReadingCard key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-display text-xs text-[#C5A059] capitalize">{m.type} — {m.location}</span>
                    {m.significance && <StrengthBadge value={m.significance} />}
                  </div>
                  <p className="text-xs text-[#FFFDD0]/70 leading-relaxed">{m.meaning}</p>
                </ReadingCard>
              ))}
            </div>
          )}

          {/* ⑫ Closing message */}
          {reading.closingMessage && (
            <div
              className="rounded-2xl p-5 text-center space-y-2"
              style={{
                background: "linear-gradient(135deg, hsl(43 90% 67% / 0.12), hsl(280 40% 55% / 0.08))",
                border: "1px solid hsl(43 90% 67% / 0.3)",
                boxShadow: "0 0 40px hsl(43 90% 67% / 0.08)",
              }}
            >
              <p className="text-[10px] text-[#C5A059] uppercase tracking-[0.25em]">Your Cosmic Message</p>
              <p className="font-display text-base text-[#FFFDD0] leading-relaxed">{reading.closingMessage}</p>
            </div>
          )}

          {/* Reset */}
          <div className="flex justify-center pt-2">
            <Button variant="outline" onClick={handleReset} className="rounded-full border-[#C5A059]/30 text-[#C5A059]/70 hover:text-[#C5A059]">
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
