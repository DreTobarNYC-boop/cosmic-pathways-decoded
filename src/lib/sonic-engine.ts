import * as Tone from "tone";

export interface FrequencyPreset {
  id: string;
  name: string;
  hz: number;
  description: string;
  color: string;
  chakra: string;
}

export const SOLFEGGIO_FREQUENCIES: FrequencyPreset[] = [
  { id: "396", name: "Liberation", hz: 396, description: "Release fear & guilt", color: "hsl(0, 70%, 50%)", chakra: "Root" },
  { id: "417", name: "Transmutation", hz: 417, description: "Facilitate change & cleansing", color: "hsl(25, 80%, 50%)", chakra: "Sacral" },
  { id: "528", name: "Miracles", hz: 528, description: "DNA repair & transformation", color: "hsl(50, 90%, 55%)", chakra: "Solar Plexus" },
  { id: "639", name: "Connection", hz: 639, description: "Harmonize relationships", color: "hsl(120, 50%, 45%)", chakra: "Heart" },
  { id: "741", name: "Awakening", hz: 741, description: "Expand consciousness", color: "hsl(210, 70%, 55%)", chakra: "Throat" },
  { id: "852", name: "Intuition", hz: 852, description: "Return to spiritual order", color: "hsl(270, 60%, 55%)", chakra: "Third Eye" },
  { id: "963", name: "Divine", hz: 963, description: "Connect to higher self", color: "hsl(300, 50%, 60%)", chakra: "Crown" },
  { id: "432", name: "Calm", hz: 432, description: "Deep relaxation & inner peace", color: "hsl(160, 50%, 45%)", chakra: "Heart" },
  { id: "focus", name: "Focus", hz: 40, description: "Gamma binaural beats for concentration", color: "hsl(45, 85%, 55%)", chakra: "Third Eye" },
  { id: "sleep", name: "Sleep", hz: 3, description: "Delta waves for deep restorative sleep", color: "hsl(230, 40%, 35%)", chakra: "Crown" },
];

/* ══════════════════════════════════════════════════════════
   GENRE PROFILES — each frequency gets a unique musical personality
   ══════════════════════════════════════════════════════════ */

interface GenreProfile {
  bpm: number;
  genre: string;
  // Kick pattern (16 steps, 0 = silent)
  kick: number[];
  // Percussion patterns
  rim: number[];
  hat: number[];
  shaker: number[];
  // Synth character
  bassType: OscillatorType;
  bassFilterFreq: number;
  bassOctaves: number;
  padType: string;
  padFilterFreq: number;
  padSpread: number;
  arpType: OscillatorType;
  arpFilterFreq: number;
  // FX
  reverbDecay: number;
  reverbWet: number;
  delayTime: string;
  delayFeedback: number;
  filterLfoMin: number;
  filterLfoMax: number;
  filterLfoRate: number;
  // Volumes
  kickVol: number;
  rimVol: number;
  hatVol: number;
  shakerVol: number;
  bassVol: number;
  padVol: number;
  pluckVol: number;
  arpVol: number;
  // Hat noise type
  hatNoiseType: "white" | "pink" | "brown";
  hatDecay: number;
  hatFilterFreq: number;
}

