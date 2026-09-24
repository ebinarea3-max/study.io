const fs = require('fs');
const path = require('path');

const timerPath = path.join(__dirname, '../src/components/timer/StudyTimer.tsx');
let timer = fs.readFileSync(timerPath, 'utf8');

// Remove mt-auto from the action buttons wrapper so that justify-between balances them evenly
timer = timer.replace(
  /className="max-md:mb-2 max-md:mt-auto pt-3 sm:pt-8 flex flex-wrap items-center justify-center gap-2\.5 sm:gap-3 relative z-10 w-full max-w-sm flex-shrink-0 mx-auto"/g,
  'className="max-md:mb-2 pt-3 sm:pt-8 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 relative z-10 w-full max-w-sm flex-shrink-0 mx-auto"'
);

// Update the "START FOCUS SESSION" button for high contrast and boldness
timer = timer.replace(
  /className="px-8 sm:px-10 py-3\.5 sm:py-4 font-sans font-semibold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2\.5 w-full xs:w-auto rounded-xl cursor-pointer hover:scale-\[1\.02\]"/g,
  'className="px-8 sm:px-10 py-3.5 sm:py-4 font-sans font-bold text-sm uppercase tracking-wide transition-all flex items-center justify-center gap-2.5 w-full xs:w-auto rounded-xl cursor-pointer hover:scale-[1.02]"'
);

timer = timer.replace(
  /className={`px-8 sm:px-10 py-3\.5 sm:py-4 font-sans font-semibold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2\.5 w-full xs:w-auto rounded-xl \${/g,
  'className={`px-8 sm:px-10 py-3.5 sm:py-4 font-sans font-bold text-sm uppercase tracking-wide transition-all flex items-center justify-center gap-2.5 w-full xs:w-auto rounded-xl ${'
);

timer = timer.replace(
  /style={{ background: '#10B981', color: '#021C11', fontWeight: 700, border: 'none', boxShadow: '0 4px 20px rgba\(16, 185, 129, 0\.3\)' }}/g,
  `style={{ background: '#10B981', color: '#021C11', fontWeight: 800, border: 'none', boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)' }}`
);

// Make sure the main card uses justify-between and py-6 px-4 as requested
timer = timer.replace(
  /<div className="relative w-full h-full rounded-3xl bg-\[var\(--surface\)\] backdrop-blur-xl border border-\[var\(--border\)\] max-md:px-4 max-md:py-2 sm:p-8 lg:p-10 shadow-xl max-md:overflow-hidden md:overflow-hidden flex flex-col max-md:justify-between max-md:items-center md:justify-between transition-all max-md:mb-0 mb-2"/g,
  '<div className="relative w-full h-full rounded-3xl bg-[var(--surface)] backdrop-blur-xl border border-[var(--border)] max-md:px-4 max-md:py-6 sm:p-8 lg:p-10 shadow-xl max-md:overflow-hidden md:overflow-hidden flex flex-col max-md:justify-between max-md:items-center md:justify-between transition-all max-md:mb-0 mb-2"'
);

fs.writeFileSync(timerPath, timer, 'utf8');
console.log('Fixed vertical alignment void and contrast 7');
