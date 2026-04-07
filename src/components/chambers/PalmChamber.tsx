import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { startScanSound, stopScanSound, updateScanPitch, playCompletionChime } from "@/lib/scan-sound";

interface PalmReading {
  archetype: string;
  handType: string;
  overview: string;
  lines: {
    lifeLine: string;
    heartLine: string;
    headLine: string;
    fateLine: string;
  };
  mounts: {
    venus: string;
    jupiter: string;
    saturn: string;
    apollo: string;
  };
  markings: string;
  destiny: string;
  gifts: string[];
  challenges: string[];
}

export function PalmChamber({ onBack }: { onBack: () => void }) {
  const { i18n } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [phase, setPhase] = useState<"intro" | "camera" | "error" | "preview" | "scanning" | "results">("intro");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [reading, setReading] = useState<PalmReading | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [scanProgress, setScanProgress] = useState(0);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const startCamera = useCallback(async (mode: "environment" | "user" = facingMode) => {
    stopCamera();
    setCameraError(null);
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setPhase("camera");
    } catch (err: any) {
      console.error("Camera error:", err);
      if (err.name === "NotAllowedError") {
        setCameraError("Camera permission denied. Please allow camera access in your browser settings.");
      } else if (err.name === "NotFoundError") {
        setCameraError("No camera found on this device.");
      } else {
        setCameraError("Could not start camera: " + err.message);
      }
      setPhase("error");
    }
  }, [facingMode, stopCamera]);

  const flipCamera = useCallback(() => {
    const newMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(newMode);
    startCamera(newMode);
  }, [facingMode, startCamera]);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedImage(dataUrl);
    stopCamera();
    setPhase("preview");
  }, [stopCamera]);

  const analyzePalm = useCallback(async () => {
    if (!capturedImage) return;
    setPhase("scanning");
    setIsAnalyzing(true);
    setScanProgress(0);
    startScanSound();

    const interval = setInterval(() => {
      setScanProgress((p) => {
        const next = p + Math.random() * 8;
        updateScanPitch(Math.min(next, 95));
        if (next >= 95) { clearInterval(interval); return 95; }
        return next;
      });
    }, 200);

    try {
      const base64 = capturedImage.split(",")[1];
      const { data, error } = await supabase.functions.invoke("palm-reading", {
        body: { image_base64: base64, language: i18n.language },
      });

      clearInterval(interval);

      if (error || !data?.content) {
        throw new Error(data?.error || "Analysis failed");
      }

      const parsed = data.content;
      setScanProgress(100);
      updateScanPitch(100);
      stopScanSound();
      playCompletionChime();
      if (navigator.vibrate) navigator.vibrate([50, 30, 80]);

      setTimeout(() => {
        setReading(parsed);
        setPhase("results");
        setIsAnalyzing(false);
      }, 600);
    } catch (err) {
      clearInterval(interval);
      stopScanSound();
      console.error("Analysis error:", err);
      // Fallback reading
      setReading({
        archetype: "The Mystic Wanderer",
        handType: "Air Hand",
        overview: "Your palm carries ancient wisdom written in the language of the cosmos. The lines etched upon your hand speak of a soul who walks between worlds.",
        lines: {
          lifeLine: "Your life line curves with vitality and purpose, suggesting a path rich with transformation and renewal.",
          heartLine: "A deep heart line reveals profound emotional capacity and the gift of genuine connection.",
          headLine: "Your head line shows a mind that bridges intuition and intellect with rare grace.",
          fateLine: "The fate line rises with determination, marking a destiny shaped by conscious choice.",
        },
        mounts: {
          venus: "Elevated Mount of Venus speaks of magnetic charisma and deep sensual awareness.",
          jupiter: "Your Jupiter mount reveals natural leadership and an expansive vision for your life.",
          saturn: "The Saturn mount grounds your gifts in discipline and long-term mastery.",
          apollo: "Apollo's mount blazes with creative fire and the desire to leave your mark.",
        },
        markings: "Sacred geometric patterns are woven into your palm, marking you as one who carries both gift and purpose.",
        destiny: "You are at the threshold of your most significant chapter. The stars have aligned to support your deepest intentions.",
        gifts: ["Intuitive wisdom", "Creative expression", "Spiritual insight"],
        challenges: ["Trusting the process", "Embracing vulnerability"],
      });
      setPhase("results");
      setIsAnalyzing(false);
    }
  }, [capturedImage, i18n.language]);

  const reset = useCallback(() => {
    stopCamera();
    stopScanSound();
    setCapturedImage(null);
    setReading(null);
    setScanProgress(0);
    setActiveTab("overview");
    setCameraError(null);
    setPhase("intro");
  }, [stopCamera]);

  const s: Record<string, React.CSSProperties> = {
    wrap: {
      background: "hsl(var(--background))",
      minHeight: "100vh",
      fontFamily: "'Libre Baskerville', 'Georgia', serif",
      color: "hsl(var(--foreground))",
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
      borderBottom: "1px solid hsl(var(--border))",
    },
    backBtn: {
      background: "none",
      border: "none",
      color: "hsl(var(--copper))",
      fontSize: "14px",
      cursor: "pointer",
      padding: "4px 8px",
      fontFamily: "inherit",
    },
    title: {
      flex: 1,
      textAlign: "center" as const,
      fontSize: "18px",
      color: "hsl(var(--primary))",
      letterSpacing: "2px",
      textTransform: "uppercase" as const,
    },
    content: {
      width: "100%",
      maxWidth: "480px",
      padding: "24px 20px",
      display: "flex",
      flexDirection: "column" as const,
      alignItems: "center",
      gap: "20px",
    },
    palmIcon: {
      fontSize: "64px",
      marginBottom: "8px",
      filter: "drop-shadow(0 0 20px hsla(var(--primary) / 0.4))",
    },
    h2: {
      fontSize: "24px",
      color: "hsl(var(--primary))",
      textAlign: "center" as const,
      margin: "0",
      letterSpacing: "1px",
    },
    p: {
      fontSize: "15px",
      color: "hsl(var(--muted-foreground))",
      textAlign: "center" as const,
      lineHeight: "1.7",
      margin: "0",
    },
    btn: {
      background: "linear-gradient(135deg, hsl(var(--copper)), hsl(var(--primary)))",
      border: "none",
      borderRadius: "12px",
      padding: "14px 32px",
      fontSize: "16px",
      color: "hsl(var(--background))",
      fontWeight: "bold",
      cursor: "pointer",
      width: "100%",
      fontFamily: "inherit",
      letterSpacing: "1px",
    },
    btnSecondary: {
      background: "hsla(var(--copper) / 0.15)",
      border: "1px solid hsla(var(--copper) / 0.4)",
      borderRadius: "12px",
      padding: "12px 24px",
      fontSize: "14px",
      color: "hsl(var(--copper))",
      cursor: "pointer",
      fontFamily: "inherit",
    },
    videoWrap: {
      width: "100%",
      maxWidth: "480px",
      position: "relative" as const,
      borderRadius: "16px",
      overflow: "hidden",
      background: "#000",
      border: "1px solid hsl(var(--border))",
    },
    video: {
      width: "100%",
      display: "block",
      minHeight: "300px",
      objectFit: "cover" as const,
    },
    overlay: {
      position: "absolute" as const,
      inset: 0,
      display: "flex",
      flexDirection: "column" as const,
      alignItems: "center",
      justifyContent: "center",
      pointerEvents: "none" as const,
    },
    palmGuide: {
      width: "200px",
      height: "240px",
      border: "2px solid hsla(var(--primary) / 0.6)",
      borderRadius: "50% 50% 40% 40%",
      position: "relative" as const,
    },
    guideText: {
      position: "absolute" as const,
      bottom: "12px",
      left: 0,
      right: 0,
      textAlign: "center" as const,
      fontSize: "12px",
      color: "hsla(var(--primary) / 0.8)",
      letterSpacing: "1px",
    },
    captureBtn: {
      width: "70px",
      height: "70px",
      borderRadius: "50%",
      background: "linear-gradient(135deg, hsl(var(--copper)), hsl(var(--primary)))",
      border: "3px solid hsla(var(--foreground) / 0.3)",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "28px",
      boxShadow: "0 0 30px hsla(var(--primary) / 0.4)",
    },
    flipBtn: {
      position: "absolute" as const,
      top: "12px",
      right: "12px",
      background: "rgba(0,0,0,0.5)",
      border: "1px solid hsl(var(--border))",
      borderRadius: "8px",
      padding: "8px 12px",
      color: "hsl(var(--primary))",
      cursor: "pointer",
      fontSize: "18px",
      pointerEvents: "auto" as const,
    },
    previewImg: {
      width: "100%",
      maxWidth: "480px",
      borderRadius: "16px",
      border: "1px solid hsl(var(--border))",
      display: "block",
    },
    scanWrap: {
      width: "100%",
      maxWidth: "480px",
      position: "relative" as const,
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
      position: "absolute" as const,
      left: 0,
      right: 0,
      height: "3px",
      background: "linear-gradient(90deg, transparent, hsl(var(--primary)), transparent)",
      boxShadow: "0 0 20px hsla(var(--primary) / 0.8)",
      transition: "top 0.3s ease",
    },
    scanGrid: {
      position: "absolute" as const,
      inset: 0,
      backgroundImage: "linear-gradient(hsla(var(--primary) / 0.05) 1px, transparent 1px), linear-gradient(90deg, hsla(var(--primary) / 0.05) 1px, transparent 1px)",
      backgroundSize: "30px 30px",
    },
    progressBar: {
      width: "100%",
      height: "4px",
      background: "hsla(var(--foreground) / 0.1)",
      borderRadius: "2px",
      overflow: "hidden" as const,
    },
    progressFill: {
      height: "100%",
      background: "linear-gradient(90deg, hsl(var(--copper)), hsl(var(--primary)))",
      borderRadius: "2px",
      transition: "width 0.3s ease",
    },
    card: {
      width: "100%",
      background: "hsla(var(--card) / 0.3)",
      border: "1px solid hsl(var(--border))",
      borderRadius: "16px",
      padding: "20px",
      backdropFilter: "blur(10px)",
    },
    archetypeCard: {
      width: "100%",
      background: "linear-gradient(135deg, hsla(var(--card) / 0.8), hsla(var(--background) / 0.9))",
      border: "1px solid hsla(var(--primary) / 0.3)",
      borderRadius: "20px",
      padding: "24px",
      textAlign: "center" as const,
    },
    badge: {
      display: "inline-block",
      background: "hsla(var(--copper) / 0.2)",
      border: "1px solid hsla(var(--copper) / 0.4)",
      borderRadius: "20px",
      padding: "4px 14px",
      fontSize: "12px",
      color: "hsl(var(--copper))",
      letterSpacing: "1px",
      marginBottom: "8px",
    },
    tabs: {
      display: "flex",
      gap: "8px",
      width: "100%",
      overflowX: "auto" as const,
      paddingBottom: "4px",
    },
    sectionTitle: {
      fontSize: "13px",
      color: "hsl(var(--copper))",
      letterSpacing: "2px",
      textTransform: "uppercase" as const,
      marginBottom: "8px",
    },
    lineItem: {
      borderBottom: "1px solid hsla(var(--border) / 0.3)",
      paddingBottom: "12px",
      marginBottom: "12px",
    },
    lineLabel: {
      fontSize: "12px",
      color: "hsl(var(--primary))",
      letterSpacing: "1px",
      marginBottom: "4px",
    },
    lineText: {
      fontSize: "14px",
      color: "hsl(var(--muted-foreground))",
      lineHeight: "1.6",
    },
    giftPill: {
      display: "inline-block",
      background: "hsla(var(--primary) / 0.1)",
      border: "1px solid hsla(var(--primary) / 0.3)",
      borderRadius: "20px",
      padding: "4px 12px",
      fontSize: "12px",
      color: "hsl(var(--primary))",
      margin: "4px",
    },
    challengePill: {
      display: "inline-block",
      background: "hsla(var(--copper) / 0.1)",
      border: "1px solid hsla(var(--copper) / 0.3)",
      borderRadius: "20px",
      padding: "4px 12px",
      fontSize: "12px",
      color: "hsl(var(--copper))",
      margin: "4px",
    },
    destinyCard: {
      width: "100%",
      background: "linear-gradient(135deg, hsla(var(--primary) / 0.08), hsla(var(--copper) / 0.05))",
      border: "1px solid hsla(var(--primary) / 0.2)",
      borderRadius: "16px",
      padding: "20px",
      textAlign: "center" as const,
    },
    errorBox: {
      background: "rgba(180,50,50,0.1)",
      border: "1px solid rgba(180,50,50,0.3)",
      borderRadius: "12px",
      padding: "16px",
      textAlign: "center" as const,
      color: "rgba(255,180,180,0.9)",
      fontSize: "14px",
      lineHeight: "1.6",
      width: "100%",
    },
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    background: active ? "hsla(var(--copper) / 0.3)" : "transparent",
    border: active ? "1px solid hsla(var(--copper) / 0.6)" : "1px solid hsla(var(--copper) / 0.2)",
    borderRadius: "20px",
    padding: "6px 14px",
    fontSize: "12px",
    color: active ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
    cursor: "pointer",
    whiteSpace: "nowrap",
    fontFamily: "inherit",
    letterSpacing: "0.5px",
  });

  const tabs = ["overview", "lines", "mounts", "markings", "destiny"];

  return (
    <div style={s.wrap}>
      <canvas ref={canvasRef} style={{ display: "none" }} />

      <div style={s.header}>
        <button style={s.backBtn} onClick={onBack}>← Back</button>
        <div style={s.title}>✋ The Palm</div>
        <div style={{ width: "60px" }} />
      </div>

      {phase === "intro" && (
        <div style={s.content}>
          <div style={s.palmIcon}>🔮</div>
          <h2 style={s.h2}>Palm Reading</h2>
          <p style={s.p}>
            Your palm holds the map of your soul. Ancient wisdom encoded in every line, mount, and marking — 
            waiting to be decoded by the Oracle.
          </p>
          <div style={s.card}>
            <p style={{ ...s.p, fontSize: "13px" }}>
              📱 Hold your dominant hand flat with fingers together<br/>
              💡 Ensure good lighting on your palm<br/>
              📸 Keep your hand steady for the scan
            </p>
          </div>
          <button style={s.btn} onClick={() => startCamera()}>
            ✋ Open Palm Scanner
          </button>
        </div>
      )}

      {phase === "camera" && (
        <div style={{ ...s.content, gap: "16px" }}>
          <div style={s.videoWrap}>
            <video
              ref={videoRef}
              style={s.video}
              autoPlay
              playsInline
              muted
            />
            <div style={s.overlay}>
              <div style={s.palmGuide}>
                <div style={s.guideText}>ALIGN PALM HERE</div>
              </div>
            </div>
            <button style={s.flipBtn} onClick={flipCamera}>⟳</button>
          </div>
          <p style={{ ...s.p, fontSize: "13px" }}>
            Center your palm within the guide. Tap capture when ready.
          </p>
          <button style={s.captureBtn} onClick={capturePhoto}>
            📸
          </button>
          <button style={s.btnSecondary} onClick={reset}>Cancel</button>
        </div>
      )}

      {phase === "error" && (
        <div style={s.content}>
          <div style={s.palmIcon}>⚠️</div>
          <div style={s.errorBox}>{cameraError}</div>
          <p style={{ ...s.p, fontSize: "13px" }}>
            Try allowing camera permissions in your browser settings, then try again.
          </p>
          <button style={s.btn} onClick={() => startCamera()}>Try Again</button>
          <button style={s.btnSecondary} onClick={reset}>Go Back</button>
        </div>
      )}

      {phase === "preview" && capturedImage && (
        <div style={s.content}>
          <h2 style={s.h2}>Your Palm</h2>
          <img src={capturedImage} alt="Captured palm" style={s.previewImg} />
          <p style={s.p}>Ready for the Oracle to read your palm?</p>
          <button style={s.btn} onClick={analyzePalm}>
            🔮 Reveal My Reading
          </button>
          <button style={s.btnSecondary} onClick={() => startCamera()}>
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
            <div
              style={{
                ...s.scanBar,
                top: `${scanProgress}%`,
              }}
            />
          </div>
          <div style={s.progressBar}>
            <div style={{ ...s.progressFill, width: `${scanProgress}%` }} />
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
            {tabs.map((tab) => (
              <button
                key={tab}
                style={tabStyle(activeTab === tab)}
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
                  <span key={i} style={s.giftPill}>✨ {g}</span>
                ))}
              </div>
              <div style={s.sectionTitle}>Your Challenges</div>
              <div>
                {reading.challenges?.map((c, i) => (
                  <span key={i} style={s.challengePill}>🔥 {c}</span>
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
                    Mount of {key.charAt(0).toUpperCase() + key.slice(1)}
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
              <div style={{ fontSize: "32px", marginBottom: "12px" }}>🌟</div>
              <div style={s.sectionTitle}>Your Destiny</div>
              <p style={{ ...s.p, fontSize: "16px", fontStyle: "italic" }}>
                "{reading.destiny}"
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
