const fs = require('fs');

const timerPath = './src/components/timer/StudyTimer.tsx';
let timer = fs.readFileSync(timerPath, 'utf8');

timer = timer.replace(
  /w-64 h-64 sm:w-80 sm:h-80/g,
  'w-52 h-52 sm:w-64 sm:h-64 md:w-80 md:h-80'
);

timer = timer.replace(
  /text-4xl sm:text-5xl md:text-6xl/g,
  'text-3xl sm:text-4xl md:text-5xl'
);

timer = timer.replace(
  /className="relative z-10 flex flex-col items-center justify-center my-auto py-1 sm:py-6 flex-shrink-0"/g,
  'className="relative z-10 flex flex-col items-center justify-center py-1 sm:py-6 flex-shrink-0"'
);

timer = timer.replace(
  /p-3\.5 sm:p-8 lg:p-10 shadow-xl overflow-hidden flex-1 md:flex-initial flex flex-col justify-between transition-all mb-2/g,
  'p-2 sm:p-8 lg:p-10 shadow-xl overflow-hidden flex-1 md:flex-initial flex flex-col justify-between transition-all mb-2'
);

timer = timer.replace(
  /className="w-full max-w-6xl mx-auto max-md:h-full flex flex-col md:grid md:grid-cols-1 lg:grid-cols-12 justify-between md:justify-start gap-4 lg:gap-6 max-md:overflow-hidden md:overflow-visible p-4 pb-24 md:p-0"/g,
  'className="w-full max-w-6xl mx-auto max-md:h-full flex flex-col md:grid md:grid-cols-1 lg:grid-cols-12 justify-between md:justify-start gap-2 sm:gap-4 lg:gap-6 max-md:overflow-hidden md:overflow-visible py-2 md:p-0"'
);

timer = timer.replace(
  /className="flex items-center justify-center flex-wrap gap-2\.5 sm:gap-4 w-full relative z-10"/g,
  'className="flex items-center justify-center flex-wrap gap-2.5 sm:gap-4 w-full relative z-10 mb-1"'
);

fs.writeFileSync(timerPath, timer, 'utf8');
console.log('Fixed Mobile Timer Spacing');
