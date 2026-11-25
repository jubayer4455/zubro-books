export type SoundMode = "off" | "rain" | "night" | "river";

/**
 * Pure Web Audio API organic soundscape synthesizer — zero external MP3 dependencies,
 * instant playback, warm analog filtering for late-night Bengali story reading.
 */
class AmbientSoundController {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private cleanupTimer: number | null = null;
  private currentMode: SoundMode = "off";

  public getMode(): SoundMode {
    return this.currentMode;
  }

  public stop() {
    this.currentMode = "off";
    if (this.cleanupTimer !== null) {
      window.clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch {}
      this.ctx = null;
      this.masterGain = null;
    }
  }

  public play(mode: SoundMode) {
    this.stop();
    if (mode === "off" || typeof window === "undefined") return;

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    this.ctx = ctx;
    this.currentMode = mode;

    const master = ctx.createGain();
    master.gain.setValueAtTime(0.001, ctx.currentTime);
    master.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + 1.4);
    master.connect(ctx.destination);
    this.masterGain = master;

    // Generate 4 seconds of warm brown/pink noise buffer
    const bufferSize = ctx.sampleRate * 4;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.035 * white) / 1.035;
      lastOut = output[i];
      output[i] *= 2.4;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const filter = ctx.createBiquadFilter();

    if (mode === "rain") {
      // Warm monsoon night rain outside a window
      filter.type = "bandpass";
      filter.frequency.value = 680;
      filter.Q.value = 0.55;
      noiseSource.connect(filter);
      filter.connect(master);
      noiseSource.start();
    } else if (mode === "river") {
      // Slow river waves lapping against a wooden boat
      filter.type = "lowpass";
      filter.frequency.value = 340;
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.16; // ~6s wave cycle
      lfoGain.gain.value = 180;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      noiseSource.connect(filter);
      filter.connect(master);
      noiseSource.start();
      lfo.start();
    } else if (mode === "night") {
      // Quiet mofussil midnight wind + subtle distant grandfather clock tick
      filter.type = "lowpass";
      filter.frequency.value = 240;
      const windGain = ctx.createGain();
      windGain.gain.value = 0.65;
      noiseSource.connect(filter);
      filter.connect(windGain);
      windGain.connect(master);
      noiseSource.start();

      // Soft wooden clock tick every 1.25s
      this.cleanupTimer = window.setInterval(() => {
        if (!this.ctx || this.ctx.state !== "running") return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const tickGain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.035);
        tickGain.gain.setValueAtTime(0.045, now);
        tickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);
        osc.connect(tickGain);
        tickGain.connect(master);
        osc.start(now);
        osc.stop(now + 0.05);
      }, 1250);
    }
  }
}

export const soundscape = new AmbientSoundController();
