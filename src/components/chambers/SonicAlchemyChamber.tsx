import { useState, useEffect, useRef, useCallback } from "react";
import { ChamberLayout } from "@/components/ChamberLayout";
import { Play, Square } from "lucide-react";

/* ─── Types ─────────────────────────────────────────────── */

type PlayState = "idle" | "loading" | "playing";

interface SolfeggioFreq {
  id: string;
  hz: number;
  name: string;
  subtitle: string;
  color: string;
}

/* ─── Constants ─────────────────────────────────────────── */

const SOLFEGGIO: SolfeggioFreq[] = [
  { id: "396", hz: 396, name: "Liberation",  subtitle: "Release fear & guilt",       color: "#e05252" },
  { id: "417", hz: 417, name: "Change",       subtitle: "Facilitate transformation",  color: "#e08c52" },
  { id: "528", hz: 528, name: "Miracle",      subtitle: "DNA repair & renewal",       color: "#d4c44a" },
  { id: "639", hz: 639, name: "Connection",   subtitle: "Harmonize relationships",    color: "#52c98c" },
  { id: "741", hz: 741, name: "Awakening",    subtitle: "Expand consciousness",       color: "#5299e0" },
  { id: "852", hz: 852, name: "Intuition",    subtitle: "Return to spiritual order",  color: "#8c52e0" },
  { id: "963", hz: 963, name: "Divine",       subtitle: "Connect to higher self",     color: "#d452c9" },
];

const BINAURAL_OFFSET = 7; // Hz — Theta wave for meditation

/* ─── Audio Engine ──────────────────────────────────────── */

interface EngineNodes {
  ctx: AudioContext;
  master: GainNode;
  analyser: AnalyserNode;
  padOscs: OscillatorNode[];
  padGains: GainNode[];
  bassOsc: OscillatorNode;
  bassGain: GainNode;
  binauralLeft: OscillatorNode;
  binauralRight: OscillatorNode;
  binauralGainL: GainNode;
  binauralGainR: GainNode;
  merger: ChannelMergerNode;
  binauralGain: GainNode;
  pulseCancel: { cancelled: boolean };
  melodyCancel: { cancelled: boolean };
  pulseIntervalId: ReturnType<typeof setInterval> | null;
  melodyTimeoutId: ReturnType<typeof setTimeout> | null;
  padLfoId: ReturnType<typeof setInterval> | null;
}

