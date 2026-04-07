// @ts-nocheck
import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const FALLBACK_READING = {
  handType: "Cosmic Hand",
  element: "Aether",
  archetype: {
    name: "THE SOVEREIGN",
    traits: ["visionary", "resilient", "strategic"],
    summary: "You are built for the long game. You see the architecture of the world while others just see the walls. Your path is defined by a refusal to settle for common outcomes.",
    shadow: "Precision is your strength, but do not let the search for perfection stall your momentum. Move when the instinct hits.",
  },
  reading: {
    overview: "Your palm reflects a high-frequency signature. You are currently in a phase of rapid expansion. Trust the technical and spiritual alignment you have built; the results are trailing your effort, but they are guaranteed.",
  },
  lines: {
    heart: { strength: "strong", description: "Deep loyalty to the mission and those within the inner circle. High emotional intelligence disguised as stoicism." },
    head: { strength: "elite", description: "Sharp, analytical, and capable of processing complex systems at high speed. You solve problems while others are still defining them." },
    life: { strength: "strong", description: "Immense physical and mental stamina. You have the 'Marine-grade' engine required to outlast any obstacle." },
    fate: { strength: "self-made", description: "You have moved past 'luck.' You are now actively coding your own destiny through sheer force of will." },
    sun: { strength: "rising", description: "Recognition is inevitable. Keep the frequency high and the output consistent." },
  },
  mounts: {
    jupiter: { prominence: "high", meaning: "Natural leadership and the drive to build something that lasts beyond your lifetime." },
    saturn: { prominence: "moderate", meaning: "A respect for discipline and the hard truths of the universe." },
    apollo: { prominence: "high", meaning: "A refined eye for aesthetic and the 'vibe' of the creation." },
    mercury: { prominence: "high", meaning: "The ability to bridge the gap between technical logic and spiritual truth." },
    venus: { prominence: "high", meaning: "A core of vitality and passion that fuels the entire build." },
    moon: { prominence: "moderate", meaning: "Strategic intuition that functions like a private radar." },
  },
  markings: [],
};

function normalizePalmReading(raw: any) {
  if (!raw) return null;
  return {
    handType: raw.handType || "Cosmic Reading",
    archetype: typeof raw.archetype === "string" ? raw.archetype : raw.archetype?.name || "DECODED IDENTITY",
    overview: raw.overview || raw.reading?.overview || raw.archetype?.summary || "",
    lines: {
      lifeLine: raw.lines?.lifeLine || raw.lines?.life?.description || "",
      heartLine: raw.lines?.heartLine || raw.lines?.heart?.description || "",
      headLine: raw.lines?.headLine || raw.lines?.head?.description || "",
      fateLine: raw.lines?.fateLine || raw.lines?.fate?.description || "",
      sunLine: raw.lines?.sunLine || raw.lines?.sun?.description || "",
    },
    mounts: {
      venus: typeof raw.mounts?.venus === "string" ? raw.mounts.venus : raw.mounts?.venus?.meaning || "",
      jupiter: typeof raw.mounts?.jupiter === "string" ? raw.mounts.jupiter : raw.mounts?.jupiter?.meaning || "",
      saturn: typeof raw.mounts?.saturn === "string" ? raw.mounts.saturn : raw.mounts?.saturn?.meaning || "",
      apollo: typeof raw.mounts?.apollo === "string" ? raw.mounts.apollo : raw.mounts?.apollo?.meaning || "",
      mercury: typeof raw.mounts?.mercury === "string" ? raw.mounts.mercury : raw.mounts?.mercury?.meaning || "",
      moon: typeof raw.mounts?.moon === "string" ? raw.mounts.moon : raw.mounts?.moon?.meaning || "",
    },
    markings: Array.isArray(raw.markings)
      ? raw.markings.map((item: any) => `${item.type}${item.location ? ` (${item.location})` : ""}: ${item.meaning}`).join(" ")
      : raw.markings || "",
    destiny: raw.destiny || raw.archetype?.shadow || raw.reading?.overview || "",
    gifts: raw.gifts || raw.archetype?.traits || [],
    challenges: raw.challenges || [],
  };
}