const GENRE_PROFILES: Record<number, GenreProfile> = {
  // 396 Hz — Deep Organic House (grounding, earthy, deep kick, warm bass)
  396: {
    bpm: 118,
    genre: "deep organic house",
    kick: [1, 0, 0, 0, 0.3, 0, 0, 0, 1, 0, 0, 0, 0.3, 0, 0, 0],
    rim:  [0, 0, 0, 0, 1, 0, 0.3, 0, 0, 0, 0, 0, 1, 0, 0, 0.4],
    hat:  [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
    shaker: [0.4, 0.2, 0.6, 0.2, 0.4, 0.2, 0.6, 0.3, 0.4, 0.2, 0.6, 0.2, 0.4, 0.2, 0.7, 0.3],
    bassType: "sawtooth",
    bassFilterFreq: 350,
    bassOctaves: 2,
    padType: "fatsawtooth",
    padFilterFreq: 800,
    padSpread: 40,
    arpType: "sine",
    arpFilterFreq: 1800,
    reverbDecay: 6,
    reverbWet: 0.4,
    delayTime: "8n.",
    delayFeedback: 0.2,
    filterLfoMin: 1200,
    filterLfoMax: 3500,
    filterLfoRate: 0.04,
    kickVol: 0.85,
    rimVol: 0.07,
    hatVol: 0.14,
    shakerVol: 0.05,
    bassVol: 0.4,
    padVol: 0.14,
    pluckVol: 0.12,
    arpVol: 0.06,
    hatNoiseType: "brown",
    hatDecay: 0.06,
    hatFilterFreq: 6000,
  },

  // 417 Hz — Afro House / Tribal (percussive, rhythmic, raw energy)
  417: {
    bpm: 122,
    genre: "afro tribal house",
    kick: [1, 0, 0, 0.4, 0, 0, 0.6, 0, 1, 0, 0, 0.3, 0, 0, 0.5, 0],
    rim:  [0, 0, 0.6, 0, 0, 0.8, 0, 0.4, 0, 0, 0.6, 0, 0.9, 0, 0, 0.5],
    hat:  [0.6, 0.3, 0.8, 0.3, 0.6, 0.3, 0.9, 0.4, 0.6, 0.3, 0.8, 0.3, 0.6, 0.3, 1, 0.5],
    shaker: [0.7, 0.5, 0.9, 0.4, 0.7, 0.5, 0.9, 0.6, 0.7, 0.5, 0.9, 0.4, 0.7, 0.5, 1, 0.6],
    bassType: "triangle",
    bassFilterFreq: 600,
    bassOctaves: 1.5,
    padType: "fatsawtooth",
    padFilterFreq: 1000,
    padSpread: 20,
    arpType: "triangle",
    arpFilterFreq: 2200,
    reverbDecay: 3.5,
    reverbWet: 0.3,
    delayTime: "16n",
    delayFeedback: 0.15,
    filterLfoMin: 2000,
    filterLfoMax: 6000,
    filterLfoRate: 0.08,
    kickVol: 0.9,
    rimVol: 0.12,
    hatVol: 0.2,
    shakerVol: 0.1,
    bassVol: 0.35,
    padVol: 0.08,
    pluckVol: 0.18,
    arpVol: 0.09,
    hatNoiseType: "white",
    hatDecay: 0.03,
    hatFilterFreq: 8000,
  },

  // 528 Hz — Melodic House (lush, warm, euphoric, the love frequency)
  528: {
    bpm: 124,
    genre: "melodic house",
    kick: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    rim:  [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    hat:  [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0.5],
    shaker: [0.3, 0.2, 0.5, 0.2, 0.3, 0.2, 0.5, 0.3, 0.3, 0.2, 0.5, 0.2, 0.3, 0.2, 0.6, 0.3],
    bassType: "sawtooth",
    bassFilterFreq: 500,
    bassOctaves: 2.5,
    padType: "fatsawtooth",
    padFilterFreq: 1400,
    padSpread: 35,
    arpType: "triangle",
    arpFilterFreq: 3000,
    reverbDecay: 5,
    reverbWet: 0.4,
    delayTime: "8n.",
    delayFeedback: 0.3,
    filterLfoMin: 1800,
    filterLfoMax: 5000,
    filterLfoRate: 0.05,
    kickVol: 0.8,
    rimVol: 0.08,
    hatVol: 0.16,
    shakerVol: 0.05,
    bassVol: 0.38,
    padVol: 0.16,
    pluckVol: 0.2,
    arpVol: 0.13,
    hatNoiseType: "white",
    hatDecay: 0.04,
    hatFilterFreq: 9000,
  },

  // 639 Hz — Light Jazz / Lo-fi House (warm, soulful, jazzy chords)
  639: {
    bpm: 108,
    genre: "jazzy lo-fi house",
    kick: [1, 0, 0, 0, 0, 0, 0.5, 0, 0, 0, 1, 0, 0, 0, 0, 0.3],
    rim:  [0, 0, 0, 0.4, 1, 0, 0, 0, 0, 0.3, 0, 0, 1, 0, 0, 0],
    hat:  [0.5, 0, 0.7, 0, 0.5, 0, 0.8, 0.3, 0.5, 0, 0.7, 0, 0.5, 0.3, 0.8, 0],
    shaker: [0.2, 0.1, 0.3, 0.1, 0.2, 0.1, 0.3, 0.2, 0.2, 0.1, 0.3, 0.1, 0.2, 0.1, 0.4, 0.2],
    bassType: "sine",
    bassFilterFreq: 800,
    bassOctaves: 1,
    padType: "sine",
    padFilterFreq: 2000,
    padSpread: 15,
    arpType: "sine",
    arpFilterFreq: 2500,
    reverbDecay: 4,
    reverbWet: 0.45,
    delayTime: "4n",
    delayFeedback: 0.2,
    filterLfoMin: 1500,
    filterLfoMax: 4000,
    filterLfoRate: 0.03,
    kickVol: 0.65,
    rimVol: 0.06,
    hatVol: 0.12,
    shakerVol: 0.04,
    bassVol: 0.3,
    padVol: 0.18,
    pluckVol: 0.22,
    arpVol: 0.15,
    hatNoiseType: "pink",
    hatDecay: 0.05,
    hatFilterFreq: 7000,
  },

  // 741 Hz — Progressive Techno (driving, hypnotic, relentless)
  741: {
    bpm: 130,
    genre: "progressive techno",
    kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    rim:  [0, 0, 0, 0, 0, 0, 0.6, 0, 0, 0, 0, 0.4, 0, 0, 0.8, 0],
    hat:  [1, 0.4, 0.8, 0.4, 1, 0.4, 0.8, 0.5, 1, 0.4, 0.8, 0.4, 1, 0.4, 0.9, 0.5],
    shaker: [0.6, 0.4, 0.8, 0.4, 0.6, 0.4, 0.8, 0.5, 0.6, 0.4, 0.8, 0.4, 0.6, 0.4, 0.9, 0.5],
    bassType: "square",
    bassFilterFreq: 400,
    bassOctaves: 3,
    padType: "fatsquare",
    padFilterFreq: 900,
    padSpread: 25,
    arpType: "sawtooth",
    arpFilterFreq: 2000,
    reverbDecay: 3,
    reverbWet: 0.25,
    delayTime: "16n.",
    delayFeedback: 0.35,
    filterLfoMin: 800,
    filterLfoMax: 4500,
    filterLfoRate: 0.07,
    kickVol: 0.95,
    rimVol: 0.1,
    hatVol: 0.22,
    shakerVol: 0.08,
    bassVol: 0.42,
    padVol: 0.1,
    pluckVol: 0.1,
    arpVol: 0.14,
    hatNoiseType: "white",
    hatDecay: 0.025,
    hatFilterFreq: 10000,
  },

  // 852 Hz — Ambient Electronica / Downtempo (ethereal, spacious, third eye)
  852: {
    bpm: 98,
    genre: "ambient electronica",
    kick: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    rim:  [0, 0, 0, 0, 0, 0, 0, 0.3, 0, 0, 0, 0, 0, 0, 0, 0.2],
    hat:  [0, 0, 0.4, 0, 0, 0, 0.3, 0, 0, 0, 0.5, 0, 0, 0, 0.3, 0],
    shaker: [0.2, 0.1, 0.2, 0.1, 0.3, 0.1, 0.2, 0.1, 0.2, 0.1, 0.2, 0.1, 0.3, 0.1, 0.2, 0.1],
    bassType: "sine",
    bassFilterFreq: 300,
    bassOctaves: 1,
    padType: "fatsawtooth",
    padFilterFreq: 1800,
    padSpread: 50,
    arpType: "sine",
    arpFilterFreq: 3500,
    reverbDecay: 8,
    reverbWet: 0.55,
    delayTime: "4n.",
    delayFeedback: 0.4,
    filterLfoMin: 1000,
    filterLfoMax: 3000,
    filterLfoRate: 0.02,
    kickVol: 0.5,
    rimVol: 0.04,
    hatVol: 0.08,
    shakerVol: 0.03,
    bassVol: 0.25,
    padVol: 0.22,
    pluckVol: 0.18,
    arpVol: 0.12,
    hatNoiseType: "pink",
    hatDecay: 0.08,
    hatFilterFreq: 5000,
  },

  // 963 Hz — Cosmic Trance / Celestial (transcendent, ethereal, crown chakra)
  963: {
    bpm: 136,
    genre: "cosmic trance",
    kick: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0.4],
    rim:  [0, 0, 0, 0, 1, 0, 0, 0.3, 0, 0, 0, 0, 1, 0, 0, 0],
    hat:  [0.7, 0, 0.9, 0, 0.7, 0, 0.9, 0, 0.7, 0, 0.9, 0, 0.7, 0, 1, 0.4],
    shaker: [0.5, 0.3, 0.7, 0.3, 0.5, 0.3, 0.7, 0.4, 0.5, 0.3, 0.7, 0.3, 0.5, 0.3, 0.8, 0.4],
    bassType: "sawtooth",
    bassFilterFreq: 450,
    bassOctaves: 2,
    padType: "fatsawtooth",
    padFilterFreq: 1600,
    padSpread: 45,
    arpType: "triangle",
    arpFilterFreq: 4000,
    reverbDecay: 7,
    reverbWet: 0.5,
    delayTime: "8n",
    delayFeedback: 0.35,
    filterLfoMin: 1500,
    filterLfoMax: 6000,
    filterLfoRate: 0.06,
    kickVol: 0.75,
    rimVol: 0.07,
    hatVol: 0.18,
    shakerVol: 0.06,
    bassVol: 0.35,
    padVol: 0.2,
    pluckVol: 0.15,
    arpVol: 0.16,
    hatNoiseType: "white",
    hatDecay: 0.035,
    hatFilterFreq: 9500,
  },

  // 432 Hz — Calm / Healing Ambient (432 Hz tuning, gentle, flowing)
  432: {
    bpm: 72,
    genre: "healing ambient",
    kick: [0.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.4, 0, 0, 0],
    rim:  [0, 0, 0, 0, 0, 0, 0, 0.2, 0, 0, 0, 0, 0, 0, 0, 0],
    hat:  [0, 0, 0.2, 0, 0, 0, 0, 0, 0, 0, 0.2, 0, 0, 0, 0, 0],
    shaker: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
    bassType: "sine",
    bassFilterFreq: 250,
    bassOctaves: 0.5,
    padType: "fatsawtooth",
    padFilterFreq: 1200,
    padSpread: 60,
    arpType: "sine",
    arpFilterFreq: 2000,
    reverbDecay: 10,
    reverbWet: 0.65,
    delayTime: "4n.",
    delayFeedback: 0.3,
    filterLfoMin: 800,
    filterLfoMax: 2000,
    filterLfoRate: 0.015,
    kickVol: 0.3,
    rimVol: 0.03,
    hatVol: 0.05,
    shakerVol: 0.02,
    bassVol: 0.2,
    padVol: 0.25,
    pluckVol: 0.15,
    arpVol: 0.1,
    hatNoiseType: "pink",
    hatDecay: 0.1,
    hatFilterFreq: 4000,
  },

  // 40 Hz — Focus / Gamma (binaural beats embedded, crisp, minimal, concentration)
  40: {
    bpm: 110,
    genre: "minimal focus",
    kick: [0.7, 0, 0, 0, 0, 0, 0, 0, 0.7, 0, 0, 0, 0, 0, 0, 0],
    rim:  [0, 0, 0, 0, 0.5, 0, 0, 0, 0, 0, 0, 0, 0.5, 0, 0, 0],
    hat:  [0, 0, 0.4, 0, 0, 0, 0.4, 0, 0, 0, 0.4, 0, 0, 0, 0.4, 0],
    shaker: [0.2, 0.15, 0.25, 0.15, 0.2, 0.15, 0.25, 0.15, 0.2, 0.15, 0.25, 0.15, 0.2, 0.15, 0.25, 0.15],
    bassType: "triangle",
    bassFilterFreq: 400,
    bassOctaves: 1,
    padType: "sine",
    padFilterFreq: 1500,
    padSpread: 10,
    arpType: "triangle",
    arpFilterFreq: 3000,
    reverbDecay: 3,
    reverbWet: 0.2,
    delayTime: "8n",
    delayFeedback: 0.15,
    filterLfoMin: 2000,
    filterLfoMax: 5000,
    filterLfoRate: 0.04,
    kickVol: 0.5,
    rimVol: 0.05,
    hatVol: 0.1,
    shakerVol: 0.04,
    bassVol: 0.25,
    padVol: 0.12,
    pluckVol: 0.14,
    arpVol: 0.1,
    hatNoiseType: "white",
    hatDecay: 0.03,
    hatFilterFreq: 8000,
  },

  // 3 Hz — Sleep / Delta (ultra-slow, drone, barely any rhythm)
  3: {
    bpm: 60,
    genre: "sleep drone",
    kick: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    rim:  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    hat:  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    shaker: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    bassType: "sine",
    bassFilterFreq: 200,
    bassOctaves: 0.5,
    padType: "fatsawtooth",
    padFilterFreq: 600,
    padSpread: 70,
    arpType: "sine",
    arpFilterFreq: 1200,
    reverbDecay: 12,
    reverbWet: 0.75,
    delayTime: "2n",
    delayFeedback: 0.4,
    filterLfoMin: 400,
    filterLfoMax: 1200,
    filterLfoRate: 0.008,
    kickVol: 0,
    rimVol: 0,
    hatVol: 0,
    shakerVol: 0,
    bassVol: 0.15,
    padVol: 0.3,
    pluckVol: 0.08,
    arpVol: 0.06,
    hatNoiseType: "brown",
    hatDecay: 0.1,
    hatFilterFreq: 3000,
  },
};

function getProfile(hz: number): GenreProfile {
  return GENRE_PROFILES[hz] || GENRE_PROFILES[528];
}

/* ══════════════════════════════════════════════════════════
   STATE
   ══════════════════════════════════════════════════════════ */
let initialized = false;
let isPlaying = false;
let currentHz = 528;
let currentProfile: GenreProfile = getProfile(528);

/* ── Master chain ────────────────────────────────────────── */
let masterGain: Tone.Gain | null = null;
let reverb: Tone.Reverb | null = null;
let delay: Tone.FeedbackDelay | null = null;
let compressor: Tone.Compressor | null = null;
let masterFilter: Tone.Filter | null = null;
let filterLFO: Tone.LFO | null = null;

/* ── Drums ───────────────────────────────────────────────── */
let kickSynth: Tone.MembraneSynth | null = null;
let kickGain: Tone.Gain | null = null;
let kickSeq: Tone.Sequence | null = null;
let rimSynth: Tone.MetalSynth | null = null;
let rimGain: Tone.Gain | null = null;
let rimSeq: Tone.Sequence | null = null;
let hatSynth: Tone.NoiseSynth | null = null;
let hatGain: Tone.Gain | null = null;
let hatFilter: Tone.Filter | null = null;
let hatSeq: Tone.Sequence | null = null;
let shakerSynth: Tone.NoiseSynth | null = null;
let shakerGain: Tone.Gain | null = null;
let shakerSeq: Tone.Sequence | null = null;

/* ── Bass ────────────────────────────────────────────────── */
let bassSynth: Tone.MonoSynth | null = null;
let bassGain: Tone.Gain | null = null;
let bassSeq: Tone.Sequence | null = null;

/* ── Melodic / Harmonic ──────────────────────────────────── */
let padSynth: Tone.PolySynth | null = null;
let padGain: Tone.Gain | null = null;
let padFilter: Tone.Filter | null = null;
let padLoop: Tone.Loop | null = null;
let pluckSynth: Tone.PluckSynth | null = null;
let pluckGain: Tone.Gain | null = null;
let pluckSeq: Tone.Sequence | null = null;
let arpSynth: Tone.Synth | null = null;
let arpGain: Tone.Gain | null = null;
let arpFilter: Tone.Filter | null = null;
let arpSeq: Tone.Sequence | null = null;

/* ── Solfeggio layer ─────────────────────────────────────── */
let solfeggioSynth: Tone.Synth | null = null;
let binauralOsc: Tone.Oscillator | null = null;

/* ══════════════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════════════ */
export async function startAudio() {
  await Tone.start();
}

/** Build a chord from the solfeggio root — genre-aware intervals */
function getChord(hz: number, profile: GenreProfile): string[] {
  let root = hz;
  while (root > 400) root /= 2;
  while (root < 130) root *= 2;

  // Jazz uses maj7/9 extensions; others use minor
  if (profile.genre.includes("jazz")) {
    const maj3 = root * 1.26;   // major third
    const fifth = root * 1.498;
    const maj7 = root * 1.888;  // major seventh
    const ninth = root * 2.245; // ninth
    return [root, maj3, fifth, maj7, ninth].map(f => Tone.Frequency(f, "hz").toNote());
  }

  // Trance uses suspended/open voicings
  if (profile.genre.includes("trance")) {
    const sus4 = root * 1.335;
    const fifth = root * 1.498;
    const oct = root * 2;
    const sus4up = root * 2.67;
    return [root, sus4, fifth, oct, sus4up].map(f => Tone.Frequency(f, "hz").toNote());
  }

  // Default minor
  const minor3 = root * 1.189;
  const fifth = root * 1.498;
  const oct = root * 2;
  return [root, minor3, fifth, oct].map(f => Tone.Frequency(f, "hz").toNote());
}

/** Bass notes — pattern varies by genre */
function getBassPattern(hz: number, profile: GenreProfile): (string | null)[] {
  let root = hz;
  while (root > 200) root /= 2;
  while (root < 60) root *= 2;
  const r = Tone.Frequency(root, "hz").toNote();
  const fifth = Tone.Frequency(root * 1.498, "hz").toNote();
  const octUp = Tone.Frequency(root * 2, "hz").toNote();
  const fourth = Tone.Frequency(root * 1.335, "hz").toNote();

  if (profile.genre.includes("techno")) {
    // Driving, repetitive, hypnotic
    return [
      r, null, r, null, r, null, r, null,
      r, null, r, null, fifth, null, r, null,
      r, null, r, null, r, null, r, null,
      fourth, null, r, null, r, null, null, null,
    ];
  }

  if (profile.genre.includes("jazz")) {
    // Walking bass feel
    return [
      r, null, null, null, fifth, null, null, null,
      fourth, null, null, r, null, null, null, null,
      r, null, null, null, null, fifth, null, null,
      null, null, fourth, null, null, null, r, null,
    ];
  }

  if (profile.genre.includes("tribal")) {
    // Syncopated, percussive
    return [
      r, null, null, r, null, null, fifth, null,
      null, r, null, null, null, fourth, null, null,
      r, null, null, null, r, null, null, fifth,
      null, null, r, null, fourth, null, null, null,
    ];
  }

  if (profile.genre.includes("ambient") || profile.genre.includes("trance")) {
    // Sparse, sustained
    return [
      r, null, null, null, null, null, null, null,
      null, null, null, null, null, null, null, null,
      fifth, null, null, null, null, null, null, null,
      null, null, null, null, null, null, null, null,
    ];
  }

  // Default organic house
  return [
    r, null, null, r, null, null, null, fifth,
    null, r, null, null, octUp, null, null, null,
    r, null, null, null, fifth, null, r, null,
    null, null, r, null, null, fifth, null, null,
  ];
}

/** Arp melody — genre-specific patterns */
function getArpPattern(hz: number, profile: GenreProfile): (string | null)[] {
  let root = hz;
  while (root > 600) root /= 2;
  while (root < 300) root *= 2;

  const intervals = profile.genre.includes("jazz")
    ? [1, 1.26, 1.498, 1.888, 2]      // maj7 arp
    : profile.genre.includes("trance")
    ? [1, 1.335, 1.498, 2, 2.67]       // sus4 arp
    : [1, 1.189, 1.498, 1.782, 2];     // minor arp

  const notes = intervals.map(i => Tone.Frequency(root * i, "hz").toNote());

  if (profile.genre.includes("techno")) {
    // Fast, relentless 16th note arp
    return [
      notes[0], notes[1], notes[2], notes[3], notes[4], notes[3], notes[2], notes[1],
      notes[0], notes[1], notes[2], notes[4], notes[3], notes[2], notes[1], notes[0],
      notes[2], notes[3], notes[4], notes[3], notes[2], notes[1], notes[0], notes[1],
      notes[2], notes[4], notes[3], notes[1], notes[0], null, null, null,
    ];
  }

  if (profile.genre.includes("trance")) {
    // Classic trance gate pattern
    return [
      notes[0], null, notes[2], null, notes[4], null, notes[2], null,
      notes[0], null, notes[3], null, notes[4], null, null, null,
      notes[0], null, notes[2], null, notes[4], null, notes[3], null,
      notes[2], null, notes[1], null, notes[0], null, null, null,
    ];
  }

  if (profile.genre.includes("jazz")) {
    // Sparse, expressive
    return [
      notes[4], null, null, null, null, null, notes[2], null,
      null, null, null, null, notes[3], null, null, null,
      null, null, notes[1], null, null, null, null, null,
      notes[0], null, null, null, null, null, null, null,
    ];
  }

  if (profile.genre.includes("ambient")) {
    // Very sparse, ethereal
    return [
      notes[4], null, null, null, null, null, null, null,
      null, null, null, null, null, null, notes[2], null,
      null, null, null, null, null, null, null, null,
      null, null, null, null, notes[0], null, null, null,
    ];
  }

  // Default melodic house — dreamy
  return [
    notes[0], null, null, null, notes[2], null, null, null,
    null, null, notes[4], null, null, notes[3], null, null,
    notes[1], null, null, null, null, null, notes[0], null,
    null, notes[2], null, null, null, null, null, null,
  ];
}

/** Pluck pattern */
function getPluckPattern(hz: number, profile: GenreProfile): (string | null)[] {
  let root = hz;
  while (root > 500) root /= 2;
  while (root < 250) root *= 2;
  const n = [root, root * 1.189, root * 1.498, root * 2].map(f =>
    Tone.Frequency(f, "hz").toNote()
  );

  if (profile.genre.includes("jazz")) {
    // Jazzy Rhodes-like hits
    return [
      null, null, n[2], null, null, null, null, n[0],
      null, null, null, null, n[3], null, null, null,
      null, n[1], null, null, null, null, null, null,
      n[0], null, null, null, null, null, n[2], null,
    ];
  }

  if (profile.genre.includes("techno")) {
    // Almost no pluck — let the arp dominate
    return [
      null, null, null, null, null, null, null, null,
      null, null, null, null, n[0], null, null, null,
      null, null, null, null, null, null, null, null,
      null, null, null, null, null, null, null, null,
    ];
  }

  // Default
  return [
    null, null, n[0], null, null, null, null, null,
    n[2], null, null, null, null, null, n[1], null,
    null, null, null, null, n[3], null, null, null,
    null, null, null, n[0], null, null, null, null,
  ];
}

/* ══════════════════════════════════════════════════════════
   INIT — teardown everything and rebuild for a new profile
   ══════════════════════════════════════════════════════════ */
function buildEngine(profile: GenreProfile) {
  // Full cleanup if previously built
  if (initialized) {
    disposeAll();
  }

  const transport = Tone.getTransport();
  transport.bpm.value = profile.bpm;

  // ── Master chain ──
  reverb = new Tone.Reverb({ decay: profile.reverbDecay, wet: profile.reverbWet }).toDestination();
  delay = new Tone.FeedbackDelay({
    delayTime: profile.delayTime as any,
    feedback: profile.delayFeedback,
    wet: 0.2,
  }).connect(reverb);
  compressor = new Tone.Compressor({ threshold: -14, ratio: 3, attack: 0.005, release: 0.15 }).connect(reverb);
  masterFilter = new Tone.Filter({ frequency: 3000, type: "lowpass", rolloff: -12 }).connect(compressor);
  masterGain = new Tone.Gain(0).connect(masterFilter);

  filterLFO = new Tone.LFO({
    frequency: profile.filterLfoRate,
    min: profile.filterLfoMin,
    max: profile.filterLfoMax,
  }).connect(masterFilter.frequency);

  // ── KICK ──
  const kickPitch = profile.genre.includes("techno") ? 0.08 : 0.06;
  kickGain = new Tone.Gain(profile.kickVol).connect(compressor);
  kickSynth = new Tone.MembraneSynth({
    pitchDecay: kickPitch,
    octaves: profile.genre.includes("techno") ? 6 : 5,
    oscillator: { type: "sine" },
    envelope: {
      attack: 0.002,
      decay: profile.genre.includes("techno") ? 0.3 : 0.4,
      sustain: 0,
      release: profile.genre.includes("techno") ? 0.3 : 0.5,
    },
  }).connect(kickGain);

  kickSeq = new Tone.Sequence(
    (time, vel) => {
      if (vel > 0) kickSynth!.triggerAttackRelease("C1", "8n", time, vel);
    },
    profile.kick,
    "16n"
  );

  // ── RIM / CLAP ──
  rimGain = new Tone.Gain(profile.rimVol).connect(masterGain);
  rimSynth = new Tone.MetalSynth({
    envelope: { attack: 0.001, decay: 0.12, release: 0.05 },
    harmonicity: profile.genre.includes("tribal") ? 0.3 : 0.1,
    modulationIndex: profile.genre.includes("tribal") ? 12 : 8,
    resonance: 2000,
    octaves: 0.5,
  } as any).connect(rimGain);

  rimSeq = new Tone.Sequence(
    (time, vel) => {
      if (vel > 0) rimSynth!.triggerAttackRelease("16n", time, vel);
    },
    profile.rim,
    "16n"
  );

  // ── HI-HATS ──
  hatFilter = new Tone.Filter({
    frequency: profile.hatFilterFreq,
    type: "highpass",
  });
  hatGain = new Tone.Gain(profile.hatVol).connect(masterGain);
  hatFilter.connect(hatGain);
  hatSynth = new Tone.NoiseSynth({
    noise: { type: profile.hatNoiseType },
    envelope: { attack: 0.001, decay: profile.hatDecay, sustain: 0, release: 0.02 },
  }).connect(hatFilter);

  hatSeq = new Tone.Sequence(
    (time, vel) => {
      if (vel > 0) hatSynth!.triggerAttackRelease("32n", time);
    },
    profile.hat,
    "16n"
  );

  // ── SHAKER ──
  shakerGain = new Tone.Gain(profile.shakerVol).connect(masterGain);
  shakerSynth = new Tone.NoiseSynth({
    noise: { type: "pink" },
    envelope: { attack: 0.001, decay: 0.025, sustain: 0, release: 0.015 },
  }).connect(
    new Tone.Filter({ frequency: 6000, type: "bandpass", Q: 2 }).connect(shakerGain)
  );

  shakerSeq = new Tone.Sequence(
    (time, vel) => {
      if (vel > 0) shakerSynth!.triggerAttackRelease("32n", time);
    },
    profile.shaker,
    "16n"
  );

  // ── BASS ──
  bassGain = new Tone.Gain(profile.bassVol).connect(masterGain);
  bassSynth = new Tone.MonoSynth({
    oscillator: { type: profile.bassType },
    filter: { Q: 3, frequency: profile.bassFilterFreq, type: "lowpass", rolloff: -24 },
    envelope: { attack: 0.01, decay: 0.15, sustain: 0.7, release: 0.2 },
    filterEnvelope: {
      attack: 0.04, decay: 0.15, sustain: 0.2, release: 0.15,
      baseFrequency: 150, octaves: profile.bassOctaves,
    },
  }).connect(bassGain);

  bassSeq = new Tone.Sequence(
    (time, note) => {
      if (note) bassSynth!.triggerAttackRelease(note, "16n", time, 0.8);
    },
    getBassPattern(currentHz, profile),
    "16n"
  );

  // ── PAD ──
  padFilter = new Tone.Filter({
    frequency: profile.padFilterFreq,
    type: "lowpass",
    rolloff: -24,
  });
  padGain = new Tone.Gain(profile.padVol).connect(delay!);
  padFilter.connect(padGain);
  padSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: profile.padType as any, spread: profile.padSpread, count: 3 } as any,
    envelope: { attack: 2.5, decay: 3, sustain: 0.4, release: 5 },
  } as any).connect(padFilter);

  padLoop = new Tone.Loop((time) => {
    const chord = getChord(currentHz, profile);
    padSynth!.triggerAttackRelease(chord, "2m", time, 0.25);
  }, "2m");

  // ── PLUCK ──
  pluckGain = new Tone.Gain(profile.pluckVol).connect(delay!);
  pluckSynth = new Tone.PluckSynth({
    attackNoise: profile.genre.includes("jazz") ? 2 : 1.5,
    dampening: profile.genre.includes("jazz") ? 4000 : 3000,
    resonance: 0.92,
  }).connect(pluckGain);

  pluckSeq = new Tone.Sequence(
    (time, note) => {
      if (note) pluckSynth!.triggerAttack(note, time);
    },
    getPluckPattern(currentHz, profile),
    "16n"
  );

  // ── ARP ──
  arpFilter = new Tone.Filter({
    frequency: profile.arpFilterFreq,
    type: "lowpass",
  });
  arpGain = new Tone.Gain(profile.arpVol).connect(delay!);
  arpFilter.connect(arpGain);
  arpSynth = new Tone.Synth({
    oscillator: { type: profile.arpType },
    envelope: {
      attack: profile.genre.includes("trance") ? 0.005 : 0.02,
      decay: profile.genre.includes("trance") ? 0.2 : 0.3,
      sustain: 0.1,
      release: profile.genre.includes("ambient") ? 1.5 : 0.8,
    },
  }).connect(arpFilter);

  arpSeq = new Tone.Sequence(
    (time, note) => {
      if (note) arpSynth!.triggerAttackRelease(note, "8n", time, 0.6);
    },
    getArpPattern(currentHz, profile),
    "16n"
  );

  // ── SOLFEGGIO — subtle sine undertone ──
  solfeggioSynth = new Tone.Synth({
    oscillator: { type: "sine" },
    envelope: { attack: 5, decay: 0, sustain: 1, release: 6 },
  }).connect(new Tone.Gain(0.06).connect(masterGain));

  initialized = true;
  currentProfile = profile;
}

