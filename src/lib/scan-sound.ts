import * as Tone from "tone";

let scanSynth: Tone.Synth | null = null;
let scanLfo: Tone.LFO | null = null;
let scanFilter: Tone.Filter | null = null;
let scanNoise: Tone.Noise | null = null;
let noiseGain: Tone.Gain | null = null;
let isPlaying = false;

/**
 * Start the palm-scanning buzzing sound.
 * Uses a low sine tone modulated by an LFO + filtered noise for that
 * sci-fi scanner buzz heard in the reference.
 */
export async function startScanSound() {
  if (isPlaying) return;

  try {
    await Tone.start();

    // Low sine buzz — the core hum
    scanFilter = new Tone.Filter(800, "lowpass").toDestination();
    scanSynth = new Tone.Synth({
      oscillator: { type: "sine" },
      envelope: { attack: 0.3, decay: 0.1, sustain: 0.8, release: 0.5 },
      volume: -18,
    }).connect(scanFilter);

    // LFO to wobble the pitch slightly — gives it that "scanning" feel
    scanLfo = new Tone.LFO("8hz", 55, 75).start();
    scanLfo.connect(scanSynth.frequency);

    scanSynth.triggerAttack(60);

    // Filtered white noise layer — adds the buzzy texture
    noiseGain = new Tone.Gain(0.06).toDestination();
    const noiseFilter = new Tone.Filter(1200, "bandpass");
    scanNoise = new Tone.Noise("white").connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    scanNoise.start();

    isPlaying = true;
  } catch (e) {
    console.warn("Could not start scan sound:", e);
  }
}

/**
 * Stop the scanning sound with a fade-out.
 */
export function stopScanSound() {
  if (!isPlaying) return;

  try {
    scanSynth?.triggerRelease();
    scanNoise?.stop();

    // Clean up after release
    setTimeout(() => {
      scanSynth?.dispose();
      scanLfo?.dispose();
      scanFilter?.dispose();
      scanNoise?.dispose();
      noiseGain?.dispose();
      scanSynth = null;
      scanLfo = null;
      scanFilter = null;
      scanNoise = null;
      noiseGain = null;
    }, 600);
  } catch (e) {
    console.warn("Could not stop scan sound:", e);
  }

  isPlaying = false;
}
