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
];

/* ── Nodes ─────────────────────────────────────────────── */
let masterGain: Tone.Gain | null = null;
let reverb: Tone.Reverb | null = null;
let compressor: Tone.Compressor | null = null;
let filter: Tone.Filter | null = null;
let filterLFO: Tone.LFO | null = null;

// Solfeggio pad
let solfeggioSynth: Tone.Synth | null = null;
let binauralOsc: Tone.Oscillator | null = null;

// Kick
let kickSynth: Tone.MembraneSynth | null = null;
let kickSeq: Tone.Sequence | null = null;

// Hi-hats / shaker
let hatSynth: Tone.NoiseSynth | null = null;
let hatSeq: Tone.Sequence | null = null;

// Bass
let bassSynth: Tone.MonoSynth | null = null;
let bassSeq: Tone.Sequence | null = null;

// Pad chord
let padSynth: Tone.PolySynth | null = null;
let padLoop: Tone.Loop | null = null;

let initialized = false;
let isPlaying = false;
let currentHz = 528;

const BPM = 121;

/* ── Initialize ────────────────────────────────────────── */
export async function startAudio() {
  await Tone.start();
}

function getChordFromHz(hz: number): number[] {
  // Build a minor-ish organic chord rooted on the solfeggio frequency (down an octave)
  const root = hz / 2;
  return [root, root * 1.2, root * 1.5, root * 1.8];
}

function getBassNotes(hz: number): (string | null)[] {
  // Simple 2-bar bass pattern rooted on solfeggio / 4
  const rootNote = Tone.Frequency(hz / 4, "hz").toNote();
  const fifthNote = Tone.Frequency((hz / 4) * 1.5, "hz").toNote();
  return [
    rootNote, null, null, rootNote,
    null, null, fifthNote, null,
    rootNote, null, rootNote, null,
    null, fifthNote, null, null,
  ];
}

export function initEngine() {
  if (initialized) return;

  Tone.getTransport().bpm.value = BPM;

  // Master chain: compressor → reverb → destination
  reverb = new Tone.Reverb({ decay: 6, wet: 0.45 }).toDestination();
  compressor = new Tone.Compressor({ threshold: -18, ratio: 4, attack: 0.01, release: 0.2 }).connect(reverb);
  filter = new Tone.Filter({ frequency: 2200, type: "lowpass", rolloff: -24 }).connect(compressor);
  masterGain = new Tone.Gain(0).connect(filter);

  // Filter LFO for organic movement
  filterLFO = new Tone.LFO({ frequency: 0.07, min: 1200, max: 3400 }).connect(filter.frequency);

  /* ── Kick ──────────────────────────────────────────── */
  kickSynth = new Tone.MembraneSynth({
    pitchDecay: 0.05,
    octaves: 6,
    oscillator: { type: "sine" },
    envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.4 },
  }).connect(new Tone.Gain(0.7).connect(compressor));

  // 4-on-the-floor with slight ghost hits
  kickSeq = new Tone.Sequence(
    (time, vel) => {
      if (vel > 0) kickSynth!.triggerAttackRelease("C1", "8n", time, vel);
    },
    [1, null, null, null, 0.4, null, null, null, 1, null, null, null, 0.4, null, null, 0.3],
    "16n"
  );

  /* ── Hi-hats / Shaker ─────────────────────────────── */
  hatSynth = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.002, decay: 0.06, sustain: 0, release: 0.03 },
  }).connect(
    new Tone.Filter({ frequency: 8000, type: "highpass" }).connect(
      new Tone.Gain(0.12).connect(masterGain)
    )
  );

  // Offbeat organic shaker pattern
  hatSeq = new Tone.Sequence(
    (time, vel) => {
      if (vel > 0) hatSynth!.triggerAttackRelease("16n", time);
    },
    [0, 0, 0.6, 0, 0, 0.3, 0.8, 0, 0, 0, 0.6, 0.4, 0, 0.3, 0.7, 0],
    "16n"
  );

  /* ── Bass ──────────────────────────────────────────── */
  bassSynth = new Tone.MonoSynth({
    oscillator: { type: "sawtooth" },
    filter: { Q: 2, frequency: 600, type: "lowpass", rolloff: -24 },
    envelope: { attack: 0.05, decay: 0.2, sustain: 0.6, release: 0.3 },
    filterEnvelope: { attack: 0.06, decay: 0.2, sustain: 0.3, release: 0.2, baseFrequency: 200, octaves: 2 },
  }).connect(new Tone.Gain(0.3).connect(compressor));

  bassSeq = new Tone.Sequence(
    (time, note) => {
      if (note) bassSynth!.triggerAttackRelease(note, "8n", time, 0.7);
    },
    getBassNotes(currentHz),
    "16n"
  );

  /* ── Solfeggio Pad Tone ────────────────────────────── */
  solfeggioSynth = new Tone.Synth({
    oscillator: { type: "sine" },
    envelope: { attack: 4, decay: 0, sustain: 1, release: 5 },
  }).connect(new Tone.Gain(0.25).connect(masterGain));

  /* ── Ambient Chord Pad ─────────────────────────────── */
  padSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "triangle" } as any,
    envelope: { attack: 3, decay: 2, sustain: 0.5, release: 4 },
  } as any).connect(new Tone.Gain(0.1).connect(masterGain));

  padLoop = new Tone.Loop((time) => {
    padSynth!.triggerAttackRelease(
      getChordFromHz(currentHz).map((f) => Tone.Frequency(f, "hz").toNote()),
      "2m",
      time,
      0.3
    );
  }, "2m");

  initialized = true;
}