/* ══════════════════════════════════════════════════════════
   PLAY
   ══════════════════════════════════════════════════════════ */
export function play(hz: number, binauralOffset = 4) {
  currentHz = hz;
  const profile = getProfile(hz);

  // Always rebuild when frequency changes — completely different instrument
  buildEngine(profile);

  const transport = Tone.getTransport();
  transport.stop();
  transport.cancel();

  // Rebuild melodic sequences with correct hz
  bassSeq?.dispose();
  bassSeq = new Tone.Sequence(
    (time, note) => {
      if (note) bassSynth!.triggerAttackRelease(note, "16n", time, 0.8);
    },
    getBassPattern(hz, profile),
    "16n"
  );

  pluckSeq?.dispose();
  pluckSeq = new Tone.Sequence(
    (time, note) => {
      if (note) pluckSynth!.triggerAttack(note, time);
    },
    getPluckPattern(hz, profile),
    "16n"
  );

  arpSeq?.dispose();
  arpSeq = new Tone.Sequence(
    (time, note) => {
      if (note) arpSynth!.triggerAttackRelease(note, "8n", time, 0.6);
    },
    getArpPattern(hz, profile),
    "16n"
  );

  // Fade in master
  masterGain!.gain.cancelScheduledValues(Tone.now());
  masterGain!.gain.setValueAtTime(0, Tone.now());
  masterGain!.gain.rampTo(0.5, 2);

  // Solfeggio undertone — for very low hz (Focus/Sleep), use binaural method instead
  // For Focus (40 Hz gamma): play 200 Hz + 240 Hz to create 40 Hz binaural beat
  // For Sleep (3 Hz delta): play 150 Hz + 153 Hz to create 3 Hz binaural beat
  // For solfeggio frequencies: play the actual hz as subtle undertone
  const isLowHz = hz < 100;
  const baseFreq = isLowHz ? (hz < 10 ? 150 : 200) : hz;

  solfeggioSynth!.triggerAttack(baseFreq);

  // Binaural beat
  if (binauralOsc) {
    binauralOsc.stop();
    binauralOsc.dispose();
    binauralOsc = null;
  }
  const binauralFreq = isLowHz ? baseFreq + hz : hz + binauralOffset;
  binauralOsc = new Tone.Oscillator({
    frequency: binauralFreq,
    type: "sine",
  }).connect(new Tone.Gain(isLowHz ? 0.06 : 0.04).connect(reverb!));
  binauralOsc.start();

  // Start all sequences
  kickSeq!.start(0);
  rimSeq!.start(0);
  hatSeq!.start(0);
  shakerSeq!.start(0);
  bassSeq!.start(0);
  padLoop!.start(0);
  pluckSeq!.start(0);
  arpSeq!.start(0);
  filterLFO!.start();

  transport.start();
  isPlaying = true;
}