function buildEngine(ctx: AudioContext, rootHz: number): EngineNodes {
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.72, ctx.currentTime);
  master.connect(ctx.destination);

  const analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;
  analyser.smoothingTimeConstant = 0.85;
  analyser.connect(master);

  // ── Bass drone ──────────────────────────────────────────
  const bassOsc = ctx.createOscillator();
  bassOsc.type = "sine";
  bassOsc.frequency.setValueAtTime(rootHz / 4, ctx.currentTime);
  const bassGain = ctx.createGain();
  bassGain.gain.setValueAtTime(0.28, ctx.currentTime);
  bassOsc.connect(bassGain);
  bassGain.connect(analyser);
  bassOsc.start();

  // ── Evolving pad (3 sine oscillators, slightly detuned) ─
  const padFreqs = [rootHz * 1.0, rootHz * 1.003, rootHz * 0.997];
  const padOscs: OscillatorNode[] = [];
  const padGains: GainNode[] = [];

  padFreqs.forEach((f) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(f, ctx.currentTime);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.15, ctx.currentTime);
    osc.connect(g);
    g.connect(analyser);
    osc.start();
    padOscs.push(osc);
    padGains.push(g);
  });

  // ── Binaural beats (stereo channel split/merge) ──────────
  // Left ear: rootHz, Right ear: rootHz + 7 Hz
  const splitter = ctx.createChannelSplitter(2);
  const merger = ctx.createChannelMerger(2);

  const binauralLeft = ctx.createOscillator();
  binauralLeft.type = "sine";
  binauralLeft.frequency.setValueAtTime(rootHz, ctx.currentTime);

  const binauralRight = ctx.createOscillator();
  binauralRight.type = "sine";
  binauralRight.frequency.setValueAtTime(rootHz + BINAURAL_OFFSET, ctx.currentTime);

  const binauralGainL = ctx.createGain();
  binauralGainL.gain.setValueAtTime(0.07, ctx.currentTime);
  const binauralGainR = ctx.createGain();
  binauralGainR.gain.setValueAtTime(0.07, ctx.currentTime);

  // Route left-only and right-only signals into the merger
  binauralLeft.connect(binauralGainL);
  binauralRight.connect(binauralGainR);

  // Use a stereo panner to isolate each to its channel
  const panLeft = ctx.createStereoPanner();
  panLeft.pan.setValueAtTime(-1, ctx.currentTime);
  const panRight = ctx.createStereoPanner();
  panRight.pan.setValueAtTime(1, ctx.currentTime);

  binauralGainL.connect(panLeft);
  binauralGainR.connect(panRight);

  const binauralGain = ctx.createGain();
  binauralGain.gain.setValueAtTime(1, ctx.currentTime);
  panLeft.connect(binauralGain);
  panRight.connect(binauralGain);
  binauralGain.connect(analyser);

  binauralLeft.start();
  binauralRight.start();

  // ── Slow pad frequency drift (LFO-like polling) ─────────
  let driftT = 0;
  const padLfoId = setInterval(() => {
    driftT += 0.05;
    padOscs.forEach((osc, i) => {
      const base = padFreqs[i];
      const drift = Math.sin(driftT + i * 1.1) * (base * 0.004);
      osc.frequency.setTargetAtTime(base + drift, ctx.currentTime, 2.0);
    });
  }, 200);

  // ── Rhythmic pulse (soft thump every 2-4 s via recursive setTimeout) ──
  // Use a cancellation flag so teardown can stop future reschedules.
  const pulseCancel = { cancelled: false };

  function schedulePulse() {
    if (pulseCancel.cancelled) return;
    if (ctx.state === "running") {
      const kickOsc = ctx.createOscillator();
      kickOsc.type = "sine";
      kickOsc.frequency.setValueAtTime(rootHz / 8, ctx.currentTime);
      kickOsc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.3);

      const kickGain = ctx.createGain();
      kickGain.gain.setValueAtTime(0.55, ctx.currentTime);
      kickGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

      kickOsc.connect(kickGain);
      kickGain.connect(analyser);
      kickOsc.start(ctx.currentTime);
      kickOsc.stop(ctx.currentTime + 0.5);
    }
    // Reschedule with a new random delay each time (2-4 s)
    setTimeout(schedulePulse, 2000 + Math.random() * 2000);
  }
  setTimeout(schedulePulse, 2000 + Math.random() * 2000);
  // pulseIntervalId kept as null — cancellation via pulseCancel flag
  const pulseIntervalId: ReturnType<typeof setInterval> | null = null;

  // ── Random melodic notes (every 5-15 s) ─────────────────
  const harmonicRatios = [2, 3, 4, 5, 6, 8];
  const melodyCancel = { cancelled: false };

  function scheduleMelody() {
    if (melodyCancel.cancelled) return;
    if (ctx.state === "running") {
      const ratio = harmonicRatios[Math.floor(Math.random() * harmonicRatios.length)];
      const noteHz = rootHz * ratio;
      const noteOsc = ctx.createOscillator();
      noteOsc.type = "sine";
      noteOsc.frequency.setValueAtTime(noteHz, ctx.currentTime);

      const noteGain = ctx.createGain();
      noteGain.gain.setValueAtTime(0, ctx.currentTime);
      noteGain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.8);
      noteGain.gain.setTargetAtTime(0, ctx.currentTime + 1.5, 1.2);

      noteOsc.connect(noteGain);
      noteGain.connect(analyser);
      noteOsc.start(ctx.currentTime);
      noteOsc.stop(ctx.currentTime + 5);
    }
    setTimeout(scheduleMelody, 5000 + Math.random() * 10000);
  }
  setTimeout(scheduleMelody, 5000 + Math.random() * 10000);
  // melodyTimeoutId kept null — cancellation via melodyCancel flag
  const melodyTimeoutId: ReturnType<typeof setTimeout> | null = null;

  return {
    ctx,
    master,
    analyser,
    padOscs,
    padGains,
    bassOsc,
    bassGain,
    binauralLeft,
    binauralRight,
    binauralGainL,
    binauralGainR,
    merger,
    binauralGain,
    pulseCancel,
    melodyCancel,
    pulseIntervalId,
    melodyTimeoutId,
    padLfoId,
  };
}

