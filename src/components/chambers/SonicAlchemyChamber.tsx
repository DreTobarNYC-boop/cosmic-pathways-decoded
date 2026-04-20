import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Square, Loader2, Headphones } from "lucide-react";

const SOLFEGGIO = [
  { freq: 396, label: "Liberation" },
  { freq: 417, label: "Change" },
  { freq: 528, label: "Miracle" },
  { freq: 639, label: "Connection" },
  { freq: 741, label: "Awakening" },
  { freq: 852, label: "Intuition" },
  { freq: 963, label: "Divine" },
];

// ── useSonicAlchemy ────────────────────────────────────────────────────────
function useSonicAlchemy() {
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const oscsRef = useRef<OscillatorNode[]>([]);

  const ensureContext = useCallback(() => {
    if (!ctxRef.current) {
      const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
      ctxRef.current = new AC();
    }
    if (ctxRef.current.state === "suspended") {
      ctxRef.current.resume();
    }
  }, []);

  const startAudio = useCallback(async () => {
    ensureContext();
    const ctx = ctxRef.current!;
    if (ctx.state === "suspended") await ctx.resume();

    if (!analyserRef.current) {
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.connect(ctx.destination);
      analyserRef.current = analyser;
    }
  }, [ensureContext]);

  const stopOscillators = useCallback(() => {
    const ctx = ctxRef.current;
    if (gainRef.current && ctx) {
      const gain = gainRef.current;
      gain.gain.cancelScheduledValues(ctx.currentTime);
      gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
    }
    const oscs = oscsRef.current;
    const stopAt = ctxRef.current ? ctxRef.current.currentTime + 0.35 : 0;
    oscs.forEach(o => { try { o.stop(stopAt); } catch (_) { /* already stopped */ } });
    oscsRef.current = [];
    gainRef.current = null;
  }, []);

  const play = useCallback((freq: number) => {
    const ctx = ctxRef.current;
    const analyser = analyserRef.current;
    if (!ctx || !analyser) return;

    stopOscillators();

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.28, ctx.currentTime + 0.5);
    gain.connect(analyser);
    gainRef.current = gain;

    // Main carrier tone
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    osc.connect(gain);
    osc.start();

    // Binaural beat: 7 Hz theta offset for the right channel
    const merger = ctx.createChannelMerger(2);
    merger.connect(analyser);

    const gainL = ctx.createGain();
    gainL.gain.setValueAtTime(0, ctx.currentTime);
    gainL.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.5);
    const gainR = ctx.createGain();
    gainR.gain.setValueAtTime(0, ctx.currentTime);
    gainR.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.5);

    const oscL = ctx.createOscillator();
    oscL.type = "sine";
    oscL.frequency.value = freq;
    oscL.connect(gainL);
    gainL.connect(merger, 0, 0);
    oscL.start();

    const oscR = ctx.createOscillator();
    oscR.type = "sine";
    oscR.frequency.value = freq + 7;
    oscR.connect(gainR);
    gainR.connect(merger, 0, 1);
    oscR.start();

    oscsRef.current = [osc, oscL, oscR];
  }, [stopOscillators]);

  const stop = useCallback(() => {
    stopOscillators();
  }, [stopOscillators]);

  const dispose = useCallback(() => {
    stopOscillators();
    if (ctxRef.current) {
      ctxRef.current.close();
      ctxRef.current = null;
    }
    analyserRef.current = null;
  }, [stopOscillators]);

  return { analyserRef, startAudio, play, stop, dispose };
}

// ── FrequencyTile ──────────────────────────────────────────────────────────
function FrequencyTile({ freq, label, isActive, onClick }: { freq: number; label: string; isActive: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col items-center justify-center rounded-xl px-3 py-4 transition-all duration-500 overflow-hidden"
      style={{
        background: isActive ? "linear-gradient(135deg, rgba(197,160,89,0.18), rgba(197,160,89,0.06))" : "rgba(255,253,208,0.025)",
        border: isActive ? "1px solid rgba(197,160,89,0.7)" : "1px solid rgba(197,160,89,0.15)",
        boxShadow: isActive ? "0 0 30px rgba(197,160,89,0.25), inset 0 0 20px rgba(197,160,89,0.08)" : "none",
      }}
    >
      <span className="text-xl font-light tracking-wider" style={{ color: isActive ? "#C5A059" : "#FFFDD0", fontFamily: "serif" }}>{freq}</span>
      <span className="text-[10px] mt-1 uppercase tracking-[0.2em]" style={{ color: isActive ? "#C5A059" : "rgba(255,253,208,0.55)" }}>{label}</span>
      <span className="absolute inset-x-0 bottom-0 h-px" style={{ background: isActive ? "linear-gradient(to right, transparent, #C5A059, transparent)" : "transparent" }} />
    </button>
  );
}

