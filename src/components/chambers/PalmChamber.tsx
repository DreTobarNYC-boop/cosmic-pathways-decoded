import { useState, useRef } from "react";
import { Camera, RotateCcw, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface PalmChamberProps {
  onBack: () => void;
}

// Warrior Oracle color palette
const BURNT_GOLD = "#C5A059";
const ABSOLUTE_BLACK = "#000000";

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
    <div 
      className="min-h-screen"
      style={{ backgroundColor: ABSOLUTE_BLACK }}
    >
      {/* Custom header for Warrior Oracle */}
      <header className="px-5 pt-6 pb-4 flex items-center gap-4">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300"
          style={{ 
            border: `1px solid ${BURNT_GOLD}40`,
            color: BURNT_GOLD,
          }}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 
            className="text-lg tracking-wide"
            style={{ 
              color: BURNT_GOLD,
              fontFamily: "'Libre Baskerville', serif",
              fontWeight: 400
            }}
          >
            The Palm
          </h1>
          <p 
            className="text-xs tracking-widest uppercase"
            style={{ color: `${BURNT_GOLD}60` }}
          >
            Warrior Oracle
          </p>
        </div>
      </header>

      <main className="px-5 pb-10">
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
            {/* Palm icon */}
            <div 
              className="relative w-28 h-28 rounded-full flex items-center justify-center"
              style={{ 
                border: `1px solid ${BURNT_GOLD}30`,
                background: `radial-gradient(circle, ${BURNT_GOLD}08 0%, transparent 70%)`
              }}
            >
              <div 
                className="absolute inset-0 rounded-full animate-pulse"
                style={{ 
                  boxShadow: `0 0 40px ${BURNT_GOLD}15, inset 0 0 30px ${BURNT_GOLD}05`
                }}
              />
              {/* Custom palm/fingerprint icon */}
              <svg 
                viewBox="0 0 48 48" 
                className="w-12 h-12"
                style={{ color: BURNT_GOLD }}
              >
                <path 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeLinecap="round"
                  d="M24 8c-8 0-14 6-14 14s6 18 14 18 14-10 14-18-6-14-14-14z"
                />
                <path 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeLinecap="round"
                  d="M24 14c-4.5 0-8 3.5-8 8s3.5 12 8 12 8-6 8-12-3.5-8-8-8z"
                />
                <path 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeLinecap="round"
                  d="M24 20c-2 0-3.5 1.5-3.5 3.5s1.5 6 3.5 6 3.5-3 3.5-6-1.5-3.5-3.5-3.5z"
                />
              </svg>
            </div>

            {/* Text */}
            <div className="space-y-3 max-w-xs">
              <h2 
                className="text-2xl tracking-wide"
                style={{ 
                  color: BURNT_GOLD,
                  fontFamily: "'Libre Baskerville', serif",
                  fontWeight: 400
                }}
              >
                Warrior Oracle
              </h2>
              <p 
                className="text-sm leading-relaxed tracking-wide"
                style={{ 
                  color: `${BURNT_GOLD}90`,
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
              className="rounded-full px-10 py-6 text-sm tracking-widest uppercase transition-all duration-300 hover:scale-105 border bg-transparent"
              style={{ 
                borderColor: BURNT_GOLD,
                color: BURNT_GOLD,
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
                className="relative w-72 h-72 overflow-hidden"
                style={{ 
                  border: `1px solid ${BURNT_GOLD}50`,
                  borderRadius: '4px'
                }}
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
                      linear-gradient(${BURNT_GOLD}25 1px, transparent 1px),
                      linear-gradient(90deg, ${BURNT_GOLD}25 1px, transparent 1px)
                    `,
                    backgroundSize: '24px 24px',
                  }}
                />

                {/* Diagonal laser lines */}
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: `
                      linear-gradient(45deg, ${BURNT_GOLD}12 1px, transparent 1px),
                      linear-gradient(-45deg, ${BURNT_GOLD}12 1px, transparent 1px)
                    `,
                    backgroundSize: '32px 32px',
                  }}
                />

                {/* Moving horizontal scan line */}
                <div 
                  className="absolute left-0 right-0 h-0.5 pointer-events-none scan-line-animation"
                  style={{
                    background: `linear-gradient(90deg, transparent 0%, ${BURNT_GOLD} 15%, ${BURNT_GOLD} 85%, transparent 100%)`,
                    boxShadow: `0 0 15px ${BURNT_GOLD}, 0 0 30px ${BURNT_GOLD}80, 0 0 45px ${BURNT_GOLD}40`,
                  }}
                />

                {/* Secondary scan line (offset) */}
                <div 
                  className="absolute left-0 right-0 h-px pointer-events-none scan-line-animation-delayed"
                  style={{
                    background: `linear-gradient(90deg, transparent 0%, ${BURNT_GOLD}60 20%, ${BURNT_GOLD}60 80%, transparent 100%)`,
                    boxShadow: `0 0 8px ${BURNT_GOLD}60`,
                  }}
                />

                {/* Corner brackets - Top Left */}
                <div 
                  className="absolute top-2 left-2 w-6 h-6 pointer-events-none"
                  style={{
                    borderTop: `2px solid ${BURNT_GOLD}`,
                    borderLeft: `2px solid ${BURNT_GOLD}`,
                  }}
                />
                {/* Top Right */}
                <div 
                  className="absolute top-2 right-2 w-6 h-6 pointer-events-none"
                  style={{
                    borderTop: `2px solid ${BURNT_GOLD}`,
                    borderRight: `2px solid ${BURNT_GOLD}`,
                  }}
                />
                {/* Bottom Left */}
                <div 
                  className="absolute bottom-2 left-2 w-6 h-6 pointer-events-none"
                  style={{
                    borderBottom: `2px solid ${BURNT_GOLD}`,
                    borderLeft: `2px solid ${BURNT_GOLD}`,
                  }}
                />
                {/* Bottom Right */}
                <div 
                  className="absolute bottom-2 right-2 w-6 h-6 pointer-events-none"
                  style={{
                    borderBottom: `2px solid ${BURNT_GOLD}`,
                    borderRight: `2px solid ${BURNT_GOLD}`,
                  }}
                />

                {/* Subtle vignette */}
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at center, transparent 30%, ${ABSOLUTE_BLACK}95 100%)`
                  }}
                />

                {/* Scanning indicator in corner */}
                <div 
                  className="absolute top-4 right-4 flex items-center gap-2 px-2 py-1 rounded"
                  style={{ backgroundColor: `${ABSOLUTE_BLACK}80` }}
                >
                  <div 
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: BURNT_GOLD }}
                  />
                  <span 
                    className="text-[10px] tracking-wider uppercase"
                    style={{ color: BURNT_GOLD }}
                  >
                    Scanning
                  </span>
                </div>
              </div>
            )}

            {/* Status text */}
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-3">
                <Loader2 
                  className="w-4 h-4 animate-spin" 
                  style={{ color: BURNT_GOLD }} 
                />
                <span 
                  className="text-xs tracking-[0.25em] uppercase"
                  style={{ color: BURNT_GOLD, fontWeight: 300 }}
                >
                  Analyzing Patterns
                </span>
              </div>
              <div 
                className="w-48 h-px animate-pulse"
                style={{
                  background: `linear-gradient(90deg, transparent, ${BURNT_GOLD}60, transparent)`,
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
                    border: `1px solid ${BURNT_GOLD}30`,
                    backgroundColor: `${BURNT_GOLD}08`
                  }}
                >
                  <span 
                    className="text-xs tracking-widest uppercase"
                    style={{ color: `${BURNT_GOLD}80`, fontWeight: 300 }}
                  >
                    {reading.handType}
                  </span>
                  <span style={{ color: `${BURNT_GOLD}40` }}>|</span>
                  <span 
                    className="text-xs tracking-widest uppercase"
                    style={{ color: `${BURNT_GOLD}80`, fontWeight: 300 }}
                  >
                    {reading.element}
                  </span>
                </div>

                <h2 
                  className="text-3xl tracking-wide"
                  style={{ 
                    color: BURNT_GOLD,
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
                          color: `${BURNT_GOLD}90`,
                          border: `1px solid ${BURNT_GOLD}25`,
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
                    color: `${BURNT_GOLD}75`,
                    fontWeight: 300
                  }}
                >
                  {reading.archetype.summary}
                </p>

                {reading.archetype.shadow && (
                  <p 
                    className="text-xs max-w-sm mx-auto italic"
                    style={{ color: `${BURNT_GOLD}50` }}
                  >
                    {reading.archetype.shadow}
                  </p>
                )}
              </div>
            )}

            {/* Divider */}
            <div 
              className="w-full h-px mx-auto"
              style={{ background: `linear-gradient(90deg, transparent, ${BURNT_GOLD}30, transparent)` }}
            />

            {/* Overview */}
            {reading.reading?.overview && (
              <div 
                className="rounded p-5"
                style={{ 
                  border: `1px solid ${BURNT_GOLD}20`,
                  backgroundColor: `${BURNT_GOLD}05`
                }}
              >
                <h3 
                  className="text-xs tracking-[0.2em] uppercase mb-3"
                  style={{ color: BURNT_GOLD, fontWeight: 400 }}
                >
                  Overview
                </h3>
                <p 
                  className="text-sm leading-relaxed"
                  style={{ color: `${BURNT_GOLD}80`, fontWeight: 300 }}
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
                  style={{ color: BURNT_GOLD, fontWeight: 400 }}
                >
                  Lines
                </h3>
                {Object.entries(reading.lines).map(([key, line]: [string, any]) => (
                  <div 
                    key={key} 
                    className="rounded p-4"
                    style={{ 
                      border: `1px solid ${BURNT_GOLD}20`,
                      backgroundColor: `${BURNT_GOLD}05`
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span 
                        className="text-sm capitalize"
                        style={{ 
                          color: BURNT_GOLD,
                          fontFamily: "'Libre Baskerville', serif"
                        }}
                      >
                        {key} Line
                      </span>
                      <span 
                        className="text-xs tracking-wider uppercase"
                        style={{ color: `${BURNT_GOLD}50`, fontWeight: 300 }}
                      >
                        {line.strength}
                      </span>
                    </div>
                    <p 
                      className="text-sm leading-relaxed"
                      style={{ color: `${BURNT_GOLD}70`, fontWeight: 300 }}
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
                  style={{ color: BURNT_GOLD, fontWeight: 400 }}
                >
                  Mounts
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(reading.mounts).map(([key, mount]: [string, any]) => (
                    <div 
                      key={key} 
                      className="rounded p-4"
                      style={{ 
                        border: `1px solid ${BURNT_GOLD}20`,
                        backgroundColor: `${BURNT_GOLD}05`
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span 
                          className="text-xs capitalize"
                          style={{ 
                            color: BURNT_GOLD,
                            fontFamily: "'Libre Baskerville', serif"
                          }}
                        >
                          {key}
                        </span>
                        <span 
                          className="text-[10px] tracking-wider uppercase"
                          style={{ color: `${BURNT_GOLD}50`, fontWeight: 300 }}
                        >
                          {mount.prominence}
                        </span>
                      </div>
                      <p 
                        className="text-xs leading-relaxed"
                        style={{ color: `${BURNT_GOLD}70`, fontWeight: 300 }}
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
                  style={{ color: BURNT_GOLD, fontWeight: 400 }}
                >
                  Markings
                </h3>
                {reading.markings.map((m: any, i: number) => (
                  <div 
                    key={i} 
                    className="rounded p-4"
                    style={{ 
                      border: `1px solid ${BURNT_GOLD}20`,
                      backgroundColor: `${BURNT_GOLD}05`
                    }}
                  >
                    <span 
                      className="text-xs"
                      style={{ 
                        color: BURNT_GOLD,
                        fontFamily: "'Libre Baskerville', serif"
                      }}
                    >
                      {m.type} — {m.location}
                    </span>
                    <p 
                      className="text-xs mt-2 leading-relaxed"
                      style={{ color: `${BURNT_GOLD}70`, fontWeight: 300 }}
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
                className="rounded-full px-8 py-5 text-xs tracking-widest uppercase transition-all duration-300 hover:scale-105 bg-transparent border"
                style={{ 
                  borderColor: `${BURNT_GOLD}60`,
                  color: BURNT_GOLD,
                }}
              >
                <RotateCcw className="w-4 h-4 mr-3" />
                Scan Another
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Keyframe animation styles */}
      <style>{`
        @keyframes scanLineMove {
          0% {
            top: 0%;
            opacity: 0;
          }
          5% {
            opacity: 1;
          }
          95% {
            opacity: 1;
          }
          100% {
            top: 100%;
            opacity: 0;
          }
        }
        
        .scan-line-animation {
          animation: scanLineMove 2.5s ease-in-out infinite;
        }
        
        .scan-line-animation-delayed {
          animation: scanLineMove 2.5s ease-in-out infinite;
          animation-delay: 1.25s;
        }
      `}</style>
    </div>
  );
}

export default PalmChamber;
