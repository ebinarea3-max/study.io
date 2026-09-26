const fs = require('fs');
const path = 'src/lib/audio.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /export type AmbientSoundType = 'rain' \| 'lofi' \| 'campfire' \| 'waves' \| 'whitenoise' \| 'brownnoise';/,
  "export type AmbientSoundType = 'pinknoise' | 'brownnoise' | 'whitenoise' | 'rain' | 'waves' | 'campfire' | 'lofi';"
);

const newAmbientCode = `
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
`;

content = content.replace(
  /private workletLoaded = false;[\s\S]*?public setAmbientVolume\(vol: number\) \{/m,
  newAmbientCode.trim() + '\n\n  public setAmbientVolume(vol: number) {'
);

fs.writeFileSync(path, content, 'utf8');
console.log('audio.ts refactored');
