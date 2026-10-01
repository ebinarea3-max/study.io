const fs = require('fs');

let content = fs.readFileSync('src/components/timer/StudyTimer.tsx', 'utf8');

// Compact Daily Overview
content = content.replace(
  'bg-[var(--surface)] backdrop-blur-xl border border-[var(--border)] p-5 shadow-xl space-y-4',
  'bg-[var(--surface)] backdrop-blur-xl border border-[var(--border)] py-3 px-4 shadow-xl space-y-2.5'
);

// Header mb-4 to mb-2.5 (Actually pb-3 to pb-2.5)
content = content.replace(
  'pb-3 border-b border-[var(--border)] relative z-10',
  'pb-2.5 border-b border-[var(--border)] relative z-10'
);

// Reduce gap between the 3 rows: py-2.5 sm:py-3 -> py-2
content = content.replace(
  /py-2\.5 sm:py-3/g,
  'py-2'
);

// Sub-labels: text-[11px] -> text-[10px]
content = content.replace(
  /text-\[11px\]/g,
  'text-[10px]'
);

// Daily Directive padding
content = content.replace(
  'bg-[var(--surface)] backdrop-blur-xl border border-[var(--border)] p-5 shadow-xl space-y-3',
  'bg-[var(--surface)] backdrop-blur-xl border border-[var(--border)] py-2.5 px-3.5 shadow-xl space-y-3'
);

fs.writeFileSync('src/components/timer/StudyTimer.tsx', content);