function retune(engine: EngineNodes, rootHz: number) {
  const { ctx, bassOsc, padOscs, binauralLeft, binauralRight } = engine;
  const t = ctx.currentTime;
  bassOsc.frequency.setTargetAtTime(rootHz / 4, t, 1.5);
  const padFreqs = [rootHz * 1.0, rootHz * 1.003, rootHz * 0.997];
  padOscs.forEach((osc, i) => {
    osc.frequency.setTargetAtTime(padFreqs[i], t, 1.5);
  });
  binauralLeft.frequency.setTargetAtTime(rootHz, t, 1.5);
  binauralRight.frequency.setTargetAtTime(rootHz + BINAURAL_OFFSET, t, 1.5);
}

function teardown(engine: EngineNodes) {
  engine.pulseCancel.cancelled = true;
  engine.melodyCancel.cancelled = true;
  if (engine.pulseIntervalId !== null) clearInterval(engine.pulseIntervalId);
  if (engine.melodyTimeoutId !== null) clearTimeout(engine.melodyTimeoutId);
  if (engine.padLfoId !== null) clearInterval(engine.padLfoId);
  try {
    engine.bassOsc.stop();
    engine.padOscs.forEach((o) => o.stop());
    engine.binauralLeft.stop();
    engine.binauralRight.stop();
    engine.ctx.close();
  } catch (err) {
    console.warn("SonicAlchemy teardown:", err);
  }
}

/* ─── Waveform Visualizer ───────────────────────────────── */

function WaveformVisualizer({
  analyser,
  color,
  isPlaying,
}: {
  analyser: AnalyserNode | null;
  color: string;
  isPlaying: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return;

    function resize() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    }
    resize();

    function draw() {
      if (!canvas) return;
      const w = canvas.width;
      const h = canvas.height;
      ctx2d.clearRect(0, 0, w, h);

      if (!isPlaying || !analyser) {
        // Draw a flat resting line
        ctx2d.beginPath();
        ctx2d.moveTo(0, h / 2);
        ctx2d.lineTo(w, h / 2);
        ctx2d.strokeStyle = "rgba(197,160,89,0.2)";
        ctx2d.lineWidth = 1.5;
        ctx2d.stroke();
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      const bufferLength = analyser.fftSize;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteTimeDomainData(dataArray);

      ctx2d.beginPath();
      const sliceWidth = w / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * h) / 2;
        if (i === 0) ctx2d.moveTo(x, y);
        else ctx2d.lineTo(x, y);
        x += sliceWidth;
      }
      ctx2d.lineTo(w, h / 2);
      ctx2d.strokeStyle = color;
      ctx2d.lineWidth = 1.5;
      ctx2d.shadowColor = color;
      ctx2d.shadowBlur = 6;
      ctx2d.stroke();
      ctx2d.shadowBlur = 0;

      rafRef.current = requestAnimationFrame(draw);
    }
    draw();

    return () => cancelAnimationFrame(rafRef.current);
  }, [analyser, color, isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: 64, display: "block" }}
    />
  );
}

/* ─── Pulsing Orb ───────────────────────────────────────── */

