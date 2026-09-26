const fs = require('fs');
const path = 'src/lib/audio.ts';
let content = fs.readFileSync(path, 'utf8');

const newAmbientCode = `
  private workletLoaded = false;
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

  public async startAmbient(type: AmbientSoundType, volume = 0.4) {
    this.stopAmbient();
    try {
      const ctx = this.getContext();
      this.currentAmbientType = type;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 1.2);
      masterGain.connect(ctx.destination);
      this.ambientGain = masterGain;

      if (type === 'whitenoise' || type === 'brownnoise') {
        if (!this.workletLoaded) {
          await ctx.audioWorklet.addModule('/audio/noise-worklet.js');
          this.workletLoaded = true;
        }
        
        const noiseNode = new AudioWorkletNode(ctx, 'noise-generator');
        const noiseTypeParam = noiseNode.parameters.get('noiseType');
        if (noiseTypeParam) {
          noiseTypeParam.setValueAtTime(type === 'brownnoise' ? 1 : 0, ctx.currentTime);
        }

        const filter = ctx.createBiquadFilter();
        if (type === 'whitenoise') {
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(14000, ctx.currentTime); // 14kHz gentle lowpass
        } else {
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(360, ctx.currentTime);
          
          const warmth = ctx.createBiquadFilter();
          warmth.type = 'peaking';
          warmth.frequency.setValueAtTime(100, ctx.currentTime);
          warmth.Q.setValueAtTime(1.1, ctx.currentTime);
          warmth.gain.setValueAtTime(4.0, ctx.currentTime);
          
          filter.connect(warmth);
          warmth.connect(masterGain);
          
          noiseNode.connect(filter);
          this.activeNodes.push(noiseNode as any);
          this.ambientSource = noiseNode;
          return;
        }

        const nodeGain = ctx.createGain();
        nodeGain.gain.setValueAtTime(type === 'whitenoise' ? 0.08 : 1.2, ctx.currentTime);
        
        noiseNode.connect(filter);
        filter.connect(nodeGain);
        nodeGain.connect(masterGain);

        this.activeNodes.push(noiseNode as any);
        this.ambientSource = noiseNode;
      } else {
        // Real audio loops
        const urls: Record<string, string> = {
          'rain': '/audio/ambience/rain.wav',
          'campfire': '/audio/ambience/fireplace.wav',
          'waves': '/audio/ambience/waves.wav',
          'lofi': '/audio/ambience/lofi.wav',
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
      }
    } catch {
      // Audio ambient fallback
    }
  }
`;

content = content.replace(
  /public startAmbient\(type: AmbientSoundType, volume = 0\.4\) \{[\s\S]*?public setAmbientVolume\(vol: number\) \{/m,
  newAmbientCode.trim() + '\n\n  public setAmbientVolume(vol: number) {'
);

fs.writeFileSync(path, content, 'utf8');
console.log('Audio logic replaced');