/* ══════════════════════════════════════════════════════════
   STOP
   ══════════════════════════════════════════════════════════ */
export function stop() {
  if (!isPlaying) return;
  isPlaying = false;

  const transport = Tone.getTransport();

  masterGain?.gain.cancelScheduledValues(Tone.now());
  masterGain?.gain.rampTo(0, 0.15);

  solfeggioSynth?.triggerRelease();
  padSynth?.releaseAll();

  if (binauralOsc) {
    binauralOsc.stop();
    binauralOsc.dispose();
    binauralOsc = null;
  }

  transport.stop();
  transport.cancel();
  kickSeq?.stop();
  rimSeq?.stop();
  hatSeq?.stop();
  shakerSeq?.stop();
  bassSeq?.stop();
  padLoop?.stop();
  pluckSeq?.stop();
  arpSeq?.stop();
  filterLFO?.stop();
}

/* ── Volume (0-1) ──────────────────────────────────────── */
export function setVolume(vol: number) {
  if (masterGain && isPlaying) {
    masterGain.gain.rampTo(vol * 0.6, 0.3);
  }
}

export function getIsPlaying() {
  return isPlaying;
}

/* ── initEngine (backward compat) ──────────────────────── */
export function initEngine() {
  if (!initialized) {
    buildEngine(getProfile(528));
  }
}

