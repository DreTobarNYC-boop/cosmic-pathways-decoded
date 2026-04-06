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

/* ══════════════════════════════════════════════════════════
   STATE
   ══════════════════════════════════════════════════════════ */
let initialized = false;
let isPlaying = false;
let currentHz = 528;
const BPM = 121;

/* ── Master chain ────────────────────────────────────────── */
let masterGain: Tone.Gain | null = null;
let reverb: Tone.Reverb | null = null;
let delay: Tone.FeedbackDelay | null = null;
let compressor: Tone.Compressor | null = null;
let masterFilter: Tone.Filter | null = null;
let filterLFO: Tone.LFO | null = null;

/* ── Drums ───────────────────────────────────────────────── */
let kickSynth: Tone.MembraneSynth | null = null;
let kickSeq: Tone.Sequence | null = null;
let rimSynth: Tone.MetalSynth | null = null;
let rimSeq: Tone.Sequence | null = null;
let hatSynth: Tone.NoiseSynth | null = null;
let hatSeq: Tone.Sequence | null = null;
let shakerSynth: Tone.NoiseSynth | null = null;
let shakerSeq: Tone.Sequence | null = null;

/* ── Bass ────────────────────────────────────────────────── */
let bassSynth: Tone.MonoSynth | null = null;
let bassSeq: Tone.Sequence | null = null;

/* ── Melodic / Harmonic ──────────────────────────────────── */
let padSynth: Tone.PolySynth | null = null;
let padLoop: Tone.Loop | null = null;
let pluckSynth: Tone.PluckSynth | null = null;
let pluckSeq: Tone.Sequence | null = null;
let arpSynth: Tone.Synth | null = null;
let arpSeq: Tone.Sequence | null = null;

/* ── Solfeggio layer (subtle) ────────────────────────────── */
let solfeggioSynth: Tone.Synth | null = null;
let binauralOsc: Tone.Oscillator | null = null;

/* ══════════════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════════════ */
export async function startAudio() {
  await Tone.start();
}

/** Build a minor chord from the solfeggio root (lowered to musical range) */
function getChord(hz: number): string[] {
  // Bring to ~200-400 Hz range
  let root = hz;
  while (root > 400) root /= 2;
  while (root < 130) root *= 2;
  const minor3 = root * 1.189; // minor third
  const fifth = root * 1.498;  // perfect fifth
  const oct = root * 2;
  return [root, minor3, fifth, oct].map((f) => Tone.Frequency(f, "hz").toNote());
}

/** Bass notes — groovy pattern rooted on the solfeggio */
function getBassPattern(hz: number): (string | null)[] {
  let root = hz;
  while (root > 200) root /= 2;
  while (root < 60) root *= 2;
  const r = Tone.Frequency(root, "hz").toNote();
  const fifth = Tone.Frequency(root * 1.498, "hz").toNote();
  const octUp = Tone.Frequency(root * 2, "hz").toNote();
  // Syncopated organic house bass — 2 bars of 16ths
  return [
    r,    null, null, r,    null, null, null, fifth,
    null, r,    null, null, octUp,null, null, null,
    r,    null, null, null, fifth,null, r,    null,
    null, null, r,    null, null, fifth,null, null,
  ];
}

/** Arp melody notes derived from solfeggio */
function getArpPattern(hz: number): (string | null)[] {
  let root = hz;
  while (root > 600) root /= 2;
  while (root < 300) root *= 2;
  const notes = [
    root,
    root * 1.189,  // min 3rd
    root * 1.498,  // 5th
    root * 1.782,  // min 7th
    root * 2,      // octave
  ].map((f) => Tone.Frequency(f, "hz").toNote());
  // Sparse, dreamy pattern
  return [
    notes[0], null, null, null, notes[2], null, null, null,
    null,     null, notes[4], null, null, notes[3], null, null,
    notes[1], null, null, null, null, null, notes[0], null,
    null,     notes[2], null, null, null, null, null, null,
  ];
}

/** Pluck pattern — sporadic organic hits */
function getPluckPattern(hz: number): (string | null)[] {
  let root = hz;
  while (root > 500) root /= 2;
  while (root < 250) root *= 2;
  const n = [root, root * 1.189, root * 1.498, root * 2].map((f) =>
    Tone.Frequency(f, "hz").toNote()
  );
  return [
    null, null, n[0], null, null, null, null, null,
    n[2], null, null, null, null, null, n[1], null,
    null, null, null, null, n[3], null, null, null,
    null, null, null, n[0], null, null, null, null,
  ];
}

/* ══════════════════════════════════════════════════════════
   INIT — build the entire signal graph once
   ══════════════════════════════════════════════════════════ */
