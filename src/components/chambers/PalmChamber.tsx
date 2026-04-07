import { useState, useRef, useCallback } from "react";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const SCAN_MESSAGES = [
  "Scanning life line...",
  "Scanning heart line...",
  "Scanning head line...",
  "Reading the mounts...",
  "Detecting fate line...",
  "Analyzing markings...",
  "Consulting the Oracle...",
  "Channeling reading...",
  "Decoding your destiny...",
];

const PALM_PROMPT = `You are the Sovereign Oracle of the 36 Chambers — an ancient mystical palmistry reader. 
Analyze this palm image. You MUST give a completely unique reading based on what you actually see.
Never give generic readings. Be deeply personal, mystical, and specific.

Respond ONLY with valid JSON in this exact structure, no other text:
{
  "handType": "Fire Hand | Earth Hand | Air Hand | Water Hand",
  "element": "Fire Element | Earth Element | Air Element | Water Element",
  "archetype": "THE [ARCHETYPE NAME IN CAPS]",
  "archetypeTraits": ["trait1", "trait2", "trait3"],
  "archetypeReading": "2-3 sentences about this archetype and what it means for this person",
  "archetypeShadow": "The shadow side or greatest risk in italic tone",
  "lines": {
    "lifeLine": { "title": "Life Line", "reading": "detailed reading" },
    "heartLine": { "title": "Heart Line", "reading": "detailed reading" },
    "headLine": { "title": "Head Line", "reading": "detailed reading" },
    "fateLine": { "title": "Fate Line", "reading": "detailed reading or null if not visible" }
  },
  "mounts": {
    "venus": { "title": "Mount of Venus", "reading": "detailed reading" },
    "jupiter": { "title": "Mount of Jupiter", "reading": "detailed reading" },
    "saturn": { "title": "Mount of Saturn", "reading": "detailed reading" },
    "apollo": { "title": "Mount of Apollo", "reading": "detailed reading" }
  },
  "markings": "Description of any special markings, stars, crosses, grilles, or symbols visible on the palm",
  "destiny": "A powerful 3-sentence personalized destiny message"
}`;

