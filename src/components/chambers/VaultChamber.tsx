import { useState, useEffect, useCallback, useRef } from "react";
import { ChamberLayout } from "@/components/ChamberLayout";
import { Play, Pause, Volume2, Sparkles } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import {
  SOLFEGGIO_FREQUENCIES,
  startAudio,
  initEngine,
  play,
  stop,
  setVolume,
  dispose,
  type FrequencyPreset,
} from "@/lib/sonic-engine";

/* ── Visualizer Canvas ─────────────────────────────────── */
function Visualizer({ isPlaying, activeColor }: { isPlaying: boolean; activeColor: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const w = (canvas.width = canvas.offsetWidth * 2);
    const h = (canvas.height = canvas.offsetHeight * 2);
    let t = 0;

    function draw() {
      ctx.clearRect(0, 0, w, h);
      if (!isPlaying) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }
      t += 0.008;

      // Concentric breathing rings
      for (let i = 0; i < 5; i++) {
        const radius = 40 + i * 35 + Math.sin(t + i * 0.7) * 20;
        const alpha = 0.15 + Math.sin(t + i) * 0.1;
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, radius, 0, Math.PI * 2);
        ctx.strokeStyle = activeColor.replace(")", ` / ${alpha})`).replace("hsl", "hsla");
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Central glow
      const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, 60 + Math.sin(t) * 20);
      grad.addColorStop(0, activeColor.replace(")", " / 0.4)").replace("hsl", "hsla"));
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      animRef.current = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [isPlaying, activeColor]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-48 rounded-2xl"
      style={{ background: "transparent" }}
    />
  );
}


/* ── Main Component ────────────────────────────────────── */
export function VaultChamber({ onBack }: { onBack: () => void }) {
  const [playing, setPlaying] = useState(false);
  const [activeFreq, setActiveFreq] = useState<FrequencyPreset>(SOLFEGGIO_FREQUENCIES[2]); // 528 Hz default
  const [volume, setVolumeState] = useState(70);

  useEffect(() => {
    return () => {
      dispose();
    };
  }, []);

  const togglePlay = useCallback(async () => {
    if (playing) {
      stop();
      setPlaying(false);
    } else {
      await startAudio();
      initEngine();
      play(activeFreq.hz);
      setPlaying(true);
    }
  }, [playing, activeFreq]);

  const selectFrequency = useCallback(
    (freq: FrequencyPreset) => {
      setActiveFreq(freq);
      if (playing) {
        stop();
        setTimeout(() => {
          play(freq.hz);
        }, 100);
      }
    },
    [playing]
  );

  const handleVolume = useCallback((val: number[]) => {
    const v = val[0];
    setVolumeState(v);
    setVolume(v / 100);
  }, []);

  return (
    <ChamberLayout title="Sonic Alchemy" subtitle="Frequencies & Sacred Codes" onBack={onBack}>
      <div className="space-y-6 mt-2 max-w-lg mx-auto">
        {/* Visualizer */}
        <div className="card-cosmic rounded-2xl p-4 overflow-hidden">
          <Visualizer isPlaying={playing} activeColor={activeFreq.color} />

          {/* Now Playing */}
          <div className="text-center mt-3 space-y-1">
            <p className="font-display text-2xl font-bold text-foreground">
              {activeFreq.hz} Hz
            </p>
            <p className="text-sm text-muted-foreground">
              {activeFreq.name} · {activeFreq.chakra} Chakra
            </p>
            <p className="text-xs text-muted-foreground/70">{activeFreq.description}</p>
          </div>

          {/* Play / Volume */}
          <div className="flex items-center gap-4 mt-4">
            <button
              onClick={togglePlay}
              className="w-14 h-14 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary hover:bg-primary/30 transition-colors"
            >
              {playing ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
            </button>
            <div className="flex items-center gap-2 flex-1">
              <Volume2 className="w-4 h-4 text-muted-foreground shrink-0" />
              <Slider
                value={[volume]}
                onValueChange={handleVolume}
                max={100}
                step={1}
                className="flex-1"
              />
            </div>
          </div>
        </div>

        {/* Frequency Selector */}
        <div>
          <h3 className="font-display text-xs uppercase tracking-widest text-muted-foreground mb-3">
            Solfeggio Frequencies
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {SOLFEGGIO_FREQUENCIES.map((freq) => {
              const isActive = freq.id === activeFreq.id;
              return (
                <button
                  key={freq.id}
                  onClick={() => selectFrequency(freq)}
                  className={`rounded-xl p-3 text-left transition-all border ${
                    isActive
                      ? "bg-primary/10 border-primary/40"
                      : "bg-card/50 border-border hover:border-primary/20"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: freq.color }}
                    />
                    <span className="font-display text-sm font-bold text-foreground">
                      {freq.hz} Hz
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{freq.name}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sacred Codes (Grabovoi) */}
        <div>
          <h3 className="font-display text-xs uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Sacred Codes
          </h3>
          <div className="space-y-2">
            {SACRED_CODES.map((sc) => (
              <div
                key={sc.code}
                className="card-cosmic rounded-xl p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-display text-lg font-bold tracking-wider text-primary">
                    {sc.code}
                  </p>
                  <p className="text-xs text-muted-foreground">{sc.purpose}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ChamberLayout>
  );
}