export function initEngine() {
  if (initialized) return;

  const transport = Tone.getTransport();
  transport.bpm.value = BPM;

  // ── Master chain ──
  reverb = new Tone.Reverb({ decay: 5, wet: 0.35 }).toDestination();
  delay = new Tone.FeedbackDelay({ delayTime: "8n.", feedback: 0.25, wet: 0.2 }).connect(reverb);
  compressor = new Tone.Compressor({ threshold: -14, ratio: 3, attack: 0.005, release: 0.15 }).connect(reverb);
  masterFilter = new Tone.Filter({ frequency: 3000, type: "lowpass", rolloff: -12 }).connect(compressor);
  masterGain = new Tone.Gain(0).connect(masterFilter);

  // Slow filter sweep for organic movement
  filterLFO = new Tone.LFO({ frequency: 0.05, min: 1800, max: 5000 }).connect(masterFilter.frequency);

  // ── KICK — warm, deep, punchy ──
  kickSynth = new Tone.MembraneSynth({
    pitchDecay: 0.06,
    octaves: 5,
    oscillator: { type: "sine" },
    envelope: { attack: 0.002, decay: 0.4, sustain: 0, release: 0.5 },
  }).connect(new Tone.Gain(0.8).connect(compressor));

  kickSeq = new Tone.Sequence(
    (time, vel) => {
      if (vel > 0) kickSynth!.triggerAttackRelease("C1", "8n", time, vel);
    },
    // Solid 4-on-the-floor + ghost on the "and" of 2 and 4
    [1, 0, 0, 0, 0.3, 0, 0, 0, 1, 0, 0, 0, 0.3, 0, 0, 0],
    "16n"
  );

  // ── RIM / CLAP — organic perc on beats 2 and 4 ──
  rimSynth = new Tone.MetalSynth({
    frequency: 300,
    envelope: { attack: 0.001, decay: 0.12, release: 0.05 },
    harmonicity: 0.1,
    modulationIndex: 8,
    resonance: 2000,
    octaves: 0.5,
  }).connect(new Tone.Gain(0.08).connect(masterGain));

  rimSeq = new Tone.Sequence(
    (time, vel) => {
      if (vel > 0) rimSynth!.triggerAttackRelease("16n", time, vel);
    },
    [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0.4],
    "16n"
  );

  // ── HI-HATS — crisp, offbeat ──
  hatSynth = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.001, decay: 0.04, sustain: 0, release: 0.02 },
  }).connect(
    new Tone.Filter({ frequency: 9000, type: "highpass" }).connect(
      new Tone.Gain(0.18).connect(masterGain)
    )
  );

  hatSeq = new Tone.Sequence(
    (time, vel) => {
      if (vel > 0) hatSynth!.triggerAttackRelease("32n", time);
    },
    // Classic offbeat hats
    [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
    "16n"
  );

  // ── SHAKER — 16th note groove ──
  shakerSynth = new Tone.NoiseSynth({
    noise: { type: "pink" },
    envelope: { attack: 0.001, decay: 0.025, sustain: 0, release: 0.015 },
  }).connect(
    new Tone.Filter({ frequency: 6000, type: "bandpass", Q: 2 }).connect(
      new Tone.Gain(0.06).connect(masterGain)
    )
  );

  shakerSeq = new Tone.Sequence(
    (time, vel) => {
      if (vel > 0) {
        // Humanize velocity slightly
        const v = vel * (0.85 + Math.random() * 0.3);
        shakerSynth!.triggerAttackRelease("32n", time);
      }
    },
    [0.5, 0.3, 0.7, 0.3, 0.5, 0.3, 0.7, 0.4, 0.5, 0.3, 0.7, 0.3, 0.5, 0.3, 0.8, 0.4],
    "16n"
  );

  // ── BASS — warm filtered saw ──
  bassSynth = new Tone.MonoSynth({
    oscillator: { type: "sawtooth" },
    filter: { Q: 3, frequency: 500, type: "lowpass", rolloff: -24 },
    envelope: { attack: 0.01, decay: 0.15, sustain: 0.7, release: 0.2 },
    filterEnvelope: {
      attack: 0.04, decay: 0.15, sustain: 0.2, release: 0.15,
      baseFrequency: 150, octaves: 2.5,
    },
  }).connect(new Tone.Gain(0.35).connect(masterGain));

  bassSeq = new Tone.Sequence(
    (time, note) => {
      if (note) bassSynth!.triggerAttackRelease(note, "16n", time, 0.8);
    },
    getBassPattern(currentHz),
    "16n"
  );

  // ── PAD — lush evolving chord ──
  padSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "fatsawtooth", spread: 30, count: 3 } as any,
    envelope: { attack: 2.5, decay: 3, sustain: 0.4, release: 5 },
  } as any).connect(
    new Tone.Filter({ frequency: 1200, type: "lowpass", rolloff: -24 }).connect(
      new Tone.Gain(0.12).connect(delay!)
    )
  );

  padLoop = new Tone.Loop((time) => {
    const chord = getChord(currentHz);
    padSynth!.triggerAttackRelease(chord, "2m", time, 0.25);
  }, "2m");

  // ── PLUCK — sporadic organic melodic hits ──
  pluckSynth = new Tone.PluckSynth({
    attackNoise: 1.5,
    dampening: 3000,
    resonance: 0.92,
  }).connect(new Tone.Gain(0.2).connect(delay!));

  pluckSeq = new Tone.Sequence(
    (time, note) => {
      if (note) pluckSynth!.triggerAttack(note, time);
    },
    getPluckPattern(currentHz),
    "16n"
  );

  // ── ARP — dreamy synth melody ──
  arpSynth = new Tone.Synth({
    oscillator: { type: "triangle" },
    envelope: { attack: 0.02, decay: 0.3, sustain: 0.1, release: 0.8 },
  }).connect(
    new Tone.Filter({ frequency: 2500, type: "lowpass" }).connect(
      new Tone.Gain(0.1).connect(delay!)
    )
  );

  arpSeq = new Tone.Sequence(
    (time, note) => {
      if (note) arpSynth!.triggerAttackRelease(note, "8n", time, 0.6);
    },
    getArpPattern(currentHz),
    "16n"
  );

  // ── SOLFEGGIO — very subtle underlying sine ──
  solfeggioSynth = new Tone.Synth({
    oscillator: { type: "sine" },
    envelope: { attack: 5, decay: 0, sustain: 1, release: 6 },
  }).connect(new Tone.Gain(0.06).connect(masterGain));

  initialized = true;
}

