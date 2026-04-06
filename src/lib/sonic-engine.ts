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

let synth: Tone.Synth | null = null;
let padSynth: Tone.PolySynth | null = null;
let lfo: Tone.LFO | null = null;
let reverb: Tone.Reverb | null = null;
let filter: Tone.Filter | null = null;
let gainNode: Tone.Gain | null = null;
let binauralOsc: Tone.Oscillator | null = null;
let isPlaying = false;

export async function startAudio() {
  await Tone.start();
}

export function initEngine() {
  if (synth) return; // already initialized

  reverb = new Tone.Reverb({ decay: 8, wet: 0.7 }).toDestination();
  filter = new Tone.Filter({ frequency: 2000, type: "lowpass", rolloff: -24 }).connect(reverb);
  gainNode = new Tone.Gain(0).connect(filter);

  // Main solfeggio tone — pure sine
  synth = new Tone.Synth({
    oscillator: { type: "sine" },
    envelope: { attack: 3, decay: 0, sustain: 1, release: 4 },
  }).connect(gainNode);

  // Ambient pad — detuned triangle waves for warmth
  padSynth = new Tone.PolySynth(Tone.Synth, {
    maxPolyphony: 4,
    oscillator: { type: "triangle" } as any,
    envelope: { attack: 4, decay: 1, sustain: 0.6, release: 5 },
  }).connect(new Tone.Gain(0.15).connect(filter));

  // Subtle LFO on filter for organic movement
  lfo = new Tone.LFO({ frequency: 0.08, min: 800, max: 3000 }).connect(filter.frequency);
}

// Polysyth import helper
const { PolySynth } = Tone;

export function play(hz: number, binauralOffset = 4) {
  if (!synth || !gainNode) {
    initEngine();
  }

  // Fade in main tone
  gainNode!.gain.rampTo(0.35, 2);
  synth!.triggerAttack(hz);

  // Binaural beat — second oscillator offset by ~4Hz in the other ear
  if (binauralOsc) {
    binauralOsc.stop();
    binauralOsc.dispose();
  }
  binauralOsc = new Tone.Oscillator({
    frequency: hz + binauralOffset,
    type: "sine",
  }).connect(new Tone.Gain(0.2).connect(reverb!));
  binauralOsc.start();

  // Ambient pad chord (root + fifth + octave)
  padSynth?.triggerAttack([hz / 2, hz * 0.75, hz * 1.5]);

  lfo?.start();
  isPlaying = true;
}

export function stop() {
  if (!isPlaying) return;

  gainNode?.gain.rampTo(0, 3);
  synth?.triggerRelease();
  padSynth?.releaseAll();
  binauralOsc?.stop();

  setTimeout(() => {
    binauralOsc?.dispose();
    binauralOsc = null;
  }, 4000);

  lfo?.stop();
  isPlaying = false;
}

export function setVolume(vol: number) {
  // vol: 0-1
  gainNode?.gain.rampTo(vol * 0.5, 0.5);
}

export function getIsPlaying() {
  return isPlaying;
}

export function dispose() {
  stop();
  synth?.dispose();
  padSynth?.dispose();
  reverb?.dispose();
  filter?.dispose();
  gainNode?.dispose();
  lfo?.dispose();
  synth = null;
  padSynth = null;
  reverb = null;
  filter = null;
  gainNode = null;
  lfo = null;
  isPlaying = false;
}
