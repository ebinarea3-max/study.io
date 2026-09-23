const fs = require('fs');

const timerPath = './src/components/timer/StudyTimer.tsx';
let timer = fs.readFileSync(timerPath, 'utf8');

// 1. Remove flex-shrink-0 from the outer wrapper of the dial, use flex-1 so it can absorb space flexibly
timer = timer.replace(
  /className="relative z-10 flex flex-col items-center justify-center py-0 sm:py-6 flex-shrink-0"/g,
  'className="relative z-10 flex-1 flex flex-col items-center justify-center py-2 sm:py-6 min-h-[200px]"'
);

// 2. Make the dial fully responsive using flexbox and percentages instead of hardcoded w-52
timer = timer.replace(
  /className=\{`relative flex-shrink-0 flex items-center justify-center p-1 sm:p-2 w-52 h-52 sm:w-64 sm:h-64 md:w-80 md:h-80 mx-auto aspect-square transition-all duration-300 rounded-full/g,
  'className={`relative flex items-center justify-center p-1 sm:p-2 w-full max-w-[220px] sm:max-w-[256px] md:max-w-[320px] aspect-square transition-all duration-300 rounded-full mx-auto'
);

// 3. Inner dial max dimensions
timer = timer.replace(
  /className="w-\[78%\] h-\[78%\] max-w-\[200px\] max-h-\[200px\] sm:max-w-none sm:max-h-none/g,
  'className="w-[78%] h-[78%]'
);

// 4. Change top controls wrapper to not overlap
timer = timer.replace(
  /className="flex flex-wrap items-center justify-between gap-2\.5 sm:gap-4 relative z-10 pb-3 sm:pb-6 border-b border-\[var\(--border\)\] flex-shrink-0"/g,
  'className="w-full flex flex-wrap items-center justify-between gap-2.5 sm:gap-4 relative z-10 pb-2 sm:pb-6 border-b border-[var(--border)] flex-shrink-0"'
);

// 5. Change bottom controls wrapper to not overlap
timer = timer.replace(
  /className="mt-auto pt-2 sm:pt-8 flex flex-wrap items-center justify-center gap-2\.5 sm:gap-3 relative z-10 w-full flex-shrink-0 mb-1 sm:mb-0"/g,
  'className="mt-auto pt-3 sm:pt-8 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 relative z-10 w-full flex-shrink-0"'
);

fs.writeFileSync(timerPath, timer, 'utf8');

console.log('Fixed Mobile Timer Disappearance 4');
