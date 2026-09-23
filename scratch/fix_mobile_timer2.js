const fs = require('fs');

const timerPath = './src/components/timer/StudyTimer.tsx';
let timer = fs.readFileSync(timerPath, 'utf8');

timer = timer.replace(
  /className="mt-auto pt-4 sm:pt-8 flex flex-wrap items-center justify-center gap-2\.5 sm:gap-3 relative z-10 w-full flex-shrink-0 pb-1 sm:pb-0"/g,
  'className="mt-auto pt-2 sm:pt-8 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 relative z-10 w-full flex-shrink-0 mb-1 sm:mb-0"'
);

timer = timer.replace(
  /className="relative z-10 flex flex-col items-center justify-center py-1 sm:py-6 flex-shrink-0"/g,
  'className="relative z-10 flex flex-col items-center justify-center py-0 sm:py-6 flex-shrink-0"'
);

fs.writeFileSync(timerPath, timer, 'utf8');
console.log('Fixed Mobile Timer Spacing 2');