// ── PulsingOrb ─────────────────────────────────────────────────────────────
function PulsingOrb({ analyserRef, isPlaying }: { analyserRef: React.MutableRefObject<AnalyserNode | null>; isPlaying: boolean }) {
  const orbRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const dataArray = new Uint8Array(1024);
    const tick = () => {
      const analyser = analyserRef?.current;
      let amplitude = 0;
      if (analyser && isPlaying) {
        analyser.getByteTimeDomainData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const v = (dataArray[i] - 128) / 128;
          sum += v * v;
        }
        amplitude = Math.sqrt(sum / dataArray.length);
      } else {
        amplitude = 0.15 + Math.sin(Date.now() / 1400) * 0.05;
      }
      const scale = 1 + amplitude * 0.6;
      const glow = 40 + amplitude * 120;
      if (orbRef.current) {
        orbRef.current.style.transform = `translate(-50%, -50%) scale(${scale})`;
        orbRef.current.style.boxShadow = `0 0 ${glow}px ${glow / 3}px rgba(197,160,89,${0.35 + amplitude * 0.5})`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(-50%, -50%) scale(${1 + amplitude * 0.9})`;
        ringRef.current.style.opacity = `${Math.max(0, 0.5 - amplitude)}`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [analyserRef, isPlaying]);

  return (
    <div className="relative w-64 h-64 mx-auto select-none">
      <div ref={ringRef} className="absolute top-1/2 left-1/2 w-48 h-48 rounded-full border pointer-events-none" style={{ borderColor: "rgba(197,160,89,0.4)", transition: "opacity 0.2s linear" }} />
      <div className="absolute top-1/2 left-1/2 w-full h-full rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ border: "1px solid rgba(197,160,89,0.15)" }} />
      <div className="absolute top-1/2 left-1/2 w-[85%] h-[85%] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ border: "1px solid rgba(197,160,89,0.1)" }} />
      <div ref={orbRef} className="absolute top-1/2 left-1/2 w-40 h-40 rounded-full" style={{ background: "radial-gradient(circle at 35% 30%, #F5E6B8 0%, #C5A059 35%, #8A6B30 70%, #3A2A10 100%)", willChange: "transform, box-shadow" }} />
    </div>
  );
}

// ── WaveformVisualizer ─────────────────────────────────────────────────────
function WaveformVisualizer({ analyserRef, isPlaying }: { analyserRef: React.MutableRefObject<AnalyserNode | null>; isPlaying: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);
    const dataArray = new Uint8Array(1024);
    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);
      const analyser = analyserRef?.current;
      if (analyser && isPlaying) {
        analyser.getByteTimeDomainData(dataArray);
      } else {
        const t = Date.now() / 600;
        for (let i = 0; i < dataArray.length; i++) dataArray[i] = 128 + Math.sin(i / 20 + t) * 10;
      }
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, "rgba(197,160,89,0)");
      grad.addColorStop(0.5, "rgba(197,160,89,0.9)");
      grad.addColorStop(1, "rgba(197,160,89,0)");
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = grad;
      ctx.beginPath();
      const slice = w / dataArray.length;
      for (let i = 0; i < dataArray.length; i++) {
        const v = dataArray[i] / 128 - 1;
        const y = h / 2 + v * (h / 2) * 0.85;
        const x = i * slice;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener("resize", resize); };
  }, [analyserRef, isPlaying]);

  return <canvas ref={canvasRef} className="w-full h-20" style={{ display: "block" }} />;
}

// ── Main Component ─────────────────────────────────────────────────────────
export function SonicAlchemyChamber({ onBack }: { onBack: () => void }) {
  const [selected, setSelected] = useState(SOLFEGGIO[2]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { analyserRef, startAudio, play, stop, dispose } = useSonicAlchemy();

  useEffect(() => {
    return () => { dispose(); };
  }, [dispose]);

  const handleToggle = async () => {
    if (isPlaying) {
      stop();
      setIsPlaying(false);
    } else {
      setIsLoading(true);
      try {
        await startAudio();
        play(selected.freq);
        setIsPlaying(true);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSelect = (s: typeof SOLFEGGIO[0]) => {
    setSelected(s);
    if (isPlaying) {
      // Brief delay lets the engine fade out before starting the new frequency
      stop();
      setTimeout(() => play(s.freq), 150);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start px-4 py-8 relative overflow-hidden" style={{ background: "#0B1A1A", color: "#FFFDD0" }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(197,160,89,0.08) 0%, transparent 60%)" }} />
      <div className="relative z-10 w-full max-w-lg flex flex-col items-center">
        <div className="text-center mb-6">
          <div className="text-[10px] uppercase tracking-[0.4em] mb-3" style={{ color: "#C5A059" }}>◦ Sonic Alchemy ◦</div>
          <h1 className="text-3xl font-extralight tracking-wide" style={{ fontFamily: "serif", color: "#FFFDD0" }}>Tune the Resonance</h1>
        </div>

        <PulsingOrb analyserRef={analyserRef} isPlaying={isPlaying} />

        <div className="text-center mt-4 mb-6">
          <div className="text-5xl font-extralight tracking-tight transition-colors duration-500" style={{ color: isPlaying ? "#C5A059" : "#FFFDD0", fontFamily: "serif" }}>
            {selected.freq}<span className="text-2xl ml-2 opacity-60">Hz</span>
          </div>
          <div className="text-xs uppercase tracking-[0.35em] mt-2" style={{ color: "#C5A059" }}>{selected.label}</div>
        </div>

        <div className="w-full mb-6 rounded-lg px-4 py-2" style={{ background: "rgba(255,253,208,0.02)", border: "1px solid rgba(197,160,89,0.1)" }}>
          <WaveformVisualizer analyserRef={analyserRef} isPlaying={isPlaying} />
        </div>

        <button
          onClick={handleToggle}
          disabled={isLoading}
          className="flex items-center justify-center gap-3 px-8 py-3 rounded-full transition-all duration-500 mb-8 disabled:opacity-60"
          style={{
            background: isPlaying ? "rgba(197,160,89,0.15)" : "linear-gradient(135deg, rgba(197,160,89,0.25), rgba(197,160,89,0.1))",
            border: "1px solid #C5A059",
            color: "#FFFDD0",
            boxShadow: isPlaying ? "0 0 40px rgba(197,160,89,0.35)" : "0 0 20px rgba(197,160,89,0.15)",
          }}
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#C5A059" }} /> : isPlaying ? <Square className="w-5 h-5" style={{ color: "#C5A059" }} fill="#C5A059" /> : <Play className="w-5 h-5" style={{ color: "#C5A059" }} fill="#C5A059" />}
          <span className="uppercase tracking-[0.3em] text-xs" style={{ color: "#FFFDD0" }}>{isLoading ? "Tuning" : isPlaying ? "Silence" : "Begin"}</span>
        </button>

        <div className="w-full">
          <div className="text-[10px] uppercase tracking-[0.35em] text-center mb-4" style={{ color: "#C5A059", opacity: 0.7 }}>Solfeggio Frequencies</div>
          <div className="grid grid-cols-4 gap-2">
            {SOLFEGGIO.map(s => (
              <FrequencyTile key={s.freq} freq={s.freq} label={s.label} isActive={selected.freq === s.freq} onClick={() => handleSelect(s)} />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-8 text-[11px] uppercase tracking-[0.25em]" style={{ color: "rgba(255,253,208,0.5)" }}>
          <Headphones className="w-3.5 h-3.5" />
          <span>Headphones recommended · Binaural 7Hz Theta</span>
        </div>
      </div>
    </div>
  );
}
