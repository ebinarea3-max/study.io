const fs = require('fs');
let code = fs.readFileSync('src/lib/audio.ts', 'utf8');
code = code.replace('export const soundFx = new AudioEngine();', 
\  public playAlarm() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      for (let i = 0; i < 4; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, now + i * 0.25);
        gain.gain.setValueAtTime(0, now + i * 0.25);
        gain.gain.linearRampToValueAtTime(0.15, now + i * 0.25 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.25 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.25);
        osc.stop(now + i * 0.25 + 0.22);
      }
    } catch {}
  }
}

export const soundFx = new AudioEngine();\);
// Note: need to remove the previous closing brace of class
code = code.replace('}\r\n\r\n  public playAlarm()', '  public playAlarm()');
code = code.replace('}\n\n  public playAlarm()', '  public playAlarm()');
code = code.replace('}\r\nexport const soundFx', '}\nexport const soundFx');
code = code.replace('}\nexport const soundFx', '  public playAlarm'); // Let's just do it manually by finding the last index of '}' before 'export const'
