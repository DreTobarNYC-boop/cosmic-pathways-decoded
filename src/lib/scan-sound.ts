import * as Tone from "tone";

let scanSynth: Tone.Synth | null = null;
let scanLfo: Tone.LFO | null = null;
let scanFilter: Tone.Filter | null = null;
let scanNoise: Tone.Noise | null = null;
let noiseGain: Tone.Gain | null = null;
let filterLfo: Tone.LFO | null = null;
let sweepLfo: Tone.LFO | null = null;
let isPlaying = false;

/**
 * Start the palm-scanning buzzing sound.
 * Multi-layer: low sine hum with pitch wobble, filtered noise with
 * sweeping bandpass, and a slow filter LFO for movement.
 */
export async function startScanSound() {
  if (isPlaying) return;

  try {
    await Tone.start();

    // ── Core hum: sine with pitch wobble ──
    scanFilter = new Tone.Filter(900, "lowpass").toDestination();
    scanSynth = new Tone.Synth({
      oscillator: { type: "sine" },
      envelope: { attack: 0.5, decay: 0.1, sustain: 0.85, release: 0.8 },
      volume: -16,
    }).connect(scanFilter);

    // Fast pitch wobble — the "buzz" character
    scanLfo = new Tone.LFO("10hz", 50, 80).start();
    scanLfo.connect(scanSynth.frequency);

    // Slow filter sweep on the hum — gives motion
    filterLfo = new Tone.LFO("0.4hz", 400, 1200).start();
    filterLfo.connect(scanFilter.frequency);

    scanSynth.triggerAttack(65);

    // ── Noise layer: white noise through sweeping bandpass ──
    noiseGain = new Tone.Gain(0.09).toDestination();
    const noiseFilter = new Tone.Filter(1000, "bandpass", -12);
    scanNoise = new Tone.Noise("pink").connect(noiseFilter);
    noiseFilter.connect(noiseGain);

    // Sweep the noise filter for that "scanning across frequencies" feel
    sweepLfo = new Tone.LFO("0.25hz", 600, 2400).start();
    sweepLfo.connect(noiseFilter.frequency);

    scanNoise.start();

    isPlaying = true;
  } catch (e) {
    console.warn("Could not start scan sound:", e);
  }
}

/**
 * Update the scan pitch based on progress (0–100).
 * Higher progress = higher pitch for rising tension.
 */
export function updateScanPitch(progress: number) {
  if (!scanSynth || !isPlaying) return;
  const baseFreq = 55 + (progress / 100) * 45; // 55 Hz → 100 Hz
  try {
    scanSynth.frequency.rampTo(baseFreq, 0.3);
  } catch {
    // ignore if disposed
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

    setTimeout(() => {
      scanSynth?.dispose();
      scanLfo?.dispose();
      scanFilter?.dispose();
      scanNoise?.dispose();
      noiseGain?.dispose();
      filterLfo?.dispose();
      sweepLfo?.dispose();
      scanSynth = null;
      scanLfo = null;
      scanFilter = null;
      scanNoise = null;
      noiseGain = null;
      filterLfo = null;
      sweepLfo = null;
    }, 900);
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
