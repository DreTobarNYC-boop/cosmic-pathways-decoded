import { useState, useRef, useEffect, useCallback } from "react";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const PALM_SYSTEM_PROMPT = `You are the Sovereign Oracle of the 36 Chambers, a mystical palmistry reader with ancient wisdom. 
Analyze this palm image with deep spiritual insight. You MUST provide a unique, personalized reading based on what you actually see in the image.

Structure your response as JSON with this exact format:
{
  "archetype": "The [Archetype Name]",
  "handType": "Fire Hand | Earth Hand | Air Hand | Water Hand",
  "overview": "2-3 sentences of mystical overview",
  "lines": {
    "lifeLine": "Reading of the life line",
    "heartLine": "Reading of the heart line", 
    "headLine": "Reading of the head line",
    "fateLine": "Reading of the fate line if visible"
  },
  "mounts": {
    "venus": "Reading of the Mount of Venus",
    "jupiter": "Reading of the Mount of Jupiter",
    "saturn": "Reading of the Mount of Saturn",
    "apollo": "Reading of the Mount of Apollo"
  },
  "markings": "Special markings, stars, crosses, or symbols you see",
  "destiny": "A powerful, personalized destiny message in 2-3 sentences",
  "gifts": ["gift1", "gift2", "gift3"],
  "challenges": ["challenge1", "challenge2"]
}

Be mystical, specific, and deeply personal. Never give generic readings. Each palm is unique.`;

export default function PalmScanner() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [phase, setPhase] = useState("intro");
  const [cameraError, setCameraError] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [reading, setReading] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [scanProgress, setScanProgress] = useState(0);
  const [facingMode, setFacingMode] = useState("environment");

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const startCamera = useCallback(async (mode = facingMode) => {
    stopCamera();
    setCameraError(null);
    try {
      const constraints = {
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
    } catch (err) {
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
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedImage(dataUrl);
    stopCamera();
    setPhase("preview");
  }, [stopCamera]);

  const analyzepalm = useCallback(async () => {
    if (!capturedImage) return;
    setPhase("scanning");
    setIsAnalyzing(true);
    setScanProgress(0);

    const interval = setInterval(() => {
      setScanProgress((p) => {
        if (p >= 95) { clearInterval(interval); return 95; }
        return p + Math.random() * 8;
      });
    }, 200);

    try {
      const base64 = capturedImage.split(",")[1];
      const seed = Math.floor(Math.random() * 999999);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: PALM_SYSTEM_PROMPT }] },
            contents: [{
              parts: [
                { text: `Unique seed: ${seed}. Analyze this palm image with fresh eyes and provide a completely unique reading.` },
                { inline_data: { mime_type: "image/jpeg", data: base64 } },
              ],
            }],
            generationConfig: { temperature: 1.0, maxOutputTokens: 1500 },
          }),
        }
      );

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        clearInterval(interval);
        setScanProgress(100);
        setTimeout(() => {
          setReading(parsed);
          setPhase("results");
          setIsAnalyzing(false);
        }, 600);
      } else {
        throw new Error("Could not parse reading");
      }
    } catch (err) {
      clearInterval(interval);
      console.error("Analysis error:", err);
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
  }, [capturedImage]);

  const reset = useCallback(() => {
    stopCamera();
    setCapturedImage(null);
    setReading(null);
    setScanProgress(0);
    setActiveTab("overview");
    setCameraError(null);
    setPhase("intro");
  }, [stopCamera]);

  const s: Record<string, any> = {

  const tabs = ["overview", "lines", "mounts", "markings", "destiny"];

  return (
    <div style={s.wrap}>
      <canvas ref={canvasRef} style={{ display: "none" }} />

      <div style={s.header}>
        <button style={s.backBtn} onClick={reset}>← Back</button>
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
          <button style={s.btn} onClick={analyzepalm}>
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