function PulsingOrb({
  color,
  isPlaying,
  analyser,
  name,
  hz,
}: {
  color: string;
  isPlaying: boolean;
  analyser: AnalyserNode | null;
  name: string;
  hz: number;
}) {
  const orbRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!isPlaying || !analyser) {
      if (orbRef.current) {
        orbRef.current.style.transform = "scale(1)";
      }
      cancelAnimationFrame(rafRef.current);
      return;
    }

    const dataArray = new Uint8Array(analyser.fftSize);

    function tick() {
      if (!orbRef.current || !analyser) return;
      analyser.getByteTimeDomainData(dataArray);
      // Compute RMS amplitude
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const v = (dataArray[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / dataArray.length);
      const scale = 1 + rms * 2.5;
      orbRef.current.style.transform = `scale(${scale})`;
      rafRef.current = requestAnimationFrame(tick);
    }
    tick();
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, analyser]);

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <div
        style={{
          position: "relative",
          width: 140,
          height: 140,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Outer glow rings */}
        {isPlaying && (
          <>
            <div
              style={{
                position: "absolute",
                inset: -18,
                borderRadius: "50%",
                border: `1px solid ${color}`,
                opacity: 0.18,
                animation: "ping 2.5s cubic-bezier(0,0,0.2,1) infinite",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: -8,
                borderRadius: "50%",
                border: `1px solid ${color}`,
                opacity: 0.28,
                animation: "ping 2s cubic-bezier(0,0,0.2,1) infinite 0.4s",
              }}
            />
          </>
        )}
        {/* Core orb */}
        <div
          ref={orbRef}
          style={{
            width: 140,
            height: 140,
            borderRadius: "50%",
            background: `radial-gradient(circle at 38% 38%, ${color}55 0%, ${color}22 60%, transparent 100%)`,
            border: `2px solid ${color}66`,
            boxShadow: isPlaying
              ? `0 0 32px ${color}55, 0 0 60px ${color}22, inset 0 0 20px ${color}11`
              : `0 0 16px ${color}22`,
            transition: "box-shadow 0.5s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            willChange: "transform",
          }}
        >
          <span
            style={{
              fontFamily: "'Libre Baskerville', serif",
              fontSize: 13,
              color: "#FFFDD0",
              opacity: 0.85,
              letterSpacing: "0.08em",
              textAlign: "center",
              userSelect: "none",
            }}
          >
            {hz} Hz
          </span>
        </div>
      </div>

      {/* Frequency name */}
      <div className="text-center">
        <p
          style={{
            fontFamily: "'Libre Baskerville', serif",
            fontSize: 28,
            fontWeight: 700,
            color: "#FFFDD0",
            lineHeight: 1.1,
          }}
        >
          {name}
        </p>
        <p style={{ fontSize: 12, color: "#C5A059", marginTop: 4, letterSpacing: "0.12em" }}>
          THETA · 7 Hz BINAURAL
        </p>
      </div>
    </div>
  );
}

/* ─── Main Component ────────────────────────────────────── */

