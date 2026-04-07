import { useState, useRef, useEffect } from "react";
import { Camera, RotateCcw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface PalmChamberProps {
  onBack: () => void;
}

// Warrior Oracle color palette
const BURNT_GOLD = "#C5A059";
const MATRIX_GREEN = "#00ff00";

export function PalmChamber({ onBack }: PalmChamberProps) {
  const [phase, setPhase] = useState<"idle" | "scanning" | "done">("idle");
  const [reading, setReading] = useState<any>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Matrix characters - Japanese katakana + alphanumeric
  const matrixChars = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  // Handle scan progress animation - loops from 0 to 100
  useEffect(() => {
    if (phase === "scanning") {
      setScanProgress(0);
      scanIntervalRef.current = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) return 0;
          return prev + 0.8;
        });
      }, 50);
    } else {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
      setScanProgress(0);
    }

    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, [phase]);

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

  // Generate random matrix character
  const getRandomChar = () => matrixChars[Math.floor(Math.random() * matrixChars.length)];

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: '#000000' }}
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

        {/* SCANNING STATE with Matrix rain effect */}
        {phase === "scanning" && (
          <div className="flex flex-col items-center text-center pt-6 space-y-6">
            {imagePreview && (
              <div 
                className="relative w-80 h-96 overflow-hidden"
                style={{ borderRadius: '8px' }}
              >
                {/* Captured image */}
                <img 
                  src={imagePreview} 
                  alt="Your palm" 
                  className="w-full h-full object-cover"
                />
                
                {/* Matrix rain overlay - 20 columns of falling characters */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {Array.from({ length: 20 }).map((_, colIndex) => (
                    <div
                      key={colIndex}
                      className="absolute top-0 matrix-rain-column"
                      style={{
                        left: `${(colIndex / 20) * 100}%`,
                        animationDelay: `${Math.random() * 2}s`,
                        animationDuration: `${1.5 + Math.random() * 1.5}s`,
                      }}
                    >
                      {Array.from({ length: 15 }).map((_, charIndex) => (
                        <div
                          key={charIndex}
                          className="text-xs font-mono leading-tight"
                          style={{
                            color: charIndex === 0 
                              ? MATRIX_GREEN 
                              : `rgba(0, 255, 0, ${Math.max(0.1, 0.9 - charIndex * 0.06)})`,
                            textShadow: charIndex === 0 
                              ? `0 0 10px ${MATRIX_GREEN}, 0 0 20px ${MATRIX_GREEN}` 
                              : `0 0 5px ${MATRIX_GREEN}`,
                          }}
                        >
                          {getRandomChar()}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Horizontal laser scan line - position based on progress (0-100%) */}
                <div 
                  className="absolute left-0 right-0 h-1 pointer-events-none transition-none"
                  style={{
                    top: `${scanProgress}%`,
                    background: `linear-gradient(90deg, transparent 0%, ${MATRIX_GREEN} 10%, ${MATRIX_GREEN} 90%, transparent 100%)`,
                    boxShadow: `0 0 10px ${MATRIX_GREEN}, 0 0 20px ${MATRIX_GREEN}, 0 0 40px ${MATRIX_GREEN}, 0 -8px 25px ${MATRIX_GREEN}50, 0 8px 25px ${MATRIX_GREEN}50`,
                  }}
                />

                {/* Scan line glow trail above the line */}
                <div 
                  className="absolute left-0 right-0 pointer-events-none"
                  style={{
                    top: `${Math.max(0, scanProgress - 15)}%`,
                    height: '15%',
                    background: `linear-gradient(to bottom, transparent, rgba(0, 255, 0, 0.1))`,
                  }}
                />

                {/* Corner brackets - Green to match Matrix theme */}
                <div 
                  className="absolute top-3 left-3 w-8 h-8 pointer-events-none"
                  style={{
                    borderTop: `2px solid ${MATRIX_GREEN}`,
                    borderLeft: `2px solid ${MATRIX_GREEN}`,
                  }}
                />
                <div 
                  className="absolute top-3 right-3 w-8 h-8 pointer-events-none"
                  style={{
                    borderTop: `2px solid ${MATRIX_GREEN}`,
                    borderRight: `2px solid ${MATRIX_GREEN}`,
                  }}
                />
                <div 
                  className="absolute bottom-3 left-3 w-8 h-8 pointer-events-none"
                  style={{
                    borderBottom: `2px solid ${MATRIX_GREEN}`,
                    borderLeft: `2px solid ${MATRIX_GREEN}`,
                  }}
                />
                <div 
                  className="absolute bottom-3 right-3 w-8 h-8 pointer-events-none"
                  style={{
                    borderBottom: `2px solid ${MATRIX_GREEN}`,
                    borderRight: `2px solid ${MATRIX_GREEN}`,
                  }}
                />
              </div>
            )}

            {/* Progress percentage - large display */}
            <div 
              className="text-6xl font-light tracking-wider"
              style={{ 
                color: MATRIX_GREEN,
                fontFamily: "'Libre Baskerville', serif",
                fontStyle: 'italic',
                textShadow: `0 0 20px rgba(0, 255, 0, 0.5)`,
              }}
            >
              {Math.round(scanProgress)}%
            </div>

            {/* Status text */}
            <div className="flex flex-col items-center gap-4">
              <span 
                className="text-sm tracking-[0.3em] uppercase"
                style={{ color: MATRIX_GREEN, fontWeight: 300 }}
              >
                Scanning Palm Lines...
              </span>
              
              {/* Progress bar */}
              <div 
                className="w-64 h-1 rounded-full overflow-hidden"
                style={{ backgroundColor: 'rgba(0, 255, 0, 0.2)' }}
              >
                <div 
                  className="h-full rounded-full"
                  style={{ 
                    width: `${scanProgress}%`,
                    backgroundColor: MATRIX_GREEN,
                    boxShadow: `0 0 10px ${MATRIX_GREEN}`,
                    transition: 'width 50ms linear',
                  }}
                />
              </div>
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

      {/* Keyframe animation styles for Matrix rain */}
      <style>{`
        @keyframes matrixRain {
          0% {
            transform: translateY(-100%);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(400%);
            opacity: 0;
          }
        }
        
        .matrix-rain-column {
          animation: matrixRain 2s linear infinite;
        }
      `}</style>
    </div>
  );
}

export default PalmChamber;
