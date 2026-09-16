// Web Audio API Sound Synthesizer & Ambient Sound Generator

export type AmbientSoundType = 'rain' | 'lofi' | 'campfire' | 'waves' | 'whitenoise' | 'brownnoise';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private ambientGain: GainNode | null = null;
  private ambientSource: AudioNode | null = null;
  private currentAmbientType: AmbientSoundType | null = null;
  private noiseInterval: number | null = null;
  private activeNodes: (AudioNode & { stop?: () => void })[] = [];

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
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
  public startAmbient(type: AmbientSoundType, volume = 0.4) {
    this.stopAmbient();
    try {
      const ctx = this.getContext();
      this.currentAmbientType = type;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 1.2);
      masterGain.connect(ctx.destination);
      this.ambientGain = masterGain;

      const sampleRate = ctx.sampleRate;
      const bufferSize = 4 * sampleRate; // 4 seconds seamless procedural buffer

      if (type === 'whitenoise') {
        // Pure uniform random noise buffer values between -1.0 and 1.0
        const noiseBuffer = ctx.createBuffer(1, bufferSize, sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        const whiteSource = ctx.createBufferSource();
        whiteSource.buffer = noiseBuffer;
        whiteSource.loop = true;

        // Gentle high-cut filter at 10kHz to preserve genuine white noise hiss without ear-piercing digital fatigue
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(10000, ctx.currentTime);

        // Scaled gain node to normalize full-scale white noise to comfortable ambient level
        const whiteGain = ctx.createGain();
        whiteGain.gain.setValueAtTime(0.08, ctx.currentTime);

        whiteSource.connect(filter);
        filter.connect(whiteGain);
        whiteGain.connect(masterGain);

        whiteSource.start();
        this.activeNodes.push(whiteSource);
        this.ambientSource = whiteSource;
      } else if (type === 'brownnoise') {
        // Brownian noise (1/f^2 red noise): Leaky integration of random white noise
        const noiseBuffer = ctx.createBuffer(1, bufferSize, sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          // Brownian integration accumulator
          lastOut = (lastOut + 0.02 * white) / 1.02;
          output[i] = lastOut * 3.4; // Normalized compensation
        }

        const brownSource = ctx.createBufferSource();
        brownSource.buffer = noiseBuffer;
        brownSource.loop = true;

        // Low-pass filter to sculpt deep, warm low-frequency focus rumble
        const lowpass = ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.setValueAtTime(360, ctx.currentTime);

        // Sub-bass warmth boost for rich focus rumble
        const warmth = ctx.createBiquadFilter();
        warmth.type = 'peaking';
        warmth.frequency.setValueAtTime(100, ctx.currentTime);
        warmth.Q.setValueAtTime(1.1, ctx.currentTime);
        warmth.gain.setValueAtTime(4.0, ctx.currentTime);

        const brownGain = ctx.createGain();
        brownGain.gain.setValueAtTime(1.2, ctx.currentTime);

        brownSource.connect(lowpass);
        lowpass.connect(warmth);
        warmth.connect(brownGain);
        brownGain.connect(masterGain);

        brownSource.start();
        this.activeNodes.push(brownSource);
        this.ambientSource = brownSource;
      } else if (type === 'rain') {
        const noiseBuffer = ctx.createBuffer(1, bufferSize, sampleRate);
        const output = noiseBuffer.getChannelData(0);

        // Pink noise filtering for natural rainfall
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
          b6 = white * 0.115926;
        }

        const rainSource = ctx.createBufferSource();
        rainSource.buffer = noiseBuffer;
        rainSource.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, ctx.currentTime);

        const highpass = ctx.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.setValueAtTime(200, ctx.currentTime);

        rainSource.connect(filter);
        filter.connect(highpass);
        highpass.connect(masterGain);

        rainSource.start();
        this.activeNodes.push(rainSource);
        this.ambientSource = rainSource;
      } else if (type === 'campfire') {
        const noiseBuffer = ctx.createBuffer(1, bufferSize, sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99 * b0 + white * 0.08;
          b1 = 0.95 * b1 + white * 0.12;
          b2 = 0.90 * b2 + white * 0.2;
          output[i] = (b0 + b1 + b2) * 0.12;
        }

        const fireSource = ctx.createBufferSource();
        fireSource.buffer = noiseBuffer;
        fireSource.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(650, ctx.currentTime);
        filter.Q.setValueAtTime(2.8, ctx.currentTime);

        fireSource.connect(filter);
        filter.connect(masterGain);

        fireSource.start();
        this.activeNodes.push(fireSource);
        this.ambientSource = fireSource;
      } else if (type === 'waves') {
        const noiseBuffer = ctx.createBuffer(1, bufferSize, sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = (Math.random() * 2 - 1) * 0.2;
        }

        const waveSource = ctx.createBufferSource();
        waveSource.buffer = noiseBuffer;
        waveSource.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(420, ctx.currentTime);

        // LFO for periodic wave crests
        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(0.12, ctx.currentTime);
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(300, ctx.currentTime);

        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        lfo.start();
        this.activeNodes.push(lfo);

        waveSource.connect(filter);
        filter.connect(masterGain);

        waveSource.start();
        this.activeNodes.push(waveSource);
        this.ambientSource = waveSource;
      } else if (type === 'lofi') {
        const chordFrequencies = [261.63, 329.63, 392.00, 493.88]; // Cmaj7 warm pad
        chordFrequencies.forEach(freq => {
          const osc = ctx.createOscillator();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);

          // Subtle chorus detune
          const detuneLfo = ctx.createOscillator();
          detuneLfo.frequency.setValueAtTime(0.3 + Math.random() * 0.2, ctx.currentTime);
          const detuneGain = ctx.createGain();
          detuneGain.gain.setValueAtTime(4, ctx.currentTime);
          detuneLfo.connect(detuneGain);
          detuneGain.connect(osc.detune);
          detuneLfo.start();
          this.activeNodes.push(detuneLfo);

          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(850, ctx.currentTime);

          osc.connect(filter);
          filter.connect(masterGain);
          osc.start();
          this.activeNodes.push(osc);
        });

        this.ambientSource = masterGain;
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
