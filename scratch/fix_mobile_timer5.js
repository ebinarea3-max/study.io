const fs = require('fs');
const path = require('path');

const timerPath = path.join(__dirname, '../src/components/timer/StudyTimer.tsx');
let timer = fs.readFileSync(timerPath, 'utf8');

// Replace the main wrapper for StudyTimer
timer = timer.replace(
  /<div className="w-full max-w-6xl mx-auto flex-1 flex flex-col md:grid md:grid-cols-1 lg:grid-cols-12 justify-between md:justify-start gap-2 sm:gap-4 lg:gap-6 max-md:overflow-hidden md:overflow-visible py-2 md:p-0">/g,
  '<div className="w-full max-w-6xl mx-auto max-md:h-[calc(100dvh-8.5rem)] flex max-md:flex-col max-md:justify-between max-md:items-center md:grid md:grid-cols-1 lg:grid-cols-12 md:justify-start gap-2 sm:gap-4 lg:gap-6 max-md:overflow-hidden md:overflow-visible max-md:px-2 max-md:py-2 md:p-0">'
);

// Replace the left column wrapper
timer = timer.replace(
  /<div className="lg:col-span-8 flex-1 flex flex-col justify-between max-md:overflow-hidden md:overflow-visible space-y-0 md:space-y-3">/g,
  '<div className="lg:col-span-8 w-full h-full flex flex-col justify-between max-md:overflow-hidden md:overflow-visible space-y-0 md:space-y-3">'
);

// Replace the card itself
timer = timer.replace(
  /<div\s+className="relative rounded-3xl bg-\[var\(--surface\)\] backdrop-blur-xl border border-\[var\(--border\)\] p-2 sm:p-8 lg:p-10 shadow-xl overflow-hidden flex-1 flex flex-col justify-between transition-all mb-2"/g,
  '<div className="relative w-full h-full rounded-3xl bg-[var(--surface)] backdrop-blur-xl border border-[var(--border)] max-md:px-4 max-md:py-2 sm:p-8 lg:p-10 shadow-xl max-md:overflow-hidden md:overflow-hidden flex flex-col max-md:justify-between max-md:items-center md:justify-between transition-all max-md:mb-0 mb-2"'
);

// Center the top section on mobile
timer = timer.replace(
  /<div className="w-full flex flex-wrap items-center justify-between gap-2\.5 sm:gap-4 relative z-10 pb-2 sm:pb-6 border-b border-\[var\(--border\)\] flex-shrink-0">/g,
  '<div className="w-full flex flex-wrap items-center max-md:justify-center justify-between gap-2.5 sm:gap-4 relative z-10 max-md:pb-2 sm:pb-6 max-md:border-b-0 border-b border-[var(--border)] flex-shrink-0 max-md:w-full">'
);

// Fix the center timer section dial size
timer = timer.replace(
  /<div className="relative z-10 flex-1 flex flex-col items-center justify-center py-2 sm:py-6 min-h-\[200px\]">/g,
  '<div className="relative z-10 flex flex-col items-center justify-center py-2 sm:py-6">'
);

timer = timer.replace(
  /className=\{`relative flex items-center justify-center p-1 sm:p-2 w-full max-w-\[220px\] sm:max-w-\[256px\] md:max-w-\[320px\] aspect-square transition-all duration-300 rounded-full mx-auto/g,
  'className={`relative flex items-center justify-center p-1 sm:p-2 w-56 h-56 sm:w-64 sm:h-64 md:w-80 md:h-80 mx-auto aspect-square transition-all duration-300 rounded-full flex-shrink-0'
);

// Fix the bottom action buttons section
timer = timer.replace(
  /<div className="mt-auto pt-3 sm:pt-8 flex flex-wrap items-center justify-center gap-2\.5 sm:gap-3 relative z-10 w-full flex-shrink-0">/g,
  '<div className="max-md:mb-2 max-md:mt-0 pt-3 sm:pt-8 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 relative z-10 w-full max-w-sm flex-shrink-0">'
);

fs.writeFileSync(timerPath, timer, 'utf8');
console.log('Mobile layout exact fixes applied');