export function SonicAlchemyChamber({ onBack }: { onBack: () => void }) {
  const [playState, setPlayState] = useState<PlayState>("idle");
  const [activeFreq, setActiveFreq] = useState<SolfeggioFreq>(SOLFEGGIO[2]); // 528 default
  const engineRef = useRef<EngineNodes | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (engineRef.current) teardown(engineRef.current);
      engineRef.current = null;
      ctxRef.current = null;
    };
  }, []);

  const getOrCreateContext = useCallback(async (): Promise<AudioContext> => {
    if (ctxRef.current && ctxRef.current.state !== "closed") {
      // iOS: resume if suspended
      if (ctxRef.current.state === "suspended") {
        await ctxRef.current.resume();
      }
      return ctxRef.current;
    }
    // Support webkit prefix for older iOS Safari
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    ctxRef.current = ctx;
    // iOS may start in suspended state — resume immediately (requires user gesture)
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
    return ctx;
  }, []);

  const handlePlay = useCallback(async () => {
    if (playState === "playing") {
      // Stop
      if (engineRef.current) teardown(engineRef.current);
      engineRef.current = null;
      if (ctxRef.current) {
        try { await ctxRef.current.close(); } catch { /* ignore */ }
        ctxRef.current = null;
      }
      setPlayState("idle");
      return;
    }

    setPlayState("loading");
    try {
      const ctx = await getOrCreateContext();
      const engine = buildEngine(ctx, activeFreq.hz);
      engineRef.current = engine;
      setPlayState("playing");
    } catch (err) {
      console.error("AudioContext error:", err);
      setPlayState("idle");
    }
  }, [playState, activeFreq, getOrCreateContext]);

  const handleSelectFreq = useCallback(
    async (freq: SolfeggioFreq) => {
      setActiveFreq(freq);
      if (playState === "playing" && engineRef.current) {
        setPlayState("loading");
        retune(engineRef.current, freq.hz);
        // Brief loading state so UI feels responsive
        setTimeout(() => setPlayState("playing"), 500);
      }
    },
    [playState]
  );

  const analyser = engineRef.current?.analyser ?? null;

  return (
    <ChamberLayout
      title="Sonic Alchemy"
      subtitle="Solfeggio Frequencies & Binaural Beats"
      onBack={onBack}
    >
      <div
        style={{
          background: "#0B1A1A",
          borderRadius: 20,
          padding: "0 0 24px",
          marginTop: 8,
          overflow: "hidden",
        }}
      >
        {/* ── Orb ── */}
        <PulsingOrb
          color={activeFreq.color}
          isPlaying={playState === "playing"}
          analyser={analyser}
          name={activeFreq.name}
          hz={activeFreq.hz}
        />

        {/* ── Waveform ── */}
        <div
          style={{
            marginLeft: 20,
            marginRight: 20,
            marginBottom: 20,
            background: "rgba(255,255,255,0.03)",
            borderRadius: 12,
            padding: "10px 12px",
            border: "1px solid rgba(197,160,89,0.12)",
          }}
        >
          <WaveformVisualizer
            analyser={analyser}
            color={activeFreq.color}
            isPlaying={playState === "playing"}
          />
        </div>

        {/* ── Play / Stop ── */}
        <div className="flex justify-center mb-6 px-5">
          <button
            onClick={handlePlay}
            disabled={playState === "loading"}
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background:
                playState === "playing"
                  ? `${activeFreq.color}22`
                  : "rgba(197,160,89,0.15)",
              border: `2px solid ${playState === "playing" ? activeFreq.color : "#C5A059"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: playState === "playing" ? activeFreq.color : "#C5A059",
              cursor: playState === "loading" ? "wait" : "pointer",
              transition: "all 0.3s ease",
              boxShadow:
                playState === "playing"
                  ? `0 0 20px ${activeFreq.color}44`
                  : "none",
            }}
          >
            {playState === "loading" ? (
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  border: "2px solid transparent",
                  borderTopColor: "#C5A059",
                  animation: "spin 0.7s linear infinite",
                }}
              />
            ) : playState === "playing" ? (
              <Square style={{ width: 22, height: 22, fill: "currentColor" }} />
            ) : (
              <Play
                style={{ width: 22, height: 22, marginLeft: 3 }}
              />
            )}
          </button>
        </div>

        {/* ── State label ── */}
        <p
          style={{
            textAlign: "center",
            fontSize: 11,
            color: "rgba(197,160,89,0.6)",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            marginBottom: 20,
          }}
        >
          {playState === "idle"
            ? "Select a frequency & press play"
            : playState === "loading"
            ? "Tuning the alchemy…"
            : "Playing — use headphones for binaural beats"}
        </p>

        {/* ── Frequency tiles ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 10,
            padding: "0 20px",
          }}
        >
          {SOLFEGGIO.map((freq) => {
            const isActive = freq.id === activeFreq.id;
            return (
              <button
                key={freq.id}
                onClick={() => handleSelectFreq(freq)}
                style={{
                  background: isActive
                    ? `${freq.color}18`
                    : "rgba(255,255,255,0.03)",
                  border: `1px solid ${isActive ? freq.color + "66" : "rgba(197,160,89,0.15)"}`,
                  borderRadius: 14,
                  padding: "12px 14px",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                  boxShadow: isActive ? `0 0 10px ${freq.color}22` : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: freq.color,
                      boxShadow: isActive ? `0 0 6px ${freq.color}` : "none",
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "'Libre Baskerville', serif",
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#FFFDD0",
                    }}
                  >
                    {freq.hz} Hz
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 11,
                    color: isActive ? freq.color : "rgba(255,253,208,0.5)",
                    margin: 0,
                    lineHeight: 1.3,
                  }}
                >
                  {freq.name}
                </p>
              </button>
            );
          })}
        </div>

        {/* ── Info footer ── */}
        <p
          style={{
            margin: "24px 20px 0",
            fontSize: 10,
            color: "rgba(197,160,89,0.4)",
            textAlign: "center",
            letterSpacing: "0.08em",
            lineHeight: 1.6,
          }}
        >
          All sound generated in-browser via Web Audio API · No external files
        </p>
      </div>

      {/* Keyframe styles injected once */}
      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </ChamberLayout>
  );
}