/* ── Play ──────────────────────────────────────────────── */
export function play(hz: number, binauralOffset = 4) {
  if (!initialized) initEngine();
  currentHz = hz;

  // Update bass pattern
  if (bassSeq) {
    bassSeq.dispose();
    bassSeq = new Tone.Sequence(
      (time, note) => {
        if (note) bassSynth!.triggerAttackRelease(note, "8n", time, 0.7);
      },
      getBassNotes(hz),
      "16n"
    );
    bassSeq.start(0);
  }

  // Fade in master
  masterGain!.gain.rampTo(0.4, 3);

  // Start solfeggio tone
  solfeggioSynth!.triggerAttack(hz);

  // Binaural offset tone
  if (binauralOsc) {
    binauralOsc.stop();
    binauralOsc.dispose();
  }
  binauralOsc = new Tone.Oscillator({
    frequency: hz + binauralOffset,
    type: "sine",
  }).connect(new Tone.Gain(0.12).connect(reverb!));
  binauralOsc.start();

  // Start sequences
  kickSeq!.start(0);
  hatSeq!.start(0);
  padLoop!.start(0);

  filterLFO!.start();
  Tone.getTransport().start();

  isPlaying = true;
}

/* ── Stop ──────────────────────────────────────────────── */
export function stop() {
  if (!isPlaying) return;

  masterGain?.gain.rampTo(0, 3);
  solfeggioSynth?.triggerRelease();
  padSynth?.releaseAll();

  // Let the fade happen before stopping transport
  setTimeout(() => {
    Tone.getTransport().stop();
    kickSeq?.stop();
    hatSeq?.stop();
    bassSeq?.stop();
    padLoop?.stop();
    filterLFO?.stop();

    binauralOsc?.stop();
    binauralOsc?.dispose();
    binauralOsc = null;
  }, 3200);

  isPlaying = false;
}

/* ── Volume (0-1) ──────────────────────────────────────── */
export function setVolume(vol: number) {
  masterGain?.gain.rampTo(vol * 0.5, 0.5);
}

export function getIsPlaying() {
  return isPlaying;
}

/* ── Cleanup ───────────────────────────────────────────── */
export function dispose() {
  stop();
  setTimeout(() => {
    Tone.getTransport().cancel();
    solfeggioSynth?.dispose();
    binauralOsc?.dispose();
    kickSynth?.dispose();
    kickSeq?.dispose();
    hatSynth?.dispose();
    hatSeq?.dispose();
    bassSynth?.dispose();
    bassSeq?.dispose();
    padSynth?.dispose();
    padLoop?.dispose();
    reverb?.dispose();
    compressor?.dispose();
    filter?.dispose();
    filterLFO?.dispose();
    masterGain?.dispose();

    solfeggioSynth = null;
    binauralOsc = null;
    kickSynth = null;
    kickSeq = null;
    hatSynth = null;
    hatSeq = null;
    bassSynth = null;
    bassSeq = null;
    padSynth = null;
    padLoop = null;
    reverb = null;
    compressor = null;
    filter = null;
    filterLFO = null;
    masterGain = null;
    initialized = false;
    isPlaying = false;
  }, 3500);
}
