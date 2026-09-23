const fs = require('fs');
const path = require('path');

const timerPath = path.join(__dirname, '../src/components/timer/StudyTimer.tsx');
let timer = fs.readFileSync(timerPath, 'utf8');

// Replace the card itself
timer = timer.replace(
  /className="relative rounded-3xl bg-\[var\(--surface\)\] backdrop-blur-xl border border-\[var\(--border\)\] p-2 sm:p-8 lg:p-10 shadow-xl overflow-hidden flex-1 md:flex-initial flex flex-col justify-between transition-all mb-2"/g,
  'className="relative w-full h-full rounded-3xl bg-[var(--surface)] backdrop-blur-xl border border-[var(--border)] max-md:px-4 max-md:py-2 sm:p-8 lg:p-10 shadow-xl max-md:overflow-hidden md:overflow-hidden flex flex-col max-md:justify-between max-md:items-center md:justify-between transition-all max-md:mb-0 mb-2"'
);

// Replace button bottom margin to ensure it sits above navbar
timer = timer.replace(
  /className="max-md:mb-2 max-md:mt-0 pt-3 sm:pt-8 flex flex-wrap items-center justify-center gap-2\.5 sm:gap-3 relative z-10 w-full max-w-sm flex-shrink-0"/g,
  'className="max-md:mb-2 max-md:mt-auto pt-3 sm:pt-8 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 relative z-10 w-full max-w-sm flex-shrink-0 mx-auto"'
);

fs.writeFileSync(timerPath, timer, 'utf8');
console.log('Mobile layout exact fixes applied 6');
