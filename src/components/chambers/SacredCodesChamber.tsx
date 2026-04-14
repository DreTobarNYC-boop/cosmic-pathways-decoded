import { useState, useCallback, useMemo } from "react";
import { ChamberLayout } from "@/components/ChamberLayout";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { WithInfo } from "@/components/ui/info-tooltip";
import { Search, Copy, Check, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { normalizeLanguage } from "@/lib/language";

/* ─── Grabovoi Code Database ─── */

interface GrabovoiCode {
  id: string;
  title: string;
  code: string;
  category: string;
  icon: string;
  description: string;
  ritual: string;
}

const GRABOVOI_CODES: GrabovoiCode[] = [
  // Protection
  { id: "p1", title: "Divine Protection Shield", code: "9187948181", category: "Protection", icon: "△",
    description: "Creates an energetic shield of divine light around your aura, deflecting negative energy and psychic interference.",
    ritual: "Repeat 3x while visualizing white light surrounding your body." },
  { id: "p2", title: "Remove Negative Energy", code: "19712893", category: "Protection", icon: "△",
    description: "Dissolves negative energy attachments and cleanses your energetic field of unwanted influences.",
    ritual: "Speak aloud while running your hands over your body from head to toe." },
  { id: "p3", title: "Protection During Travel", code: "799999", category: "Protection", icon: "△",
    description: "Shields you and your loved ones during journeys, ensuring safe passage and return.",
    ritual: "Write on a small paper and carry with you. Repeat before departure." },
  { id: "p4", title: "Shield Against Evil Eye", code: "586849894", category: "Protection", icon: "△",
    description: "Neutralizes envious or harmful intentions directed at you from others.",
    ritual: "Visualize a mirror reflecting energy back. Repeat the code 7 times." },

  // Wealth
  { id: "w1", title: "Financial Abundance", code: "71427321893", category: "Wealth", icon: "✦",
    description: "This sequence attracts financial flow and material well-being, aligning your reality with the norm of abundance. It helps manifest resources for a prosperous life.",
    ritual: "Visualize the numbers, write them down, or repeat them mentally with your intention." },
  { id: "w2", title: "Unexpected Money", code: "520741890", category: "Wealth", icon: "✦",
    description: "Opens channels for unexpected financial windfalls, bonuses, gifts, and surprise income from unanticipated sources.",
    ritual: "Write the code on green paper. Place in your wallet for 21 days." },
  { id: "w3", title: "Business Success", code: "5481271", category: "Wealth", icon: "✦",
    description: "Aligns your business ventures with universal prosperity codes, attracting clients, deals, and growth opportunities.",
    ritual: "Write on your business card or workspace. Meditate on it each morning." },
  { id: "w4", title: "Debt Elimination", code: "8955673849", category: "Wealth", icon: "✦",
    description: "Activates the dissolution of financial burdens and karmic debt patterns, clearing the path to financial freedom.",
    ritual: "Write the code and place under a glass of water. Drink the water mindfully." },

  // Love
  { id: "l1", title: "Attract Soul Connection", code: "888412123", category: "Love", icon: "◇",
    description: "Draws your soul's counterpart into your life by raising your love frequency to match theirs.",
    ritual: "Repeat before sleep while holding your hand over your heart. Feel the love you wish to receive." },
  { id: "l2", title: "Heal Heartbreak", code: "8974156", category: "Love", icon: "◇",
    description: "Mends emotional wounds from past relationships, restoring your heart's ability to trust and love again.",
    ritual: "Write the code over your heart area with your finger. Breathe deeply 9 times." },
  { id: "l3", title: "Deepen Intimacy", code: "481421", category: "Love", icon: "◇",
    description: "Strengthens the emotional and spiritual bond between partners, creating deeper understanding and connection.",
    ritual: "Both partners visualize the code together during a quiet moment." },
  { id: "l4", title: "Self-Love Activation", code: "396815", category: "Love", icon: "◇",
    description: "Awakens unconditional love for yourself, dissolving self-criticism and activating radical self-acceptance.",
    ritual: "Say 'I love and accept myself completely' while focusing on the code. Repeat 3x daily." },

  // Health
  { id: "h1", title: "Full Body Healing", code: "9187948181", category: "Health", icon: "❋",
    description: "Activates the body's innate healing intelligence, restoring cells to their original divine blueprint.",
    ritual: "Place your hands on the area needing healing. Visualize golden light as you repeat the code." },
  { id: "h2", title: "Mental Clarity", code: "3481942", category: "Health", icon: "❋",
    description: "Clears brain fog, sharpens focus, and aligns neural pathways for optimal cognitive function.",
    ritual: "Touch your forehead with two fingers while repeating the code. Do this upon waking." },
  { id: "h3", title: "Deep Restful Sleep", code: "514248538", category: "Health", icon: "❋",
    description: "Reprograms your sleep patterns for deep, restorative rest that heals body, mind, and spirit.",
    ritual: "Write the code and place under your pillow. Repeat 3 times as you close your eyes." },
  { id: "h4", title: "Anxiety Relief", code: "514218857", category: "Health", icon: "❋",
    description: "Calms the nervous system and dissolves anxiety patterns stored in the body's energy field.",
    ritual: "Breathe slowly. On each exhale, mentally recite one digit of the code." },

  // Spiritual
  { id: "s1", title: "Third Eye Activation", code: "881974", category: "Spiritual", icon: "☉",
    description: "Opens and calibrates the pineal gland, enhancing intuition, clairvoyance, and spiritual perception.",
    ritual: "Focus on the space between your eyebrows. Repeat the code in meditation for 11 minutes." },
  { id: "s2", title: "Manifest Your Desires", code: "318798", category: "Spiritual", icon: "☉",
    description: "Aligns your conscious intention with universal creative force, accelerating the manifestation of your deepest desires.",
    ritual: "Write your desire clearly. Below it, write this code. Read both aloud 3x at sunrise." },
  { id: "s3", title: "Karmic Clearing", code: "5765439", category: "Spiritual", icon: "☉",
    description: "Dissolves karmic imprints and ancestral patterns that no longer serve your highest evolution.",
    ritual: "Meditate on the code during a new moon. Set the intention to release what no longer serves you." },
  { id: "s4", title: "Connect With Spirit Guides", code: "988001", category: "Spiritual", icon: "☉",
    description: "Opens the channel between you and your spiritual guides, ancestors, and higher-dimensional allies.",
    ritual: "Light a candle. Sit quietly and repeat the code 9 times. Listen for inner guidance." },

  // Success
  { id: "sc1", title: "Pass Any Exam", code: "4851312", category: "Success", icon: "★",
    description: "Sharpens memory recall, boosts confidence, and aligns your mind for optimal performance in tests and evaluations.",
    ritual: "Write the code on your wrist before the exam. Glance at it when you need focus." },
  { id: "sc2", title: "Win Legal Matters", code: "8189351", category: "Success", icon: "★",
    description: "Tips the scales of justice in your favor by aligning circumstances with truth and righteous outcome.",
    ritual: "Write the code on paper and hold during any legal proceedings or consultations." },
  { id: "sc3", title: "Attract New Opportunities", code: "18975431", category: "Success", icon: "★",
    description: "Opens doorways to new career, creative, and life opportunities that align with your soul's purpose.",
    ritual: "Write on a bay leaf and burn it. As the smoke rises, repeat the code aloud." },
  { id: "sc4", title: "Public Speaking Power", code: "519748", category: "Success", icon: "★",
    description: "Removes fear of public expression and channels charismatic, magnetic communication energy.",
    ritual: "Touch your throat while repeating the code 3x before speaking. Visualize blue light." },
];

const CATEGORIES = ["All", "Protection", "Wealth", "Love", "Health", "Spiritual", "Success"];

const CATEGORY_ICONS: Record<string, string> = {
  All: "✦", Protection: "△", Wealth: "✦", Love: "◇", Health: "❋", Spiritual: "☉", Success: "★",
};

/* ─── Code Card ─── */

function CodeCard({ code, onCopy }: { code: GrabovoiCode; onCopy: (text: string) => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy(code.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card-cosmic rounded-2xl p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <span className="text-lg mt-0.5 opacity-60">{code.icon}</span>
          <h3 className="font-display text-base font-bold text-foreground leading-tight">{code.title}</h3>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors shrink-0"
        >
          {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied" : "Copy code"}
        </button>
      </div>

      <p className="font-display text-xl font-bold text-primary tracking-wider">{code.code}</p>

      <p className="text-sm text-foreground/80 leading-relaxed">{code.description}</p>

      <p className="text-sm text-primary/70 italic leading-relaxed">{code.ritual}</p>
    </div>
  );
}

/* ─── Info Section ─── */

function InfoSection() {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto"
      >
        <span>What are Grabovoi codes?</span>
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      {open && (
        <div className="card-cosmic rounded-2xl p-4 text-sm text-foreground/80 leading-relaxed space-y-2 animate-fade-up">
          <p>
            Grabovoi codes are numerical sequences created by Russian mathematician Grigori Grabovoi.
            Each sequence carries a specific vibrational frequency aligned with an intention — healing,
            protection, abundance, love, or spiritual growth.
          </p>
          <p>
            To use them: <strong>focus on the numbers</strong> while holding your intention clearly in mind.
            You can repeat them mentally, write them down, meditate on them, or place them in your environment.
            Consistency and belief amplify their effect.
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── Main ─── */

export function SacredCodesChamber({ onBack }: { onBack: () => void }) {
  const { i18n } = useTranslation();
  const { profile } = useAuth();
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchInput, setSearchInput] = useState("");
  const [aiResult, setAiResult] = useState<{ title: string; code: string; description: string; ritual: string } | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const filteredCodes = useMemo(() => {
    if (activeCategory === "All") return GRABOVOI_CODES;
    return GRABOVOI_CODES.filter(c => c.category === activeCategory);
  }, [activeCategory]);

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Code copied to clipboard");
    }).catch(() => {
      toast.error("Failed to copy");
    });
  }, []);

  const findCode = useCallback(async () => {
    if (!searchInput.trim()) return;
    setIsSearching(true);
    setAiResult(null);

    const language = normalizeLanguage(i18n.language);

    try {
      const { data, error } = await supabase.functions.invoke("generate-reading", {
        body: {
          reading_type: "sacred_code",
          context: {
            name: profile?.fullName || "Seeker",
            intention: searchInput.trim(),
            birthPlace: profile?.birthPlace || "Unknown",
            birthTime: profile?.birthTime || "Unknown",
            dateOfBirth: profile?.dateOfBirth || "Unknown",
            language,
          },
        },
      });
      if (error) throw error;

      const content = data?.reading ?? data?.content;
      if (content) {
        try {
          const parsed = JSON.parse(content);
          setAiResult(parsed);
        } catch {
          // If not JSON, show as a simple result
          setAiResult({
            title: "Your Personal Code",
            code: content.match(/\d{5,}/)?.[0] || "519 7148",
            description: content,
            ritual: "Focus on this code while holding your intention. Repeat 3 times.",
          });
        }
      }
    } catch {
      toast.error("Could not channel your code. Try again.");
    } finally {
      setIsSearching(false);
    }
  }, [searchInput, profile, i18n.language]);

  return (
    <ChamberLayout title="The Vault" onBack={onBack}>
      <div className="space-y-5">

        {/* ─── Header ─── */}
        <div className="text-center space-y-3">
          <p className="text-[10px] uppercase tracking-[0.25em] text-primary/80 font-bold">THE VAULT</p>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
            Ancient numerical sequences encoded with specific intentions. Focus on the codes to channel their energy toward transformation.
          </p>
        </div>

        <InfoSection />

        {/* ─── Sacred Codes Section ─── */}
        <div className="space-y-4">
          <p className="text-[10px] uppercase tracking-[0.25em] text-primary/80 font-bold text-center">
            <WithInfo term="grabovoi">SACRED CODES (GRABOVOI)</WithInfo>
          </p>

          {/* Search */}
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-muted/20 border border-border rounded-xl px-4 py-3">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && findCode()}
                placeholder="Search for any intention..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
            <button
              onClick={findCode}
              disabled={!searchInput.trim() || isSearching}
              className="px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-40 hover:bg-primary/90 transition-colors shrink-0 whitespace-nowrap"
            >
              {isSearching ? "..." : "Find Your Code"}
            </button>
          </div>

          {/* AI Result */}
          {isSearching && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span>Channeling your code…</span>
            </div>
          )}
          {aiResult && (
            <div className="animate-fade-up">
              <CodeCard
                code={{
                  id: "ai",
                  title: aiResult.title,
                  code: aiResult.code,
                  category: "AI",
                  icon: "✧",
                  description: aiResult.description,
                  ritual: aiResult.ritual,
                }}
                onCopy={handleCopy}
              />
            </div>
          )}

          {/* Category filters */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-display font-bold whitespace-nowrap transition-all shrink-0 ${
                  activeCategory === cat
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "bg-muted/20 text-muted-foreground border border-transparent hover:bg-muted/30"
                }`}
              >
                <span className="text-[10px]">{CATEGORY_ICONS[cat]}</span>
                {cat}
              </button>
            ))}
          </div>

          {/* Code Cards */}
          <div className="space-y-3">
            {filteredCodes.map(code => (
              <CodeCard key={code.id} code={code} onCopy={handleCopy} />
            ))}
          </div>
        </div>

      </div>
    </ChamberLayout>
  );
}
