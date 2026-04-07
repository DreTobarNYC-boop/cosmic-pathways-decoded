// @ts-nocheck
import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const FALLBACK_READING = {
  handType: "Air Hand",
  element: "Air",
  archetype: {
    name: "THE ANALYST",
    traits: ["curious", "adaptable", "perceptive"],
    summary: "You notice patterns fast and think through things before you move. You're wired to observe, compare, and make sense of what's in front of you. When you trust your own read, you're usually right.",
    shadow: "You can overthink when a simple decision would do. Set short deadlines for yourself so analysis does not turn into delay.",
  },
  reading: {
    overview: "Your palm suggests a practical mind, strong instincts, and a path shaped more by your choices than by luck. You do best when you keep your goals visible and your energy focused on one clear next step at a time.",
  },
  lines: {
    heart: { strength: "moderate", description: "You care deeply, but you do not always show it right away. Be direct about what you need instead of expecting people to guess." },
    head: { strength: "strong", description: "You think clearly and catch details others miss. Use that skill on decisions that matter, not every small choice." },
    life: { strength: "strong", description: "You have solid staying power and bounce back well. Protect your energy by pacing yourself instead of pushing hard all the time." },
    fate: { strength: "moderate", description: "Your path looks self-directed. You get the best results when you define success on your own terms and review your progress weekly." },
    sun: { strength: "faint", description: "Recognition grows over time, not all at once. Keep showing your work and let consistency do the heavy lifting." },
  },
  mounts: {
    jupiter: { prominence: "moderate", meaning: "You have ambition, but it works best when tied to responsibility and follow-through." },
    saturn: { prominence: "moderate", meaning: "You take life seriously enough to learn from it. Just do not carry everything alone." },
    apollo: { prominence: "moderate", meaning: "You have creative instinct, especially when you stop trying to make it perfect first." },
    mercury: { prominence: "moderate", meaning: "Communication is one of your tools. Say the hard thing clearly and early." },
    venus: { prominence: "high", meaning: "You bring warmth, loyalty, and real feeling. Put that energy into people and work that give something back." },
    moon: { prominence: "moderate", meaning: "Your gut feelings are useful when you slow down enough to hear them." },
  },
  markings: [],
};

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

  const openCamera = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const analyzePalm = useCallback(async () => {
    if (!capturedFileRef.current) return;
    setPhase("scanning");
    setScanProgress(0);

    const interval = setInterval(() => {
      setScanProgress((p) => {
        if (p >= 95) {
          clearInterval(interval);
          return 95;
        }
        return p + Math.random() * 8;
      });
    }, 200);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",")[1]);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(capturedFileRef.current);
      });

      const { data, error } = await supabase.functions.invoke("palm-reading", {
        body: {
          image_base64: base64,
          language: "en",
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.content) throw new Error("No reading returned");

      clearInterval(interval);
      setScanProgress(100);
      setTimeout(() => {
        setReading(data.content);
        setPhase("results");
      }, 600);
    } catch (err) {
      clearInterval(interval);
      console.error("Analysis error:", err);
      setReading(FALLBACK_READING);
      setPhase("results");
    }
  }, []);

  const reset = useCallback(() => {
    setCapturedImage(null);
    capturedFileRef.current = null;
    setReading(null);
    setScanProgress(0);
    setActiveTab("overview");
    setPhase("intro");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const s = {
    wrap: {
      background: "#0B1A1A",
      minHeight: "100vh",
      fontFamily: "'Georgia', serif",
      color: "#FFFDD0",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "0",
    },
    header: {
      width: "100%",
      padding: "16px 20px",
      display: "flex",
      alignItems: "center",
      borderBottom: "1px solid rgba(184,115,51,0.2)",
    },
    backBtn: {
      background: "none",
      border: "none",
      color: "#B87333",
      fontSize: "14px",
      cursor: "pointer",
      padding: "4px 8px",
      fontFamily: "inherit",
    },
    title: {
      flex: 1,
      textAlign: "center",
      fontSize: "18px",
      color: "#F5D060",
      letterSpacing: "2px",
      textTransform: "uppercase",
    },
    content: {
      width: "100%",
      maxWidth: "480px",
      padding: "24px 20px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "20px",
    },
    palmIcon: {
      fontSize: "64px",
      marginBottom: "8px",
      filter: "drop-shadow(0 0 20px rgba(245,208,96,0.4))",
    },
    h2: {
      fontSize: "24px",
      color: "#F5D060",
      textAlign: "center",
      margin: "0",
      letterSpacing: "1px",
    },
    p: {
      fontSize: "15px",
      color: "rgba(255,253,208,0.7)",
      textAlign: "center",
      lineHeight: "1.7",
      margin: "0",
    },
    btn: {
      background: "linear-gradient(135deg, #B87333, #F5D060)",
      border: "none",
      borderRadius: "12px",
      padding: "14px 32px",
      fontSize: "16px",
      color: "#0B1A1A",
      fontWeight: "bold",
      cursor: "pointer",
      width: "100%",
      fontFamily: "inherit",
      letterSpacing: "1px",
    },
    btnSecondary: {
      background: "rgba(184,115,51,0.15)",
      border: "1px solid rgba(184,115,51,0.4)",
      borderRadius: "12px",
      padding: "12px 24px",
      fontSize: "14px",
      color: "#B87333",
      cursor: "pointer",
      fontFamily: "inherit",
    },
    previewImg: {
      width: "100%",
      maxWidth: "480px",
      borderRadius: "16px",
      border: "1px solid rgba(184,115,51,0.3)",
      display: "block",
    },
    scanWrap: {
      width: "100%",
      maxWidth: "480px",
      position: "relative",
      borderRadius: "16px",
      overflow: "hidden",
    },
    scanImg: {
      width: "100%",
      display: "block",
      borderRadius: "16px",
      opacity: 0.7,
    },
    scanBar: {
      position: "absolute",
      left: 0,
      right: 0,
      height: "3px",
      background: "linear-gradient(90deg, transparent, #00FF88, transparent)",
      boxShadow: "0 0 20px rgba(0,255,136,0.8)",
      transition: "top 0.3s ease",
    },
    scanGrid: {
      position: "absolute",
      inset: 0,
      backgroundImage: "linear-gradient(rgba(245,208,96,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(245,208,96,0.05) 1px, transparent 1px)",
      backgroundSize: "30px 30px",
    },
    progressBar: {
      width: "100%",
      height: "4px",
      background: "rgba(255,253,208,0.1)",
      borderRadius: "2px",
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      background: "linear-gradient(90deg, #B87333, #F5D060)",
      borderRadius: "2px",
      transition: "width 0.3s ease",
    },
    card: {
      width: "100%",
      background: "rgba(42,31,15,0.3)",
      border: "1px solid rgba(184,115,51,0.2)",
      borderRadius: "16px",
      padding: "20px",
    },
    archetypeCard: {
      width: "100%",
      background: "linear-gradient(135deg, rgba(42,31,15,0.8), rgba(11,26,26,0.9))",
      border: "1px solid rgba(245,208,96,0.3)",
      borderRadius: "20px",
      padding: "24px",
      textAlign: "center",
    },
    badge: {
      display: "inline-block",
      background: "rgba(184,115,51,0.2)",
      border: "1px solid rgba(184,115,51,0.4)",
      borderRadius: "20px",
      padding: "4px 14px",
      fontSize: "12px",
      color: "#B87333",
      letterSpacing: "1px",
      marginBottom: "8px",
    },
    tabs: {
      display: "flex",
      gap: "8px",
      width: "100%",
      overflowX: "auto",
      paddingBottom: "4px",
    },
    tab: (active) => ({
      background: active ? "rgba(184,115,51,0.3)" : "transparent",
      border: active ? "1px solid rgba(184,115,51,0.6)" : "1px solid rgba(184,115,51,0.2)",
      borderRadius: "20px",
      padding: "6px 14px",
      fontSize: "12px",
      color: active ? "#F5D060" : "rgba(255,253,208,0.5)",
      cursor: "pointer",
      whiteSpace: "nowrap",
      fontFamily: "inherit",
      letterSpacing: "0.5px",
    }),
    sectionTitle: {
      fontSize: "13px",
      color: "#B87333",
      letterSpacing: "2px",
      textTransform: "uppercase",
      marginBottom: "8px",
    },
    lineItem: {
      borderBottom: "1px solid rgba(184,115,51,0.1)",
      paddingBottom: "12px",
      marginBottom: "12px",
    },
    lineLabel: {
      fontSize: "12px",
      color: "#F5D060",
      letterSpacing: "1px",
      marginBottom: "4px",
    },
    lineText: {
      fontSize: "14px",
      color: "rgba(255,253,208,0.8)",
      lineHeight: "1.6",
    },
    giftPill: {
      display: "inline-block",
      background: "rgba(245,208,96,0.1)",
      border: "1px solid rgba(245,208,96,0.3)",
      borderRadius: "20px",
      padding: "4px 12px",
      fontSize: "12px",
      color: "#F5D060",
      margin: "4px",
    },
    challengePill: {
      display: "inline-block",
      background: "rgba(184,115,51,0.1)",
      border: "1px solid rgba(184,115,51,0.3)",
      borderRadius: "20px",
      padding: "4px 12px",
      fontSize: "12px",
      color: "#B87333",
      margin: "4px",
    },
    destinyCard: {
      width: "100%",
      background: "linear-gradient(135deg, rgba(245,208,96,0.08), rgba(184,115,51,0.05))",
      border: "1px solid rgba(245,208,96,0.2)",
      borderRadius: "16px",
      padding: "20px",
      textAlign: "center",
    },
  };

  const tabList = ["overview", "lines", "mounts", "markings", "destiny"];

  return (
    <div style={s.wrap}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      <div style={s.header}>
        <button style={s.backBtn} onClick={reset}>{"<- Back"}</button>
        <div style={s.title}>The Palm</div>
        <div style={{ width: "60px" }} />
      </div>

      {phase === "intro" && (
        <div style={s.content}>
          <div style={s.palmIcon}>{"🔮"}</div>
          <h2 style={s.h2}>Palm Reading</h2>
          <p style={s.p}>
            Your palm holds the map of your soul. Ancient wisdom encoded in every line, mount, and marking —
            waiting to be decoded by the Oracle.
          </p>
          <div style={s.card}>
            <p style={{ ...s.p, fontSize: "13px" }}>
              {"📱"} Hold your dominant hand flat with fingers together<br/>
              {"💡"} Ensure good lighting on your palm<br/>
              {"📸"} Keep your hand steady for the scan
            </p>
          </div>
          <button style={s.btn} onClick={openCamera}>
            {"✋"} Open Palm Scanner
          </button>
        </div>
      )}

      {phase === "preview" && capturedImage && (
        <div style={s.content}>
          <h2 style={s.h2}>Your Palm</h2>
          <img src={capturedImage} alt="Captured palm" style={s.previewImg} />
          <p style={s.p}>Ready for the Oracle to read your palm?</p>
          <button style={s.btn} onClick={analyzePalm}>
            {"🔮"} Reveal My Reading
          </button>
          <button style={s.btnSecondary} onClick={openCamera}>
            Retake Photo
          </button>
        </div>
      )}

      {phase === "scanning" && capturedImage && (
        <div style={s.content}>
          <h2 style={s.h2}>Scanning Your Palm...</h2>
          <div style={s.scanWrap}>
            <img src={capturedImage} alt="Scanning" style={s.scanImg} />
            <div style={s.scanGrid} />
            <div style={{ ...s.scanBar, top: scanProgress + "%" }} />
          </div>
          <div style={s.progressBar}>
            <div style={{ ...s.progressFill, width: scanProgress + "%" }} />
          </div>
          <p style={s.p}>
            {scanProgress < 30
              ? "Reading your life lines..."
              : scanProgress < 60
              ? "Decoding the mounts..."
              : scanProgress < 85
              ? "Consulting the Oracle..."
              : "Preparing your destiny..."}
          </p>
        </div>
      )}

      {phase === "results" && reading && (
        <div style={s.content}>
          <div style={s.archetypeCard}>
            <div style={s.badge}>{reading.handType}</div>
            <h2 style={{ ...s.h2, fontSize: "28px", marginBottom: "8px" }}>
              {reading.archetype}
            </h2>
            <p style={{ ...s.p, fontSize: "14px" }}>{reading.overview}</p>
          </div>

          <div style={s.tabs}>
            {tabList.map((tab) => (
              <button
                key={tab}
                style={s.tab(activeTab === tab)}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {activeTab === "overview" && (
            <div style={s.card}>
              <div style={s.sectionTitle}>Your Gifts</div>
              <div style={{ marginBottom: "16px" }}>
                {reading.gifts?.map((g, i) => (
                  <span key={i} style={s.giftPill}>{"✨"} {g}</span>
                ))}
              </div>
              <div style={s.sectionTitle}>Your Challenges</div>
              <div>
                {reading.challenges?.map((c, i) => (
                  <span key={i} style={s.challengePill}>{"🔥"} {c}</span>
                ))}
              </div>
            </div>
          )}

          {activeTab === "lines" && reading.lines && (
            <div style={s.card}>
              <div style={s.sectionTitle}>Palm Lines</div>
              {Object.entries(reading.lines).map(([key, val]) => val && (
                <div key={key} style={s.lineItem}>
                  <div style={s.lineLabel}>
                    {key === "lifeLine" ? "Life Line" :
                     key === "heartLine" ? "Heart Line" :
                     key === "headLine" ? "Head Line" : "Fate Line"}
                  </div>
                  <div style={s.lineText}>{val}</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "mounts" && reading.mounts && (
            <div style={s.card}>
              <div style={s.sectionTitle}>The Mounts</div>
              {Object.entries(reading.mounts).map(([key, val]) => val && (
                <div key={key} style={s.lineItem}>
                  <div style={s.lineLabel}>
                    {"Mount of " + key.charAt(0).toUpperCase() + key.slice(1)}
                  </div>
                  <div style={s.lineText}>{val}</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "markings" && (
            <div style={s.card}>
              <div style={s.sectionTitle}>Special Markings</div>
              <div style={s.lineText}>{reading.markings}</div>
            </div>
          )}

          {activeTab === "destiny" && (
            <div style={s.destinyCard}>
              <div style={{ fontSize: "32px", marginBottom: "12px" }}>{"🌟"}</div>
              <div style={s.sectionTitle}>Your Destiny</div>
              <p style={{ ...s.p, fontSize: "16px", fontStyle: "italic" }}>
                {'"' + reading.destiny + '"'}
              </p>
            </div>
          )}

          <button style={s.btn} onClick={reset}>
            Scan Again
          </button>
        </div>
      )}
    </div>
  );
}

export function PalmChamber({ onBack }: { onBack: () => void }) {
  return <PalmScanner />;
}
