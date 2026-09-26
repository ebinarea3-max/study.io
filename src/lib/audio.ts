// Web Audio API Sound Synthesizer & Ambient Sound Generator

export type AmbientSoundType = 'pinknoise' | 'brownnoise' | 'whitenoise' | 'rain' | 'waves' | 'campfire' | 'lofi';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private ambientGain: GainNode | null = null;
  private ambientSource: AudioNode | null = null;
  private currentAmbientType: AmbientSoundType | null = null;
  private noiseInterval: number | null = null;
  private activeNodes: (AudioNode & { stop?: () => void })[] = [];

  private getContext(): AudioContext {
    if (typeof window === 'undefined') {
      throw new Error('AudioContext not available on server');
    }
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) {
        throw new Error('AudioContext not supported');
      }
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public resumeContext() {
    try {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch {
      // ignore
    }
  }

  // Play start chime
  public playStartChime() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Bright uplifting major arpeggio)
      
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.7);
      });
    } catch {
      // Audio not permitted yet or failed
    }
  }

  // Play stop / pause chime
  public playStopChime() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const notes = [783.99, 659.25, 523.25]; // G5, E5, C5 (Calm descending)
      
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);

        gain.gain.setValueAtTime(0, now + idx * 0.1);
        gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.1 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.6);
      });
    } catch {
      // Audio error fallback
    }
  }

  // Play bell / milestone chime
  public playMilestoneBell() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const fundamental = 440; // A4 meditation bell
      const harmonics = [1, 2.76, 5.4, 8.9];

      harmonics.forEach((mult, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(fundamental * mult, now);

        const initialGain = 0.25 / (idx + 1);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(initialGain, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 2.6);
      });
    } catch {
      // ignore
    }
  }

  // Play cheer reaction pop
  public playReactionPop() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.12);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch {
      // ignore
    }
  }

  // Ambient sound synthesizer: Rain, Lofi, WhiteNoise, BrownNoise, Campfire, Waves
  private audioBuffers = new Map<string, AudioBuffer>();

  private async getAmbientBuffer(ctx: AudioContext, url: string): Promise<AudioBuffer> {
    if (this.audioBuffers.has(url)) {
      return this.audioBuffers.get(url)!;
    }
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    this.audioBuffers.set(url, audioBuffer);
    return audioBuffer;
  }

  // Volume compensation factors to ensure consistent perceived loudness across all files
  private volumeCompensation: Record<AmbientSoundType, number> = {
    'pinknoise': 1.0,
    'brownnoise': 1.2,
    'whitenoise': 0.15,
    'rain': 0.8,
    'waves': 1.0,
    'campfire': 0.9,
    'lofi': 0.7,
  };

  public async startAmbient(type: AmbientSoundType, volume = 0.4) {
    this.stopAmbient();
    try {
      const ctx = this.getContext();
      this.currentAmbientType = type;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
      
      const compFactor = this.volumeCompensation[type] || 1.0;
      masterGain.gain.linearRampToValueAtTime(volume * compFactor, ctx.currentTime + 1.2);
      
      masterGain.connect(ctx.destination);
      this.ambientGain = masterGain;

      // Real audio loops
      const urls: Record<AmbientSoundType, string> = {
        'pinknoise': '/audio/ambience/pink-noise.wav',
        'brownnoise': '/audio/ambience/brown-noise.wav',
        'whitenoise': '/audio/ambience/white-noise.wav',
        'rain': '/audio/ambience/rain.wav',
        'waves': '/audio/ambience/waves.wav',
        'campfire': '/audio/ambience/fireplace.wav',
        'lofi': '/audio/ambience/lofi-cafe.wav',
      };
      
      const url = urls[type];
      if (url) {
        const buffer = await this.getAmbientBuffer(ctx, url);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        source.connect(masterGain);
        source.start();
        this.activeNodes.push(source);
        this.ambientSource = source;
      }
    } catch {
      // Audio ambient fallback
    }
  }

  public setAmbientVolume(vol: number) {
    if (this.ambientGain && this.ctx) {
      const target = Math.max(0, Math.min(1, vol));
      this.ambientGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.ambientGain.gain.setValueAtTime(this.ambientGain.gain.value, this.ctx.currentTime);
      this.ambientGain.gain.linearRampToValueAtTime(target, this.ctx.currentTime + 0.1);
    }
  }

  // Play esports victory rank settlement fanfare
  public playRankSettlementSound() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      // High-energy heroic esports chords: D4, F#4, A4, D5, E5, F#5
      const notes = [293.66, 369.99, 440.0, 587.33, 659.25, 739.99];

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);

        // Lowpass filter to give smooth analog brass synth tone
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2200, now);
        filter.frequency.exponentialRampToValueAtTime(4500, now + idx * 0.09 + 0.1);

        gain.gain.setValueAtTime(0, now + idx * 0.09);
        gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.09 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.09 + 1.2);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 1.3);
      });
    } catch {
      // ignore
    }
  }

  // Play subtle futuristic mechanical tick for RP progress counter
  public playRankTickSound() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.03);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.035);
    } catch {
      // ignore
    }
  }

  // Helper to create soft saturation distortion curve for WaveShaper
  private createDistortionCurve(amount = 15): Float32Array<ArrayBuffer> {
    const nSamples = 44100;
    const buffer = new ArrayBuffer(nSamples * Float32Array.BYTES_PER_ELEMENT);
    const curve = new Float32Array(buffer);
    const deg = Math.PI / 180;
    for (let i = 0; i < nSamples; ++i) {
      const x = (i * 2) / nSamples - 1;
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }
    return curve;
  }

  // Cinematic Sub-Bass Impact Slam (Layered: WaveShaped 110Hz->28Hz sweep + 1200Hz lowpass white-noise crack + 60Hz sub body)
  public playSubBassImpact() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // 1. Core Heavy Sub-Bass Sweep (110Hz -> 28Hz over 400ms) with WaveShaper saturation
      const sweepOsc = ctx.createOscillator();
      const sweepGain = ctx.createGain();
      sweepOsc.type = 'sine';
      sweepOsc.frequency.setValueAtTime(110, now);
      sweepOsc.frequency.exponentialRampToValueAtTime(28, now + 0.4);

      sweepGain.gain.setValueAtTime(0.65, now);
      sweepGain.gain.linearRampToValueAtTime(0.55, now + 0.03);
      sweepGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);

      const shaper = ctx.createWaveShaper();
      shaper.curve = this.createDistortionCurve(16);
      shaper.oversample = '2x';

      sweepOsc.connect(shaper);
      shaper.connect(sweepGain);
      sweepGain.connect(ctx.destination);

      sweepOsc.start(now);
      sweepOsc.stop(now + 0.45);

      // 2. White-noise burst through lowpass filter (cutoff 1200Hz, 120ms decay) for "crack"
      const bufferLength = Math.max(1, Math.floor(ctx.sampleRate * 0.14));
      const noiseBuffer = ctx.createBuffer(1, bufferLength, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferLength; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.75;
      }
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(1200, now);
      noiseFilter.frequency.exponentialRampToValueAtTime(180, now + 0.12);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.42, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noiseSource.start(now);
      noiseSource.stop(now + 0.13);

      // 3. 60Hz Sine sub-oscillator at low gain for tactile low-end body
      const bodyOsc = ctx.createOscillator();
      const bodyGain = ctx.createGain();
      bodyOsc.type = 'sine';
      bodyOsc.frequency.setValueAtTime(60, now);

      bodyGain.gain.setValueAtTime(0.32, now);
      bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

      bodyOsc.connect(bodyGain);
      bodyGain.connect(ctx.destination);

      bodyOsc.start(now);
      bodyOsc.stop(now + 0.4);
    } catch {
      // ignore audio context restrictions
    }
  }

  // Backwards compatibility alias
  public playBassImpactThud() {
    this.playSubBassImpact();
  }

  // Segment ticks: short, quiet click (square wave, 1800Hz, 15ms, gain 0.03) with pitch rising slightly
  public playSegmentTick(progress = 0) {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Pitch rises slightly as bar progresses from 1800Hz up to ~2300Hz
      const pitch = 1800 + Math.max(0, Math.min(1, progress)) * 500;
      osc.type = 'square';
      osc.frequency.setValueAtTime(pitch, now);

      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.018);
    } catch {
      // ignore
    }
  }

  // Deep cinematic promotion sound: sub-bass swell, warm mid-range tonal layer, and resonant impact hit at the end
  public playCinematicPromotionSound(intensity: number = 1, spinDurationMs: number = 1200) {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const spinDur = spinDurationMs / 1000;

      // Base intensity scaling
      const gainScale = 1 + (intensity - 1) * 0.15;
      const sustainScale = 1 + (intensity - 1) * 0.1;

      // 1. Low sub-bass swell (45-60Hz) building underneath the spin
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(45 + intensity * 2, now); // 45-60Hz
      
      subGain.gain.setValueAtTime(0, now);
      // Slow rising swell that grows as the badge decelerates
      subGain.gain.exponentialRampToValueAtTime(0.35 * gainScale, now + spinDur - 0.05);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + spinDur + 0.6 * sustainScale);
      
      subOsc.connect(subGain);
      subGain.connect(ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + spinDur + 1.2);

      // 2. Mid-range tonal layer (brass/string swell) building under spin
      const detunes = [-4, 4];
      detunes.forEach((detune) => {
        const midOsc = ctx.createOscillator();
        const midGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        midOsc.type = 'sawtooth';
        // Warm rich root: D3 (146.83Hz)
        midOsc.frequency.setValueAtTime(146.83, now); 
        midOsc.detune.setValueAtTime(detune, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, now);
        // Filter opens up as it decelerates
        filter.frequency.exponentialRampToValueAtTime(800 + intensity * 60, now + spinDur - 0.1);
        filter.frequency.exponentialRampToValueAtTime(300, now + spinDur + 0.2);

        const baseGain = 0.08 * gainScale;
        midGain.gain.setValueAtTime(0, now);
        // Swell up until the settle
        midGain.gain.exponentialRampToValueAtTime(baseGain * 0.8, now + spinDur - 0.05);
        midGain.gain.exponentialRampToValueAtTime(0.001, now + spinDur + 0.5);

        midOsc.connect(filter);
        filter.connect(midGain);
        midGain.connect(ctx.destination);

        midOsc.start(now);
        midOsc.stop(now + spinDur + 1.2);
      });

      // 3. Resonant impact hit at exactly the final settle beat
      const hitTime = now + spinDur;
      
      const hitOsc = ctx.createOscillator();
      const hitGain = ctx.createGain();
      // Triangle for a bit of harmonic bite
      hitOsc.type = 'triangle';
      hitOsc.frequency.setValueAtTime(110, hitTime);
      hitOsc.frequency.exponentialRampToValueAtTime(55, hitTime + 0.15);

      hitGain.gain.setValueAtTime(0, hitTime);
      hitGain.gain.linearRampToValueAtTime(0.45 * gainScale, hitTime + 0.02);
      hitGain.gain.exponentialRampToValueAtTime(0.001, hitTime + 0.3 * sustainScale);

      hitOsc.connect(hitGain);
      hitGain.connect(ctx.destination);
      hitOsc.start(hitTime);
      hitOsc.stop(hitTime + 0.5 * sustainScale);

      // Noise crack for the hit
      const bufferLength = Math.max(1, Math.floor(ctx.sampleRate * 0.1));
      const noiseBuffer = ctx.createBuffer(1, bufferLength, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferLength; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.5;
      }
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(600, hitTime);
      noiseFilter.frequency.exponentialRampToValueAtTime(100, hitTime + 0.1);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.18 * gainScale, hitTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, hitTime + 0.1);

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noiseSource.start(hitTime);
      noiseSource.stop(hitTime + 0.15);

    } catch {
      // ignore
    }
  }

  // Quick noise-burst layered with a low thud for the shatter crack
  public playShatterCrack(intensity: number = 1) {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      
      const gainScale = 1 + (intensity - 1) * 0.15;

      // Low thud
      const thudOsc = ctx.createOscillator();
      const thudGain = ctx.createGain();
      thudOsc.type = 'sine';
      thudOsc.frequency.setValueAtTime(80, now);
      thudOsc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
      
      thudGain.gain.setValueAtTime(0, now);
      thudGain.gain.linearRampToValueAtTime(0.3 * gainScale, now + 0.02);
      thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      thudOsc.connect(thudGain);
      thudGain.connect(ctx.destination);
      thudOsc.start(now);
      thudOsc.stop(now + 0.2);

      // Sharp noise crack
      const bufferLength = Math.max(1, Math.floor(ctx.sampleRate * 0.1));
      const noiseBuffer = ctx.createBuffer(1, bufferLength, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferLength; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.5;
      }
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.setValueAtTime(1000, now);
      
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.25 * gainScale, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      
      noiseSource.start(now);
      noiseSource.stop(now + 0.1);

    } catch {
      // ignore
    }
  }

  // Warm resonant chime / overtone at 432Hz for RP fill completion
  public playRankFillCompletion() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(432, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 1.25);
    } catch {
      // ignore audio context restrictions
    }
  }

  public stopAmbient() {
    if (this.ambientGain && this.ctx) {
      try {
        this.ambientGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.ambientGain.gain.setValueAtTime(this.ambientGain.gain.value, this.ctx.currentTime);
        this.ambientGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.4);
      } catch {
        // ignore
      }
    }

    const nodesToStop = [...this.activeNodes];
    this.activeNodes = [];

    setTimeout(() => {
      nodesToStop.forEach(node => {
        try {
          if (typeof node.stop === 'function') {
            node.stop();
          }
          node.disconnect();
        } catch {
          // ignore
        }
      });
    }, 450);

    if (this.noiseInterval) {
      clearInterval(this.noiseInterval);
      this.noiseInterval = null;
    }
    this.ambientSource = null;
    this.currentAmbientType = null;
  }

  public getCurrentAmbient() {
    return this.currentAmbientType;
  }
}

export const soundFx = new AudioEngine();
