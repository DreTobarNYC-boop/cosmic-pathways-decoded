import * as Tone from "tone";

let scanSynth: Tone.Synth | null = null;
let scanFilter: Tone.Filter | null = null;
let scanNoise: Tone.Noise | null = null;
let noiseGain: Tone.Gain | null = null;
let sweepLfo: Tone.LFO | null = null;
let masterGain: Tone.Gain | null = null;
let isPlaying = false;

/**
 * Start the palm-scanning sound.
 * Smooth rising sine tone + filtered pink noise sweep.
 * No LFO on pitch — clean, continuous, sci-fi laser feel.
 */
export async function startScanSound() {
  if (isPlaying) return;

  try {
    await Tone.start();

    masterGain = new Tone.Gain(0.8).toDestination();

    // ── Core tone: smooth sine, no wobble ──
    scanFilter = new Tone.Filter(1800, "lowpass", -12).connect(masterGain);

    scanSynth = new Tone.Synth({
      oscillator: { type: "triangle" },
      envelope: { attack: 1.5, decay: 0, sustain: 1, release: 1.2 },
      volume: -20,
    }).connect(scanFilter);

    scanSynth.triggerAttack(180);

    // ── Noise layer: pink noise through sweeping bandpass for texture ──
    noiseGain = new Tone.Gain(0.04).connect(masterGain);
    const noiseFilter = new Tone.Filter(1200, "bandpass", -24);
    scanNoise = new Tone.Noise("pink").connect(noiseFilter);
    noiseFilter.connect(noiseGain);

    // Slow sweep for subtle movement
    sweepLfo = new Tone.LFO("0.15hz", 800, 3000).start();
    sweepLfo.connect(noiseFilter.frequency);

    scanNoise.start();

    isPlaying = true;
  } catch (e) {
    console.warn("Could not start scan sound:", e);
  }
}

/**
 * Update the scan pitch based on progress (0–100).
 * Smooth ramp from ~180 Hz to ~520 Hz — steady rising laser.
 */
export function updateScanPitch(progress: number) {
  if (!scanSynth || !isPlaying) return;
  // Smooth exponential rise feels more natural
  const t = progress / 100;
  const freq = 180 + 340 * (t * t); // 180 Hz → 520 Hz
  try {
    scanSynth.frequency.rampTo(freq, 0.6);
  } catch {
    // ignore if disposed
  }

  // Brighten the filter as we progress
  if (scanFilter) {
    try {
      const filterFreq = 1800 + 2200 * t;
      scanFilter.frequency.rampTo(filterFreq, 0.6);
    } catch {
      // ignore
    }
  }
}

/**
 * Stop the scanning sound with a fade-out.
 */
export function stopScanSound() {
  if (!isPlaying) return;

  try {
    if (masterGain) {
      masterGain.gain.rampTo(0, 0.6);
    }
    scanSynth?.triggerRelease();
    scanNoise?.stop("+0.8");

    setTimeout(() => {
      scanSynth?.dispose();
      scanFilter?.dispose();
      scanNoise?.dispose();
      noiseGain?.dispose();
      sweepLfo?.dispose();
      masterGain?.dispose();
      scanSynth = null;
      scanFilter = null;
      scanNoise = null;
      noiseGain = null;
      sweepLfo = null;
      masterGain = null;
    }, 1200);
  } catch (e) {
    console.warn("Could not stop scan sound:", e);
  }

  isPlaying = false;
}

/**
 * Play a short completion chime — crystalline two-note arpeggio.
 */
export async function playCompletionChime() {
  try {
    await Tone.start();

    const reverb = new Tone.Reverb({ decay: 2.5, wet: 0.5 }).toDestination();
    await reverb.generate();

    const chime = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" },
      envelope: { attack: 0.01, decay: 1.2, sustain: 0, release: 1.5 },
      volume: -10,
    }).connect(reverb);

    const now = Tone.now();
    chime.triggerAttackRelease("C6", "8n", now);
    chime.triggerAttackRelease("E6", "8n", now + 0.08);
    chime.triggerAttackRelease("G6", "8n", now + 0.16);

    setTimeout(() => {
      chime.dispose();
      reverb.dispose();
    }, 4000);
  } catch (e) {
    console.warn("Could not play chime:", e);
  }
}