/* ══════════════════════════════════════════════════════════
   PLAY
   ══════════════════════════════════════════════════════════ */
export function play(hz: number, binauralOffset = 4) {
  if (!initialized) initEngine();
  currentHz = hz;

  const transport = Tone.getTransport();

  // Stop transport cleanly first if it was running
  transport.stop();
  transport.cancel();

  // Rebuild melodic sequences for the new frequency
  bassSeq?.dispose();
  bassSeq = new Tone.Sequence(
    (time, note) => {
      if (note) bassSynth!.triggerAttackRelease(note, "16n", time, 0.8);
    },
    getBassPattern(hz),
    "16n"
  );

  pluckSeq?.dispose();
  pluckSeq = new Tone.Sequence(
    (time, note) => {
      if (note) pluckSynth!.triggerAttack(note, time);
    },
    getPluckPattern(hz),
    "16n"
  );

  arpSeq?.dispose();
  arpSeq = new Tone.Sequence(
    (time, note) => {
      if (note) arpSynth!.triggerAttackRelease(note, "8n", time, 0.6);
    },
    getArpPattern(hz),
    "16n"
  );

  // Fade in master
  masterGain!.gain.cancelScheduledValues(Tone.now());
  masterGain!.gain.setValueAtTime(0, Tone.now());
  masterGain!.gain.rampTo(0.5, 2);

  // Solfeggio undertone
  solfeggioSynth!.triggerAttack(hz);

  // Binaural beat — very subtle
  if (binauralOsc) {
    binauralOsc.stop();
    binauralOsc.dispose();
    binauralOsc = null;
  }
  binauralOsc = new Tone.Oscillator({
    frequency: hz + binauralOffset,
    type: "sine",
  }).connect(new Tone.Gain(0.04).connect(reverb!));
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
   STOP — immediate, no lingering audio
   ══════════════════════════════════════════════════════════ */
export function stop() {
  if (!isPlaying) return;
  isPlaying = false;

  const transport = Tone.getTransport();

  // Kill master volume immediately (short fade to avoid click)
  masterGain?.gain.cancelScheduledValues(Tone.now());
  masterGain?.gain.rampTo(0, 0.15);

  // Release held notes
  solfeggioSynth?.triggerRelease();
  padSynth?.releaseAll();

  // Stop binaural immediately
  if (binauralOsc) {
    binauralOsc.stop();
    binauralOsc.dispose();
    binauralOsc = null;
  }

  // Stop transport and all sequences immediately
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

/* ── Full cleanup ──────────────────────────────────────── */
export function dispose() {
  stop();

  const nodes = [
    solfeggioSynth, binauralOsc,
    kickSynth, kickSeq, rimSynth, rimSeq,
    hatSynth, hatSeq, shakerSynth, shakerSeq,
    bassSynth, bassSeq,
    padSynth, padLoop,
    pluckSynth, pluckSeq,
    arpSynth, arpSeq,
    reverb, delay, compressor, masterFilter, filterLFO, masterGain,
  ];
  nodes.forEach((n) => { try { n?.dispose(); } catch {} });

  solfeggioSynth = null; binauralOsc = null;
  kickSynth = null; kickSeq = null; rimSynth = null; rimSeq = null;
  hatSynth = null; hatSeq = null; shakerSynth = null; shakerSeq = null;
  bassSynth = null; bassSeq = null;
  padSynth = null; padLoop = null;
  pluckSynth = null; pluckSeq = null;
  arpSynth = null; arpSeq = null;
  reverb = null; delay = null; compressor = null; masterFilter = null;
  filterLFO = null; masterGain = null;

  initialized = false;
  isPlaying = false;
}
