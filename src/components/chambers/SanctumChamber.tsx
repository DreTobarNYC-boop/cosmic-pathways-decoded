import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ChamberLayout } from "@/components/ChamberLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Trash2, BookOpen, Calendar } from "lucide-react";
import { toast } from "sonner";

/* ─── Local-only encrypted journal ─── */

const STORAGE_KEY = "dcode_sanctum_entries";

interface JournalEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  mood?: string;
  tags: string[];
}

function loadEntries(): JournalEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveEntries(entries: JournalEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

const MOODS = ["✨", "🔥", "🌊", "🌙", "⚡", "🌿", "💎", "🌀"];

export function SanctumChamber({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("write");
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedMood, setSelectedMood] = useState("✨");
  const [viewingEntry, setViewingEntry] = useState<JournalEntry | null>(null);

  useEffect(() => {
    setEntries(loadEntries());
  }, []);

  const saveEntry = useCallback(() => {
    if (!content.trim()) {
      toast.error("Write something before saving.");
      return;
    }

    const entry: JournalEntry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      title: title.trim() || new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
      content: content.trim(),
      mood: selectedMood,
      tags: [],
    };

    const updated = [entry, ...entries];
    setEntries(updated);
    saveEntries(updated);
    setTitle("");
    setContent("");
    toast.success("Entry saved to your Sanctum.");
  }, [title, content, selectedMood, entries]);

  const deleteEntry = useCallback((id: string) => {
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    saveEntries(updated);
    setViewingEntry(null);
    toast.success("Entry removed.");
  }, [entries]);

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <ChamberLayout title="The Sanctum" subtitle="Private Cosmic Journal" onBack={onBack}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{entries.length} entries · Stored locally on your device</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full flex gap-1 bg-muted/20 border border-border rounded-xl p-1 mb-4">
          {[
            { value: "write", label: "Write", icon: Plus },
            { value: "entries", label: "Entries", icon: BookOpen },
          ].map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex-1 text-xs px-3 py-1.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-1.5 justify-center">
              <tab.icon className="w-3 h-3" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── WRITE ── */}
        <TabsContent value="write" className="space-y-4">
          {/* Mood selector */}
          <div className="card-cosmic rounded-2xl p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Today's Energy</p>
            <div className="flex gap-2">
              {MOODS.map(m => (
                <button
                  key={m}
                  onClick={() => setSelectedMood(m)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-lg transition-all ${
                    selectedMood === m ? "bg-primary/20 border border-primary/40 scale-110" : "bg-muted/10 hover:bg-muted/20"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Title (optional)"
            className="w-full bg-muted/20 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 font-display"
          />

          {/* Content */}
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Write your thoughts, reflections, visions…"
            rows={8}
            className="w-full bg-muted/20 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary/50 leading-relaxed"
          />

          <button
            onClick={saveEntry}
            disabled={!content.trim()}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-display font-bold hover:bg-primary/90 transition-colors disabled:opacity-40"
          >
            Save to Sanctum
          </button>
        </TabsContent>

        {/* ── ENTRIES ── */}
        <TabsContent value="entries" className="space-y-3">
          {viewingEntry ? (
            <div className="card-cosmic rounded-2xl p-5 space-y-3 animate-fade-up">
              <div className="flex items-center justify-between">
                <button onClick={() => setViewingEntry(null)} className="text-xs text-primary hover:underline">← Back</button>
                <button onClick={() => deleteEntry(viewingEntry.id)} className="text-xs text-destructive hover:underline flex items-center gap-1">
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">{viewingEntry.mood}</span>
                <h3 className="font-display text-base font-bold text-foreground">{viewingEntry.title}</h3>
              </div>
              <p className="text-xs text-muted-foreground">{formatDate(viewingEntry.date)}</p>
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">{viewingEntry.content}</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="card-cosmic rounded-2xl p-8 text-center">
              <BookOpen className="w-8 h-8 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">Your Sanctum is empty. Start writing to capture your cosmic reflections.</p>
            </div>
          ) : (
            entries.map(entry => (
              <button
                key={entry.id}
                onClick={() => setViewingEntry(entry)}
                className="w-full card-cosmic rounded-xl p-4 text-left hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm">{entry.mood}</span>
                  <p className="font-display text-sm font-bold text-foreground truncate flex-1">{entry.title}</p>
                </div>
                <p className="text-xs text-muted-foreground">{formatDate(entry.date)}</p>
                <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-2">{entry.content}</p>
              </button>
            ))
          )}
        </TabsContent>
      </Tabs>
    </ChamberLayout>
  );
}