export default function PalmScanner() {
  const fileInputRef = useRef(null);
  const capturedFileRef = useRef(null);
  const [phase, setPhase] = useState("intro");
  const [capturedImage, setCapturedImage] = useState(null);
  const [reading, setReading] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [scanProgress, setScanProgress] = useState(0);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    capturedFileRef.current = file;
    setCapturedImage(URL.createObjectURL(file));
    setPhase("preview");
  }, []);

  const openCamera = () => fileInputRef.current?.click();

  const analyzePalm = useCallback(async () => {
    if (!capturedFileRef.current) return;
    setPhase("scanning");
    setScanProgress(0);

    const interval = setInterval(() => {
      setScanProgress((p) => (p >= 95 ? 95 : p + Math.random() * 10));
    }, 200);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",")[1]);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(capturedFileRef.current);
      });

      const { data, error } = await supabase.functions.invoke("palm-reading", {
        body: { image_base64: base64, language: "en" },
      });

      clearInterval(interval);
      setScanProgress(100);
      
      setTimeout(() => {
        setReading(normalizePalmReading(data?.content || FALLBACK_READING));
        setPhase("results");
      }, 800);
    } catch (err) {
      clearInterval(interval);
      setReading(normalizePalmReading(FALLBACK_READING));
      setPhase("results");
    }
  }, []);

  const reset = () => {
    setCapturedImage(null);
    capturedFileRef.current = null;
    setReading(null);
    setScanProgress(0);
    setPhase("intro");
  };

  const s = {
    wrap: { background: "#0B1A1A", minHeight: "100vh", color: "#FFFDD0", display: "flex", flexDirection: "column", alignItems: "center" },
    content: { width: "100%", maxWidth: "480px", padding: "40px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "24px" },
    h2: { fontSize: "28px", color: "#F5D060", textAlign: "center", letterSpacing: "3px", textTransform: "uppercase" },
    p: { fontSize: "16px", color: "rgba(255,253,208,0.7)", textAlign: "center", lineHeight: "1.6" },
    btn: { background: "linear-gradient(135deg, #B87333, #F5D060)", border: "none", borderRadius: "100px", padding: "18px 40px", fontSize: "16px", color: "#0B1A1A", fontWeight: "bold", cursor: "pointer", width: "100%", letterSpacing: "2px" },
    card: { width: "100%", background: "rgba(184,115,51,0.05)", border: "1px solid rgba(184,115,51,0.2)", borderRadius: "20px", padding: "24px" },
    scanBar: { position: "absolute", left: 0, right: 0, height: "4px", background: "#F5D060", boxShadow: "0 0 20px #F5D060", transition: "top 0.3s ease" }
  };

  return (
    <div style={s.wrap}>
      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />

      {phase === "intro" && (
        <div style={s.content}>
          <div className="text-6xl mb-4">✋</div>
          <h2 style={s.h2}>The Palm Chamber</h2>
          <p style={s.p}>Initiate the scan to decode your cosmic map. Align your hand for the Oracle.</p>
          <button style={s.btn} onClick={openCamera}>BEGIN SCAN</button>
        </div>
      )}

      {phase === "preview" && (
        <div style={s.content}>
          <img src={capturedImage} alt="Palm" className="w-full rounded-3xl border border-[#B87333]/30" />
          <button style={s.btn} onClick={analyzePalm}>DECODE PALM</button>
          <button className="text-[#B87333] font-bold" onClick={openCamera}>RETAKE</button>
        </div>
      )}

      {phase === "scanning" && (
        <div style={s.content}>
          <h2 style={s.h2}>DECODING...</h2>
          <div className="relative w-full aspect-[3/4] overflow-hidden rounded-3xl">
            <img src={capturedImage} className="w-full h-full object-cover opacity-40" />
            <div style={{ ...s.scanBar, top: scanProgress + "%" }} />
          </div>
        </div>
      )}

      {phase === "results" && reading && (
        <div style={s.content} className="pb-20">
          <div className="text-center border-b border-[#B87333]/20 pb-6 w-full">
             <div className="text-[#B87333] text-xs tracking-widest mb-2 uppercase">{reading.handType}</div>
             <h2 style={s.h2}>{reading.archetype}</h2>
          </div>
          <div style={s.card}>
            <p style={s.p}>{reading.overview}</p>
          </div>
          <button style={s.btn} onClick={reset}>NEW SCAN</button>
        </div>
      )}
    </div>
  );
}

export function PalmChamber({ onBack }: { onBack: () => void }) {
  return (
    <div className="fixed inset-0 z-[9999] bg-[#0B1A1A] overflow-y-auto">
      <button onClick={onBack} className="absolute top-8 left-8 z-[10000] text-[#B87333] font-bold tracking-widest">
        ← BACK
      </button>
      <PalmScanner />
    </div>
  );
}