/* ── Full cleanup ──────────────────────────────────────── */
function disposeAll() {
  const transport = Tone.getTransport();
  transport.stop();
  transport.cancel();

  const nodes = [
    solfeggioSynth, binauralOsc,
    kickSynth, kickSeq, kickGain,
    rimSynth, rimSeq, rimGain,
    hatSynth, hatSeq, hatGain, hatFilter,
    shakerSynth, shakerSeq, shakerGain,
    bassSynth, bassSeq, bassGain,
    padSynth, padLoop, padGain, padFilter,
    pluckSynth, pluckSeq, pluckGain,
    arpSynth, arpSeq, arpGain, arpFilter,
    reverb, delay, compressor, masterFilter, filterLFO, masterGain,
  ];
  nodes.forEach(n => { try { n?.dispose(); } catch {} });

  solfeggioSynth = null; binauralOsc = null;
  kickSynth = null; kickSeq = null; kickGain = null;
  rimSynth = null; rimSeq = null; rimGain = null;
  hatSynth = null; hatSeq = null; hatGain = null; hatFilter = null;
  shakerSynth = null; shakerSeq = null; shakerGain = null;
  bassSynth = null; bassSeq = null; bassGain = null;
  padSynth = null; padLoop = null; padGain = null; padFilter = null;
  pluckSynth = null; pluckSeq = null; pluckGain = null;
  arpSynth = null; arpSeq = null; arpGain = null; arpFilter = null;
  reverb = null; delay = null; compressor = null;
  masterFilter = null; filterLFO = null; masterGain = null;

  initialized = false;
  isPlaying = false;
}

export function dispose() {
  stop();
  disposeAll();
}