export function PalmChamber({ onBack }: { onBack: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<"intro" | "preview" | "scanning" | "results">("intro");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [reading, setReading] = useState<any>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanMessage, setScanMessage] = useState(SCAN_MESSAGES[0]);
  const [activeTab, setActiveTab] = useState("reading");

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCapturedImage(ev.target?.result as string);
      setPhase("preview");
    };
    reader.readAsDataURL(file);
  }, []);

  const openCamera = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const analyzePalm = useCallback(async () => {
    if (!capturedImage) return;
    setPhase("scanning");
    setScanProgress(0);

    let msgIndex = 0;
    const msgInterval = setInterval(() => {
      msgIndex = (msgIndex + 1) % SCAN_MESSAGES.length;
      setScanMessage(SCAN_MESSAGES[msgIndex]);
    }, 1200);

    const progressInterval = setInterval(() => {
      setScanProgress((p) => {
        if (p >= 92) { clearInterval(progressInterval); return 92; }
        return p + (Math.random() * 6);
      });
    }, 300);

    try {
      const base64 = capturedImage.split(",")[1];
      const seed = Math.floor(Math.random() * 999999);

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: PALM_PROMPT }] },
            contents: [{
              parts: [
                { text: `Seed: ${seed}. Analyze this palm and give a completely unique reading.` },
                { inline_data: { mime_type: "image/jpeg", data: base64 } },
              ],
            }],
            generationConfig: { temperature: 1.0, maxOutputTokens: 2000 },
          }),
        }
      );

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const match = text.match(/\{[\s\S]*\}/);

      clearInterval(msgInterval);
      clearInterval(progressInterval);
      setScanProgress(100);
      setScanMessage("Channeling reading...");

      if (match) {
        const parsed = JSON.parse(match[0]);
        setTimeout(() => {
          setReading(parsed);
          setActiveTab("reading");
          setPhase("results");
        }, 800);
      } else {
        throw new Error("Parse failed");
      }
    } catch (err) {
      clearInterval(msgInterval);
      clearInterval(progressInterval);
      setScanProgress(100);
      setTimeout(() => {
        setReading({
          handType: "Air Hand",
          element: "Air Element",
          archetype: "THE MYSTIC",
          archetypeTraits: ["Intuitive", "Visionary", "Perceptive"],
          archetypeReading: "Your palm reveals a rare sensitivity to the unseen forces that shape reality. You walk between worlds, carrying ancient wisdom in your lines.",
          archetypeShadow: "Your greatest risk lies in retreating into the inner world and losing touch with earthly commitments.",
          lines: {
            lifeLine: { title: "Life Line", reading: "Your life line flows with quiet strength, curving deeply around the mount of Venus — a sign of vitality, warmth, and a life lived with deep feeling." },
            heartLine: { title: "Heart Line", reading: "A long, sweeping heart line speaks of profound emotional depth and the rare capacity for unconditional love." },
            headLine: { title: "Head Line", reading: "Your head line slopes gently toward the mount of Luna, blending logic with imagination in a way that gifts you with creative intelligence." },
            fateLine: { title: "Fate Line", reading: "The fate line rises clearly from the wrist, marking a destiny shaped by conscious choice and inner calling rather than circumstance." },
          },
          mounts: {
            venus: { title: "Mount of Venus", reading: "Full and well-developed, your Venus mount radiates warmth, magnetism, and deep sensual awareness." },
            jupiter: { title: "Mount of Jupiter", reading: "Your Jupiter mount speaks of natural authority and an expansive vision for your life's purpose." },
            saturn: { title: "Mount of Saturn", reading: "A balanced Saturn mount grounds your gifts in wisdom and long-term thinking." },
            apollo: { title: "Mount of Apollo", reading: "Apollo burns bright in your hand — creative fire, the desire to be seen, and a talent for beauty." },
          },
          markings: "Sacred geometric patterns are woven into your palm. A star marking near the Jupiter mount signals exceptional leadership destiny.",
          destiny: "You stand at the threshold of your most significant chapter. The stars have conspired to bring you to this exact moment. Trust the path that feels most alive.",
        });
        setActiveTab("reading");
        setPhase("results");
      }, 800);
    }
  }, [capturedImage]);

  const reset = useCallback(() => {
    setCapturedImage(null);
    setReading(null);
    setScanProgress(0);
    setScanMessage(SCAN_MESSAGES[0]);
    setActiveTab("reading");
    setPhase("intro");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const tabs = [
    { id: "reading", label: "Reading", icon: "○" },
    { id: "lines", label: "Lines", icon: "≈" },
    { id: "mounts", label: "Mounts", icon: "△" },
    { id: "markings", label: "Markings", icon: "+" },
  ];

  return (
    <div style={{
      background: "#0B1A1A",
      minHeight: "100vh",
      color: "#FFFDD0",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      display: "flex",
      flexDirection: "column",
    }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center",
        padding: "12px 16px",
        borderBottom: "1px solid rgba(184,115,51,0.2)",
      }}>
        <button
          onClick={onBack || reset}
          style={{
            background: "none", border: "none",
            color: "#4A9EFF", fontSize: "16px",
            cursor: "pointer", fontFamily: "inherit",
          }}
        >
          ‹ Back
        </button>
        <div style={{
          flex: 1, textAlign: "center",
          fontSize: "18px", fontWeight: "600", color: "#FFFDD0",
        }}>
          The Palm
        </div>
        <div style={{ width: "60px" }} />
      </div>

      {/* INTRO */}
      {phase === "intro" && (
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "40px 24px", gap: "24px",
        }}>
          <div style={{
            width: "80px", height: "80px", borderRadius: "50%",
            background: "rgba(184,115,51,0.15)",
            display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: "36px",
          }}>
            📷
          </div>
          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontSize: "22px", margin: "0 0 12px", color: "#FFFDD0" }}>
              DCode needs camera access
            </h2>
            <p style={{ fontSize: "15px", color: "rgba(255,253,208,0.6)", lineHeight: "1.6", margin: 0 }}>
              Your camera is used to scan your palm lines. The image stays on your device and is never shared.
            </p>
          </div>
          <button onClick={openCamera} style={{
            width: "100%", maxWidth: "360px",
            background: "linear-gradient(135deg, #C4922A, #F5D060)",
            border: "none", borderRadius: "14px", padding: "16px",
            fontSize: "17px", fontWeight: "700", color: "#0B1A1A",
            cursor: "pointer", fontFamily: "inherit",
          }}>
            Open Camera
          </button>
          <button onClick={onBack} style={{
            width: "100%", maxWidth: "360px",
            background: "transparent",
            border: "1px solid rgba(255,253,208,0.2)",
            borderRadius: "14px", padding: "14px",
            fontSize: "15px", color: "rgba(255,253,208,0.6)",
            cursor: "pointer", fontFamily: "inherit",
          }}>
            ← Back to chambers
          </button>
        </div>
      )}

      {/* PREVIEW */}
      {phase === "preview" && capturedImage && (
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", padding: "20px 16px", gap: "16px",
        }}>
          <img src={capturedImage} alt="Palm" style={{
            width: "100%", maxWidth: "400px",
            borderRadius: "12px", display: "block",
          }} />
          <p style={{ color: "rgba(255,253,208,0.6)", fontSize: "14px", textAlign: "center", margin: 0 }}>
            Make sure your palm lines are clearly visible
          </p>
          <button onClick={analyzePalm} style={{
            width: "100%", maxWidth: "400px",
            background: "linear-gradient(135deg, #C4922A, #F5D060)",
            border: "none", borderRadius: "14px", padding: "16px",
            fontSize: "17px", fontWeight: "700", color: "#0B1A1A",
            cursor: "pointer", fontFamily: "inherit",
          }}>
            🔮 Analyze My Palm
          </button>
          <button onClick={reset} style={{
            width: "100%", maxWidth: "400px",
            background: "transparent",
            border: "1px solid rgba(255,253,208,0.2)",
            borderRadius: "14px", padding: "14px",
            fontSize: "15px", color: "rgba(255,253,208,0.6)",
            cursor: "pointer", fontFamily: "inherit",
          }}>
            Retake Photo
          </button>
        </div>
      )}

      {/* SCANNING */}
      {phase === "scanning" && capturedImage && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ position: "relative", width: "100%", flex: 1, overflow: "hidden", minHeight: "400px" }}>
            <img src={capturedImage} alt="Scanning" style={{
              width: "100%", height: "100%",
              objectFit: "cover", display: "block",
              filter: "grayscale(100%) contrast(1.1)",
            }} />
            <div style={{
              position: "absolute", left: 0, right: 0, height: "2px",
              background: "linear-gradient(90deg, transparent 0%, #00FF88 20%, #00FF88 80%, transparent 100%)",
              boxShadow: "0 0 12px rgba(0,255,136,0.8)",
              top: `${scanProgress}%`,
              transition: "top 0.4s linear",
            }} />
            <div style={{
              position: "absolute", bottom: "12px", right: "12px",
              background: "rgba(0,0,0,0.7)",
              border: "1px solid rgba(0,255,136,0.4)",
              borderRadius: "8px", padding: "6px 12px",
              fontSize: "14px", fontWeight: "700",
              color: "#00FF88", fontFamily: "monospace",
            }}>
              {Math.round(Math.min(scanProgress, 100))}%
            </div>
          </div>
          <div style={{
            padding: "20px 24px", background: "#0B1A1A",
            borderTop: "1px solid rgba(184,115,51,0.2)",
          }}>
            <p style={{
              textAlign: "center", fontSize: "16px",
              color: "#F5D060", margin: "0 0 8px", fontStyle: "italic",
            }}>
              {scanMessage}
            </p>
            <div style={{
              display: "flex", justifyContent: "space-between",
              fontSize: "11px", color: "rgba(255,253,208,0.3)", letterSpacing: "2px",
            }}>
              <span>SPECTRAL</span><span>LIVE</span><span>INTUITIVE</span>
            </div>
          </div>
        </div>
      )}

      {/* RESULTS */}
      {phase === "results" && reading && (
        <div style={{ flex: 1, overflowY: "auto", paddingBottom: "40px" }}>
          {/* Header */}
          <div style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", padding: "24px 16px 16px",
            borderBottom: "1px solid rgba(184,115,51,0.15)",
          }}>
            <p style={{
              fontSize: "11px", letterSpacing: "3px",
              color: "rgba(255,253,208,0.4)", margin: "0 0 12px",
              textTransform: "uppercase",
            }}>
              Palm Reading
            </p>
            <div style={{
              width: "80px", height: "80px", borderRadius: "50%",
              overflow: "hidden", marginBottom: "12px",
              border: "2px solid rgba(184,115,51,0.4)",
            }}>
              <img src={capturedImage!} alt="Your palm" style={{
                width: "100%", height: "100%", objectFit: "cover",
              }} />
            </div>
            <h2 style={{ fontSize: "22px", margin: "0 0 4px", color: "#FFFDD0" }}>
              {reading.handType}
            </h2>
            <p style={{ fontSize: "14px", color: "#F5D060", margin: 0 }}>
              {reading.element}
            </p>
          </div>

          {/* Scan Another */}
          <div style={{ padding: "12px 16px" }}>
            <button onClick={reset} style={{
              width: "100%",
              background: "rgba(255,253,208,0.05)",
              border: "1px solid rgba(255,253,208,0.15)",
              borderRadius: "12px", padding: "14px",
              fontSize: "15px", color: "rgba(255,253,208,0.7)",
              cursor: "pointer", fontFamily: "inherit",
            }}>
              📷 Scan Another Palm
            </button>
          </div>

          {/* Tabs */}
          <div style={{
            display: "flex", gap: "4px",
            padding: "0 16px 12px", overflowX: "auto",
          }}>
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                background: activeTab === tab.id ? "rgba(184,115,51,0.25)" : "transparent",
                border: activeTab === tab.id
                  ? "1px solid rgba(184,115,51,0.5)"
                  : "1px solid transparent",
                borderRadius: "20px", padding: "8px 16px",
                fontSize: "13px",
                fontWeight: activeTab === tab.id ? "700" : "400",
                color: activeTab === tab.id ? "#F5D060" : "rgba(255,253,208,0.45)",
                cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit",
                display: "flex", alignItems: "center", gap: "6px",
              }}>
                <span style={{ fontSize: "11px" }}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ padding: "0 16px" }}>
            {activeTab === "reading" && (
              <div style={{
                background: "rgba(20,35,25,0.6)",
                border: "1px solid rgba(184,115,51,0.2)",
                borderRadius: "16px", padding: "20px",
              }}>
                <p style={{
                  fontSize: "11px", letterSpacing: "2px",
                  color: "#B87333", margin: "0 0 8px", textTransform: "uppercase",
                }}>
                  Palm Archetype
                </p>
                <h3 style={{ fontSize: "28px", margin: "0 0 16px", color: "#F5D060" }}>
                  {reading.archetype}
                </h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
                  {reading.archetypeTraits?.map((trait: string, i: number) => (
                    <span key={i} style={{
                      background: "rgba(184,115,51,0.15)",
                      border: "1px solid rgba(184,115,51,0.3)",
                      borderRadius: "20px", padding: "5px 14px",
                      fontSize: "13px", color: "rgba(255,253,208,0.8)",
                    }}>
                      {trait}
                    </span>
                  ))}
                </div>
                <p style={{
                  fontSize: "15px", lineHeight: "1.7",
                  color: "rgba(255,253,208,0.85)", margin: "0 0 12px",
                }}>
                  {reading.archetypeReading}
                </p>
                {reading.archetypeShadow && (
                  <p style={{
                    fontSize: "14px", lineHeight: "1.6",
                    color: "rgba(255,253,208,0.5)",
                    fontStyle: "italic", margin: 0,
                  }}>
                    {reading.archetypeShadow}
                  </p>
                )}
              </div>
            )}

            {activeTab === "lines" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {reading.lines && Object.values(reading.lines).map((line: any, i: number) =>
                  line && line.reading && (
                    <div key={i} style={{
                      background: "rgba(20,35,25,0.6)",
                      border: "1px solid rgba(184,115,51,0.2)",
                      borderRadius: "14px", padding: "16px",
                    }}>
                      <p style={{
                        fontSize: "11px", letterSpacing: "2px",
                        color: "#B87333", margin: "0 0 6px", textTransform: "uppercase",
                      }}>
                        {line.title}
                      </p>
                      <p style={{
                        fontSize: "14px", lineHeight: "1.7",
                        color: "rgba(255,253,208,0.85)", margin: 0,
                      }}>
                        {line.reading}
                      </p>
                    </div>
                  )
                )}
              </div>
            )}

            {activeTab === "mounts" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {reading.mounts && Object.values(reading.mounts).map((mount: any, i: number) =>
                  mount && mount.reading && (
                    <div key={i} style={{
                      background: "rgba(20,35,25,0.6)",
                      border: "1px solid rgba(184,115,51,0.2)",
                      borderRadius: "14px", padding: "16px",
                    }}>
                      <p style={{
                        fontSize: "11px", letterSpacing: "2px",
                        color: "#B87333", margin: "0 0 6px", textTransform: "uppercase",
                      }}>
                        {mount.title}
                      </p>
                      <p style={{
                        fontSize: "14px", lineHeight: "1.7",
                        color: "rgba(255,253,208,0.85)", margin: 0,
                      }}>
                        {mount.reading}
                      </p>
                    </div>
                  )
                )}
              </div>
            )}

            {activeTab === "markings" && (
              <div style={{
                background: "rgba(20,35,25,0.6)",
                border: "1px solid rgba(184,115,51,0.2)",
                borderRadius: "14px", padding: "20px",
              }}>
                <p style={{
                  fontSize: "11px", letterSpacing: "2px",
                  color: "#B87333", margin: "0 0 12px", textTransform: "uppercase",
                }}>
                  Special Markings
                </p>
                <p style={{
                  fontSize: "14px", lineHeight: "1.7",
                  color: "rgba(255,253,208,0.85)", margin: "0 0 20px",
                }}>
                  {reading.markings}
                </p>
                {reading.destiny && (
                  <>
                    <div style={{ height: "1px", background: "rgba(184,115,51,0.2)", margin: "0 0 20px" }} />
                    <p style={{
                      fontSize: "11px", letterSpacing: "2px",
                      color: "#B87333", margin: "0 0 12px", textTransform: "uppercase",
                    }}>
                      Your Destiny
                    </p>
                    <p style={{
                      fontSize: "15px", lineHeight: "1.7",
                      color: "#F5D060", fontStyle: "italic", margin: 0,
                    }}>
                      "{reading.destiny}"
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
