const fs = require('fs');

let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

// 1. Remove htmlAudio declaration
content = content.replace(
  'private htmlAudio: HTMLAudioElement | null = null;\n',
  ''
);

// 2. Rewrite startAmbient to use Web Audio API for seamless zero-gap looping
const startAmbientRegex = /public async startAmbient\([^\{]+\{[\s\S]*?(?=public setAmbientVolume)/;
const newStartAmbient = `public async startAmbient(type: AmbientSoundType, volume = 0.4) {
    try {
      if (typeof window === 'undefined') return;
      
      const ctx = this.getContext();

      // Guard: if already playing this exact type, do not restart to prevent stuttering
      if (this.currentAmbientType === type && this.ambientGain && this.ambientSource) {
         this.setAmbientVolume(volume);
         return;
      }
      
      this.stopAmbient();
      this.currentAmbientType = type;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
      
      const compFactor = this.volumeCompensation[type] || 1.0;
      masterGain.gain.linearRampToValueAtTime(volume * compFactor, ctx.currentTime + 1.2);
      
      masterGain.connect(ctx.destination);
      this.ambientGain = masterGain;

      const urls: Record<AmbientSoundType, string> = {
        'pinknoise': '/audio/ambience/pink-noise.mp3',
        'brownnoise': '/audio/ambience/brown-noise.mp3',
        'whitenoise': '/audio/ambience/white-noise.mp3',
        'rain': '/audio/ambience/rain.mp3',
        'campfire': '/audio/ambience/fireplace.mp3',
      };
      
      const url = urls[type];
      if (url) {
        // Web Audio API buffer looping guarantees 100% gapless playback, unlike HTMLAudioElement
        const buffer = await this.getAmbientBuffer(ctx, url);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true; // Flawless native loop
        source.connect(masterGain);
        source.start(0);
        this.activeNodes.push(source);
        this.ambientSource = source;
      }
    } catch (e) {
      console.error("Audio Engine Error in startAmbient:", e);
    }
  }

  `;
content = content.replace(startAmbientRegex, newStartAmbient);

// 3. Rewrite setAmbientVolume
const setAmbientVolumeRegex = /public setAmbientVolume\([^\{]+\{[\s\S]*?(?=\/\/ Play esports victory)/;
const newSetAmbientVolume = `public setAmbientVolume(vol: number) {
    if (this.ambientGain && this.ctx && this.currentAmbientType) {
      const compFactor = this.volumeCompensation[this.currentAmbientType] || 1.0;
      const target = Math.max(0, Math.min(1, vol * compFactor));
      this.ambientGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.ambientGain.gain.setValueAtTime(this.ambientGain.gain.value, this.ctx.currentTime);
      this.ambientGain.gain.linearRampToValueAtTime(target, this.ctx.currentTime + 0.1);
    }
  }

  `;
content = content.replace(setAmbientVolumeRegex, newSetAmbientVolume);

// 4. Rewrite stopAmbient
const stopAmbientRegex = /public stopAmbient\(\) \{[\s\S]*?\n  \}/;
const newStopAmbient = `public stopAmbient() {
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
    this.currentAmbientType = null;
    this.ambientSource = null;
  }`;
content = content.replace(stopAmbientRegex, newStopAmbient);

fs.writeFileSync('src/lib/audio.ts', content);
