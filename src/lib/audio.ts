// Web Audio API Sound Synthesizer & Ambient Sound Generator

class AudioEngine {
  private ctx: AudioContext | null = null;
  private ambientGain: GainNode | null = null;
  private ambientSource: AudioNode | null = null;
  private currentAmbientType: string | null = null;
  private noiseInterval: number | null = null;

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

  // Ambient sound synthesizer: Rain, Lofi, WhiteNoise, Campfire, Waves
  public startAmbient(type: 'rain' | 'lofi' | 'whitenoise' | 'campfire' | 'waves', volume = 0.4) {
    this.stopAmbient();
    try {
      const ctx = this.getContext();
      this.currentAmbientType = type;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 1.5);
      masterGain.connect(ctx.destination);
      this.ambientGain = masterGain;

      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      // Generate pink/white noise
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11;
        b6 = white * 0.115926;
      }

      const whiteNoiseNode = ctx.createBufferSource();
      whiteNoiseNode.buffer = noiseBuffer;
      whiteNoiseNode.loop = true;

      if (type === 'rain') {
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, ctx.currentTime);

        const highpass = ctx.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.setValueAtTime(200, ctx.currentTime);

        whiteNoiseNode.connect(filter);
        filter.connect(highpass);
        highpass.connect(masterGain);
        whiteNoiseNode.start();
        this.ambientSource = whiteNoiseNode;
      } else if (type === 'whitenoise') {
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(3500, ctx.currentTime);

        whiteNoiseNode.connect(filter);
        filter.connect(masterGain);
        whiteNoiseNode.start();
        this.ambientSource = whiteNoiseNode;
      } else if (type === 'campfire') {
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(600, ctx.currentTime);
        filter.Q.setValueAtTime(3.0, ctx.currentTime);

        whiteNoiseNode.connect(filter);
        filter.connect(masterGain);
        whiteNoiseNode.start();
        this.ambientSource = whiteNoiseNode;
      } else if (type === 'waves') {
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, ctx.currentTime);

        // LFO for wave modulation
        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(0.12, ctx.currentTime);
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(280, ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        lfo.start();

        whiteNoiseNode.connect(filter);
        filter.connect(masterGain);
        whiteNoiseNode.start();
        this.ambientSource = whiteNoiseNode;
      } else if (type === 'lofi') {
        // Lofi warm chord pad synthesis
        const chordFrequencies = [261.63, 329.63, 392.00, 493.88]; // Cmaj7 warm pad
        const oscillators: OscillatorNode[] = [];

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

          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(850, ctx.currentTime);

          osc.connect(filter);
          filter.connect(masterGain);
          osc.start();
          oscillators.push(osc);
        });

        this.ambientSource = masterGain;
      }
    } catch {
      // Audio ambient fallback
    }
  }

  public setAmbientVolume(vol: number) {
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.linearRampToValueAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime + 0.1);
    }
  }

  public stopAmbient() {
    if (this.ambientGain && this.ctx) {
      try {
        this.ambientGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
      } catch {
        // ignore
      }
    }
    if (this.ambientSource) {
      try {
        if ('stop' in this.ambientSource && typeof (this.ambientSource as AudioScheduledSourceNode).stop === 'function') {
          (this.ambientSource as AudioScheduledSourceNode).stop();
        }
      } catch {
        // ignore
      }
      this.ambientSource = null;
    }
    if (this.noiseInterval) {
      clearInterval(this.noiseInterval);
      this.noiseInterval = null;
    }
    this.currentAmbientType = null;
  }

  public getCurrentAmbient() {
    return this.currentAmbientType;
  }
}

export const soundFx = new AudioEngine();
