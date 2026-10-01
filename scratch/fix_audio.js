const fs = require('fs');

let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

// 1. Add private htmlAudio
if (!content.includes('private htmlAudio: HTMLAudioElement | null')) {
  content = content.replace(
    'private currentAmbientType: AmbientSoundType | null = null;',
    'private currentAmbientType: AmbientSoundType | null = null;\n  private htmlAudio: HTMLAudioElement | null = null;'
  );
}

// 2. Replace startAmbient
const startAmbientRegex = /public async startAmbient\([^\{]+\{[\s\S]*?(?=public setAmbientVolume)/;
const newStartAmbient = `public async startAmbient(type: AmbientSoundType, volume = 0.4) {
    try {
      if (typeof window === 'undefined') return;
      
      if (!this.htmlAudio) {
        this.htmlAudio = new Audio();
        this.htmlAudio.loop = true;
        this.htmlAudio.preload = 'auto';
      }
      
      const compFactor = this.volumeCompensation[type] || 1.0;
      this.htmlAudio.volume = Math.max(0, Math.min(1, volume * compFactor));

      const urls: Record<AmbientSoundType, string> = {
        'pinknoise': '/audio/ambience/pink-noise.mp3',
        'brownnoise': '/audio/ambience/brown-noise.mp3',
        'whitenoise': '/audio/ambience/white-noise.mp3',
        'rain': '/audio/ambience/rain.mp3',
        'campfire': '/audio/ambience/fireplace.mp3',
      };
      
      const url = urls[type];
      if (!url) return;

      if (this.currentAmbientType !== type || !this.htmlAudio.src.endsWith(url)) {
        this.htmlAudio.src = url;
        // Don't bind to onended or manual loops, HTMLAudioElement will handle native looping
        this.currentAmbientType = type;
      }

      const playPromise = this.htmlAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn("Audio play interrupted:", error);
        });
      }
    } catch (e) {
      console.error("Audio Engine Error in startAmbient:", e);
    }
  }

  `;
content = content.replace(startAmbientRegex, newStartAmbient);

// 3. Replace setAmbientVolume
const setAmbientVolumeRegex = /public setAmbientVolume\([^\{]+\{[\s\S]*?(?=\/\/ Play esports victory)/;
const newSetAmbientVolume = `public setAmbientVolume(vol: number) {
    if (this.htmlAudio && this.currentAmbientType) {
      const compFactor = this.volumeCompensation[this.currentAmbientType] || 1.0;
      const target = Math.max(0, Math.min(1, vol * compFactor));
      this.htmlAudio.volume = target;
    }
  }

  `;
content = content.replace(setAmbientVolumeRegex, newSetAmbientVolume);

// 4. Modify stopAmbient
const stopAmbientRegex = /public stopAmbient\(\) \{[\s\S]*?this\.noiseInterval = null;\n    \}/;
const newStopAmbient = `public stopAmbient() {
    if (this.htmlAudio) {
      this.htmlAudio.pause();
    }
  }`;
content = content.replace(stopAmbientRegex, newStopAmbient);

fs.writeFileSync('src/lib/audio.ts', content);
