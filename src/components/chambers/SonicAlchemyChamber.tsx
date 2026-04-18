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

// ── useSonicAlchemy hook ───────────────────────────────────────────────────
function useSonicAlchemy(rootFrequency: number) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const activeNodesRef = useRef<{ stop: () => void }[]>([]);
  const pulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const melodyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPlayingRef = useRef(false);

  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  const ensureContext = useCallback(async () => {
    if (!ctxRef.current) {
      const AC = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
      ctxRef.current = new AC();
      const master = ctxRef.current.createGain();
      master.gain.value = 0;
      master.connect(ctxRef.current.destination);
      masterGainRef.current = master;
      const analyser = ctxRef.current.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.85;
      master.connect(analyser);
      analyserRef.current = analyser;
    }
    if (ctxRef.current.state === "suspended") await ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  const stopAllTimers = useCallback(() => {
    if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
    if (melodyTimerRef.current) clearTimeout(melodyTimerRef.current);
    pulseTimerRef.current = null;
    melodyTimerRef.current = null;
  }, []);

  const stopAllNodes = useCallback(() => {
    activeNodesRef.current.forEach(n => { try { n.stop(); } catch(e) {} });
    activeNodesRef.current = [];
  }, []);

  const schedulePulse = useCallback((root: number) => {
    const ctx = ctxRef.current;
    const master = masterGainRef.current;
    if (!ctx || !master) return;
    const fire = () => {
      if (!isPlayingRef.current) return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = root / 8;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.35, t + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
      osc.connect(g).connect(master);
      osc.start(t);
      osc.stop(t + 1.3);
      pulseTimerRef.current = setTimeout(fire, 2000 + Math.random() * 2000);
    };
    pulseTimerRef.current = setTimeout(fire, 1500);
  }, []);

  const scheduleMelody = useCallback((root: number) => {
    const ctx = ctxRef.current;
    const master = masterGainRef.current;
    if (!ctx || !master) return;
    const intervals = [1.5, 2, 2.5, 3, 4];
    const fire = () => {
      if (!isPlayingRef.current) return;
      const t = ctx.currentTime;
      const ratio = intervals[Math.floor(Math.random() * intervals.length)];
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = root * ratio;
      const dur = 2.5 + Math.random() * 2;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.07, t + 0.8);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 300;
      osc.connect(hp).connect(g).connect(master);
      osc.start(t);
      osc.stop(t + dur + 0.2);
      melodyTimerRef.current = setTimeout(fire, 5000 + Math.random() * 10000);
    };
    melodyTimerRef.current = setTimeout(fire, 4000);
  }, []);

  const buildLayers = useCallback((root: number, ctx: AudioContext, master: GainNode) => {
    const t = ctx.currentTime;
    const nodes: { stop: () => void }[] = [];
    [1, 1.5, 2].forEach((ratio, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = (root / 2) * ratio;
      osc.detune.value = (i - 1) * 6;
      const lfo = ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = 0.03 + i * 0.017;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 8 + i * 3;
      lfo.connect(lfoGain).connect(osc.detune);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.08, t + 3);
      osc.connect(gain).connect(master);
      osc.start(); lfo.start();
      nodes.push({ stop: () => { try { osc.stop(); } catch(e){} try { lfo.stop(); } catch(e){} } });
    });
    const bassFilter = ctx.createBiquadFilter();
    bassFilter.type = "lowpass";
    bassFilter.frequency.value = 220;
    const bassOsc = ctx.createOscillator();
    bassOsc.type = "sawtooth";
    bassOsc
