const fs = require('fs');
const studyTimerPath = './src/components/timer/StudyTimer.tsx';
let timer = fs.readFileSync(studyTimerPath, 'utf8');

timer = timer.replace(
  /className="w-\[78%\] h-\[78%\] rounded-full bg-\[var\(--bg\)\] border-2 flex flex-col items-center justify-center p-2\.5 sm:p-6 text-center relative z-10 shadow-inner"[\s\S]*?style=\{\{.*?\}\}/,
  'className="w-[78%] h-[78%] rounded-full bg-[var(--bg)] border flex flex-col items-center justify-center p-2.5 sm:p-6 text-center relative z-10 shadow-inner"\n                style={{ borderColor: "rgba(255, 255, 255, 0.1)", boxShadow: "inset 0 2px 10px rgba(0, 0, 0, 0.8)" }}'
);

timer = timer.replace(
  /className="font-hud font-black text-4xl sm:text-5xl md:text-6xl tracking-wider text-white drop-shadow-lg tabular-nums select-none"[\s\S]*?style=\{\{.*?\}\}/,
  'className="font-mono text-4xl sm:text-5xl md:text-6xl tracking-tight text-white drop-shadow-lg tabular-nums select-none"\n                  style={{ textShadow: isStudying && !isPaused ? "0 0 16px var(--glow)" : undefined }}'
);

fs.writeFileSync(studyTimerPath, timer, 'utf8');
console.log('Fixed dial digits and bezel');
