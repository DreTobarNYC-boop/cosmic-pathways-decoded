import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { toast } from "@/components/ui/use-toast";

import CosmicBackground from "@/components/palm/CosmicBackground";
import PalmIcon from "@/components/palm/PalmIcon";
import ScanAnimation from "@/components/palm/ScanAnimation";
import PalmReading from "@/components/palm/PalmReading";

const PALM_ANALYSIS_PROMPT = `You are a mystical palm reader. Analyze the palm in this image with rich, evocative detail.

Return your reading as JSON with this exact structure:
{
  "summary": "A one-paragraph mystical overview of this person's palm (2-3 sentences, poetic tone)",
  "sections": [
    {"title": "Heart Line", "description": "Detailed reading of the heart line..."},
    {"title": "Head Line", "description": "Detailed reading of the head line..."},
    {"title": "Life Line", "description": "Detailed reading of the life line..."},
    {"title": "Fate Line", "description": "Detailed reading of the fate line..."},
    {"title": "Career & Ambition", "description": "Overall career insights from the palm..."}
  ]
}

Be mystical, positive, and specific. Reference what you see in the palm image. If the image is not a clear palm, still provide an entertaining reading based on what you can see.`;

export default function PalmScanner() {
  const [imageUrl, setImageUrl] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanDone, setScanDone] = useState(false);
  const [reading, setReading] = useState(null);
  const readingRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    setImageUrl(localUrl);
    setScanning(true);
    setScanDone(false);
    setReading(null);
    readingRef.current = null;

    // Upload + analyze in parallel while scan animation plays
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: PALM_ANALYSIS_PROMPT,
      file_urls: [file_url],
      response_json_schema: {
        type: "object",
        properties: {
          summary: { type: "string" },
          sections: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
              },
            },
          },
        },
      },
    });
    readingRef.current = result;
    // If scan animation already finished, show reading immediately
    setScanDone((prev) => {
      if (prev) setReading(result);
      return prev;
    });
  };

  // Called when scan animation reaches 100%
  const handleScanComplete = () => {
    if (readingRef.current) {
      setReading(readingRef.current);
      setScanning(false);
    } else {
      // AI not done yet — mark scan done and wait
      setScanDone(true);
    }
  };

  // When reading arrives after scan is already done
  useEffect(() => {
    if (scanDone && readingRef.current && !reading) {
      setReading(readingRef.current);
      setScanning(false);
    }
  }, [scanDone]);

  const handleReset = () => {
    setImageUrl(null);
    setScanning(false);
    setScanDone(false);
    setReading(null);
    readingRef.current = null;
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const currentView = reading ? "reading" : scanning ? "scanning" : "landing";

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <CosmicBackground />

      {/* Hidden file input for native camera */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12">
        <AnimatePresence mode="wait">
          {currentView === "landing" && (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center text-center"
            >
              {/* Title */}
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="font-body text-sm tracking-[0.3em] uppercase text-muted-foreground mb-2"
              >
                Cosmic Divination
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="font-display text-4xl md:text-5xl text-primary mb-3"
              >
                Palm Oracle
              </motion.h1>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="w-24 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent mb-8"
              />

              {/* Palm icon */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="mb-10"
              >
                <PalmIcon />
              </motion.div>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="font-body text-lg md:text-xl text-foreground/70 max-w-sm mb-10 leading-relaxed"
              >
                Place your palm before the lens and let the cosmos
                reveal the secrets written in your hand.
              </motion.p>

              {/* Camera button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  size="lg"
                  className="bg-gradient-to-r from-primary via-primary to-secondary text-primary-foreground font-display text-base tracking-wider px-10 py-6 rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:opacity-95 transition-all"
                >
                  <Camera className="w-5 h-5 mr-3" />
                  Open Camera
                </Button>
              </motion.div>
            </motion.div>
          )}

          {currentView === "scanning" && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center"
            >
              <ScanAnimation imageUrl={imageUrl} onComplete={handleScanComplete} />
            </motion.div>
          )}

          {currentView === "reading" && (
            <motion.div
              key="reading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              <PalmReading reading={reading} onReset={handleReset} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
