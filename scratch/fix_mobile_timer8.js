const fs = require('fs');
const path = require('path');

const timerPath = path.join(__dirname, '../src/components/timer/StudyTimer.tsx');
let timer = fs.readFileSync(timerPath, 'utf8');

// 1. Group Top Controls and Subject Selector
// Find the start of Top Controls:
const topControlsStart = timer.indexOf('{/* Top Controls: Mode Switcher, Preset Selector & Focus Mode Button */}');
// Find the end of Subject Selector Bar:
// It ends right before {/* Center Timer Display - Game HUD Radar / Reactor Core Display */}
const centerTimerStart = timer.indexOf('{/* Center Timer Display - Game HUD Radar / Reactor Core Display */}');

if (topControlsStart !== -1 && centerTimerStart !== -1) {
  let topSection = timer.substring(topControlsStart, centerTimerStart);
  
  // Clean up the wrappers inside the top section
  // Replace Top Controls wrapper
  topSection = topSection.replace(
    /className="w-full flex flex-wrap items-center max-md:justify-center justify-between gap-2\.5 sm:gap-4 relative z-10 max-md:pb-2 sm:pb-6 max-md:border-b-0 border-b border-\[var\(--border\)\] flex-shrink-0 max-md:w-full"/,
    'className="w-full flex flex-wrap items-center max-md:justify-center justify-between gap-2.5 sm:gap-4 relative z-10 sm:pb-6 max-md:border-b-0 border-b border-[var(--border)] flex-shrink-0"'
  );
  
  // Replace Subject Selection Bar wrapper
  topSection = topSection.replace(
    /className="relative z-20 my-2 sm:my-5 flex-shrink-0"/,
    'className="relative z-20 w-full sm:my-5 flex-shrink-0"'
  );
  
  // Wrap them both
  const newTopSection = `<div className="flex flex-col items-center gap-2 w-full relative z-20">\n          ${topSection}        </div>\n\n          `;
  
  timer = timer.substring(0, topControlsStart) + newTopSection + timer.substring(centerTimerStart);
}

// 2. Fix the Fullscreen Focus Mode Button (hidden md:flex)
timer = timer.replace(
  /className="hidden md:flex items-center justify-center gap-2 px-3\.5 sm:px-4 py-2 rounded-xl bg-primary-muted hover:bg-\[rgba\(var\(--tier-accent-rgb\),0\.25\)\] border border-primary-muted text-primary-bright text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"/g,
  'className="hidden md:flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-primary-muted hover:bg-[rgba(var(--tier-accent-rgb),0.25)] border border-primary-muted text-primary-bright text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"'
);

// 3. Fix the card container padding and layout
timer = timer.replace(
  /className="relative w-full h-full rounded-3xl bg-\[var\(--surface\)\] backdrop-blur-xl border border-\[var\(--border\)\] max-md:px-4 max-md:py-6 sm:p-8 lg:p-10 shadow-xl max-md:overflow-hidden md:overflow-hidden flex flex-col max-md:justify-between max-md:items-center md:justify-between transition-all max-md:mb-0 mb-2"/g,
  'className="relative w-full h-full rounded-3xl bg-[var(--surface)] backdrop-blur-xl border border-[var(--border)] max-md:px-4 max-md:py-4 sm:p-8 lg:p-10 shadow-xl max-md:overflow-hidden md:overflow-hidden flex flex-col max-md:justify-between max-md:items-center md:justify-between transition-all max-md:mb-0 mb-2"'
);

// 4. Center Timer Wrapper (my-auto)
timer = timer.replace(
  /className="relative z-10 flex flex-col items-center justify-center py-2 sm:py-6"/g,
  'className="relative z-10 flex flex-col items-center justify-center py-1 sm:py-6 max-md:my-auto"'
);

fs.writeFileSync(timerPath, timer, 'utf8');
console.log('Mobile layout top void fixed');
