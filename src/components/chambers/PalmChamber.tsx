import { useState, useRef } from "react";
import { Camera, RotateCcw, Loader2, Scan } from "lucide-react";
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

  // Warrior Oracle color palette
  const burntGold = "#C5A059";
  const absoluteBlack = "#000000";

  return (
    <div className="min-h-screen" style={{ backgroundColor: absoluteBlack }}>
      <ChamberLayout title="The Palm" subtitle="Warrior Oracle" onBack={onBack}>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFile}
          className="hidden"
        />

        {/* IDLE STATE */}
        {phase === "idle" && (
          <div className="flex flex-col items-center text-center pt-16 space-y-10">
            {/* Icon container */}
            <div 
              className="relative w-28 h-28 rounded-full flex items-center justify-center"
              style={{ 
                border: `1px solid ${burntGold}30`,
                background: `radial-gradient(circle, ${burntGold}08 0%, transparent 70%)`
              }}
            >
              <div 
                className="absolute inset-0 rounded-full animate-pulse"
                style={{ 
                  boxShadow: `0 0 40px ${burntGold}15, inset 0 0 30px ${burntGold}05`
                }}
              />
              <Scan className="w-12 h-12" style={{ color: burntGold }} />
            </div>

            {/* Text */}
            <div className="space-y-3 max-w-xs">
              <h2 
                className="text-2xl tracking-wide"
                style={{ 
                  color: burntGold,
                  fontFamily: "'Libre Baskerville', serif",
                  fontWeight: 400
                }}
              >
                Warrior Oracle
              </h2>
              <p 
                className="text-sm leading-relaxed tracking-wide"
                style={{ 
                  color: `${burntGold}99`,
                  fontWeight: 300
                }}
              >
                Capture your palm. The ancient lines reveal your warrior path, encoded in flesh and fate.
              </p>
            </div>

            {/* CTA Button */}
            <Button
              onClick={() => fileRef.current?.click()}
              size="lg"
              className="rounded-full px-10 py-6 text-sm tracking-widest uppercase transition-all duration-300 hover:scale-105"
              style={{ 
                backgroundColor: 'transparent',
                border: `1px solid ${burntGold}`,
                color: burntGold,
              }}
            >
              <Camera className="w-4 h-4 mr-3" />
              Begin Scan
            </Button>
          </div>
        )}

        {/* SCANNING STATE with laser grid and scan line */}
        {phase === "scanning" && (
          <div className="flex flex-col items-center text-center pt-10 space-y-8">
            {imagePreview && (
              <div 
                className="relative w-64 h-64 rounded-lg overflow-hidden"
                style={{ border: `1px solid ${burntGold}40` }}
              >
                {/* Captured image */}
                <img 
                  src={imagePreview} 
                  alt="Your palm" 
                  className="w-full h-full object-cover"
                  style={{ filter: 'grayscale(30%) contrast(1.1)' }}
                />
                
                {/* Laser grid overlay */}
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: `
                      linear-gradient(${burntGold}20 1px, transparent 1px),
                      linear-gradient(90deg, ${burntGold}20 1px, transparent 1px)
                    `,
                    backgroundSize: '20px 20px',
                  }}
                />

                {/* Diagonal laser lines */}
                <div 
                  className="absolute inset-0 pointer-events-none opacity-30"
                  style={{
                    backgroundImage: `
                      linear-gradient(45deg, ${burntGold}15 1px, transparent 1px),
                      linear-gradient(-45deg, ${burntGold}15 1px, transparent 1px)
                    `,
                    backgroundSize: '30px 30px',
                  }}
                />

                {/* Moving horizontal scan line */}
                <div 
                  className="absolute left-0 right-0 h-1 pointer-events-none"
                  style={{
                    background: `linear-gradient(90deg, transparent 0%, ${burntGold} 20%, ${burntGold} 80%, transparent 100%)`,
                    boxShadow: `0 0 20px ${burntGold}, 0 0 40px ${burntGold}80, 0 0 60px ${burntGold}40`,
                    animation: 'scanLine 2s ease-in-out infinite',
                  }}
                />

                {/* Corner brackets */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {/* Top-left */}
                  <path d="M 8 24 L 8 8 L 24 8" stroke={burntGold} strokeWidth="2" fill="none" opacity="0.8" />
                  {/* Top-right */}
                  <path d="M 240 8 L 256 8 L 256 24" stroke={burntGold} strokeWidth="2" fill="none" opacity="0.8" />
                  {/* Bottom-left */}
                  <path d="M 8 240 L 8 256 L 24 256" stroke={burntGold} strokeWidth="2" fill="none" opacity="0.8" />
                  {/* Bottom-right */}
                  <path d="M 256 240 L 256 256 L 240 256" stroke={burntGold} strokeWidth="2" fill="none" opacity="0.8" />
                </svg>

                {/* Subtle vignette */}
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at center, transparent 40%, ${absoluteBlack}90 100%)`
                  }}
                />
              </div>
            )}

            {/* Status text */}
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-3">
                <Loader2 
                  className="w-4 h-4 animate-spin" 
                  style={{ color: burntGold }} 
                />
                <span 
                  className="text-xs tracking-[0.3em] uppercase"
                  style={{ color: burntGold }}
                >
                  Analyzing Patterns
                </span>
              </div>
              <div 
                className="w-48 h-px"
                style={{
                  background: `linear-gradient(90deg, transparent, ${burntGold}60, transparent)`,
                  animation: 'pulse 2s ease-in-out infinite'
                }}
              />
            </div>
          </div>
        )}

        {/* RESULTS STATE with elegant thin typography */}
        {phase === "done" && reading && (
          <div className="space-y-8 pb-8">
            {/* Archetype header */}
            {reading.archetype && (
              <div className="text-center space-y-4 pt-6">
                <div 
                  className="inline-flex items-center gap-3 rounded-full px-5 py-2"
                  style={{ 
                    border: `1px solid ${burntGold}30`,
                    backgroundColor: `${burntGold}08`
                  }}
                >
                  <span 
                    className="text-xs tracking-widest uppercase"
                    style={{ color: `${burntGold}80`, fontWeight: 300 }}
                  >
                    {reading.handType}
                  </span>
                  <span style={{ color: `${burntGold}40` }}>|</span>
                  <span 
                    className="text-xs tracking-widest uppercase"
                    style={{ color: `${burntGold}80`, fontWeight: 300 }}
                  >
                    {reading.element}
                  </span>
                </div>

                <h2 
                  className="text-3xl tracking-wide"
                  style={{ 
                    color: burntGold,
                    fontFamily: "'Libre Baskerville', serif",
                    fontWeight: 400
                  }}
                >
                  {reading.archetype.name}
                </h2>

                {reading.archetype.traits && (
                  <div className="flex justify-center gap-3 flex-wrap">
                    {reading.archetype.traits.map((t: string) => (
                      <span 
                        key={t} 
                        className="text-xs tracking-wider px-4 py-1.5 rounded-full"
                        style={{ 
                          color: `${burntGold}90`,
                          border: `1px solid ${burntGold}20`,
                          fontWeight: 300
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                <p 
                  className="text-sm max-w-sm mx-auto leading-relaxed"
                  style={{ 
                    color: `${burntGold}70`,
                    fontWeight: 300
                  }}
                >
                  {reading.archetype.summary}
                </p>

                {reading.archetype.shadow && (
                  <p 
                    className="text-xs max-w-sm mx-auto italic"
                    style={{ color: `${burntGold}50` }}
                  >
                    {reading.archetype.shadow}
                  </p>
                )}
              </div>
            )}

            {/* Divider */}
            <div 
              className="w-full h-px mx-auto"
              style={{ background: `linear-gradient(90deg, transparent, ${burntGold}30, transparent)` }}
            />

            {/* Overview */}
            {reading.reading?.overview && (
              <div 
                className="rounded-lg p-5"
                style={{ 
                  border: `1px solid ${burntGold}15`,
                  backgroundColor: `${burntGold}05`
                }}
              >
                <h3 
                  className="text-xs tracking-[0.2em] uppercase mb-3"
                  style={{ color: burntGold, fontWeight: 400 }}
                >
                  Overview
                </h3>
                <p 
                  className="text-sm leading-relaxed"
                  style={{ color: `${burntGold}80`, fontWeight: 300 }}
                >
                  {reading.reading.overview}
                </p>
              </div>
            )}

            {/* Lines */}
            {reading.lines && (
              <div className="space-y-4">
                <h3 
                  className="text-xs tracking-[0.2em] uppercase"
                  style={{ color: burntGold, fontWeight: 400 }}
                >
                  Lines
                </h3>
                {Object.entries(reading.lines).map(([key, line]: [string, any]) => (
                  <div 
                    key={key} 
                    className="rounded-lg p-4"
                    style={{ 
                      border: `1px solid ${burntGold}15`,
                      backgroundColor: `${burntGold}05`
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span 
                        className="text-sm capitalize"
                        style={{ 
                          color: burntGold,
                          fontFamily: "'Libre Baskerville', serif"
                        }}
                      >
                        {key} Line
                      </span>
                      <span 
                        className="text-xs tracking-wider uppercase"
                        style={{ color: `${burntGold}50`, fontWeight: 300 }}
                      >
                        {line.strength}
                      </span>
                    </div>
                    <p 
                      className="text-sm leading-relaxed"
                      style={{ color: `${burntGold}70`, fontWeight: 300 }}
                    >
                      {line.description}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Mounts */}
            {reading.mounts && (
              <div className="space-y-4">
                <h3 
                  className="text-xs tracking-[0.2em] uppercase"
                  style={{ color: burntGold, fontWeight: 400 }}
                >
                  Mounts
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(reading.mounts).map(([key, mount]: [string, any]) => (
                    <div 
                      key={key} 
                      className="rounded-lg p-4"
                      style={{ 
                        border: `1px solid ${burntGold}15`,
                        backgroundColor: `${burntGold}05`
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span 
                          className="text-xs capitalize"
                          style={{ 
                            color: burntGold,
                            fontFamily: "'Libre Baskerville', serif"
                          }}
                        >
                          {key}
                        </span>
                        <span 
                          className="text-[10px] tracking-wider uppercase"
                          style={{ color: `${burntGold}50`, fontWeight: 300 }}
                        >
                          {mount.prominence}
                        </span>
                      </div>
                      <p 
                        className="text-xs leading-relaxed"
                        style={{ color: `${burntGold}70`, fontWeight: 300 }}
                      >
                        {mount.meaning}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Markings */}
            {reading.markings && reading.markings.length > 0 && (
              <div className="space-y-4">
                <h3 
                  className="text-xs tracking-[0.2em] uppercase"
                  style={{ color: burntGold, fontWeight: 400 }}
                >
                  Markings
                </h3>
                {reading.markings.map((m: any, i: number) => (
                  <div 
                    key={i} 
                    className="rounded-lg p-4"
                    style={{ 
                      border: `1px solid ${burntGold}15`,
                      backgroundColor: `${burntGold}05`
                    }}
                  >
                    <span 
                      className="text-xs"
                      style={{ 
                        color: burntGold,
                        fontFamily: "'Libre Baskerville', serif"
                      }}
                    >
                      {m.type} — {m.location}
                    </span>
                    <p 
                      className="text-xs mt-2 leading-relaxed"
                      style={{ color: `${burntGold}70`, fontWeight: 300 }}
                    >
                      {m.meaning}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Reset button */}
            <div className="flex justify-center pt-4">
              <Button 
                variant="outline" 
                onClick={handleReset} 
                className="rounded-full px-8 py-5 text-xs tracking-widest uppercase transition-all duration-300 hover:scale-105"
                style={{ 
                  backgroundColor: 'transparent',
                  border: `1px solid ${burntGold}50`,
                  color: burntGold,
                }}
              >
                <RotateCcw className="w-4 h-4 mr-3" />
                Scan Another
              </Button>
            </div>
          </div>
        )}

        {/* Keyframe animation styles */}
        <style>{`
          @keyframes scanLine {
            0%, 100% {
              top: 0%;
              opacity: 0;
            }
            10% {
              opacity: 1;
            }
            90% {
              opacity: 1;
            }
            100% {
              top: 100%;
              opacity: 0;
            }
          }
        `}</style>
      </ChamberLayout>
    </div>
  );
}

export default PalmChamber;
