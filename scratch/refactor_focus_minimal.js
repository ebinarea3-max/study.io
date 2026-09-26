const fs = require('fs');
const path = 'src/components/timer/FocusModeModal.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. BACKGROUND & REMOVALS
// Replace background with pure black `bg-black`
content = content.replace(
  /bg-\[var\(--bg\)\]/,
  'bg-black'
);

// Remove the background atmospheric ambient glowing blobs
content = content.replace(
  /\{\/\* Background atmospheric ambient glowing blobs \*\/\}[\s\S]*?\/>/,
  ''
);

// Remove the Sync Pill
content = content.replace(
  /\{\/\* Live Sync Status Indicator \*\/\}[\s\S]*?<\/div>\r?\n\s*\{\/\* Notes scratchpad toggle \*\/}/,
  '{/* Notes scratchpad toggle */}'
);

// Remove the Edit3 button (Notes toggle)
content = content.replace(
  /\{\/\* Notes scratchpad toggle \*\/\}[\s\S]*?<\/button>\r?\n\s*\{\/\* Exit Focus Mode \*\/}/,
  '{/* Exit Focus Mode */}'
);

// Adjust Exit Fullscreen Button to be a subtle muted icon/pill
content = content.replace(
  /className="flex items-center gap-1\.5 px-3\.5 py-2 rounded-xl bg-slate-900\/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"/,
  'className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white text-[11px] font-medium transition-all cursor-pointer"'
);

// 2. ELEVATE THE TIMER AESTHETIC
// Remove dashed ring and inner gradient container
content = content.replace(
  /<div className="absolute inset-0 bg-\[radial-gradient\(circle_at_center,var\(--tier-glow\)_0%,transparent_70%\)\] pointer-events-none" \/>/,
  ''
);

// Replace the bulky timer container with an ultra-clean wrapper
content = content.replace(
  /<div\s+className="w-72 h-72 sm:w-96 sm:h-96 rounded-full border-2 border-dashed border-\[var\(--tier-border\)\] animate-pulse-breathe flex items-center justify-center transition-all duration-700"\s+style=\{\{ boxShadow: isStudying && !isPaused \? `0 0 80px \$\{subjectColor\}25` : 'none' \}\}\s+>[\s\S]*?<div\s+className="w-60 h-60 sm:w-80 sm:h-80 rounded-full border border-\[var\(--tier-border\)\] bg-gradient-to-b from-\[#0c0d12\] to-\[#121318\] flex flex-col items-center justify-center p-6 shadow-2xl"\s*>/,
  '<div className="flex flex-col items-center justify-center">'
);

// Remove the two closing </div> tags for the timer container
content = content.replace(
  /<\/div>\s*<\/div>\s*<\/div>\s*\{\/\* Motivational quote \*\/\}/,
  '</div>\n        </div>\n\n        {/* Motivational quote */}'
);

// Typography for digital clock
content = content.replace(
  /className="font-mono text-5xl sm:text-6xl md:text-7xl font-black tracking-tight text-white drop-shadow-md"/,
  'className="font-mono text-7xl sm:text-8xl md:text-[8rem] font-extralight tracking-tight text-white/95 drop-shadow-sm"'
);

// Update Status pill
content = content.replace(
  /<span className="text-xs font-medium text-slate-400">/,
  '<span className="text-xs uppercase tracking-[0.25em] text-neutral-500 font-medium">'
);
// Remove the little dot from status pill
content = content.replace(
  /<span\s+className={`w-2 h-2 rounded-full \$\{[\s\S]*?\}`}\s+\/>/,
  ''
);

// Remove Subject pill if we want it completely minimal, or just tone it down
// The prompt says "Remove the bulky dark circular container", but I will keep the Quote typography sleek:
content = content.replace(
  /className="text-xs sm:text-sm text-slate-400 italic font-medium transition-all duration-500"/,
  'className="text-sm text-neutral-400 italic font-normal tracking-wide transition-all duration-500"'
);

// 3. START SESSION BUTTON
content = content.replace(
  /className="px-8 py-3\.5 rounded-2xl bg-\[var\(--tier-accent\)\] hover:bg-\[var\(--tier-accent-hover\)\] text-slate-950 font-black text-sm transition-all duration-300 shadow-\[0_0_30px_var\(--tier-glow\)\] flex items-center gap-2\.5 active:scale-95 hover:scale-\[1\.02\] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"/,
  'className="px-8 py-3 rounded-full bg-white hover:bg-neutral-200 text-black font-medium text-sm transition-all duration-300 shadow-lg shadow-white/5 flex items-center gap-2 active:scale-95 hover:scale-[1.02] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"'
);

// Ensure the main outer wrapper doesn't have rings
content = content.replace(
  /ring-4 ring-emerald-400\/50 scale-\[1\.03\] shadow-\[0_0_60px_rgba\(16,185,129,0\.4\)\]/,
  'scale-[1.01]'
);

fs.writeFileSync(path, content, 'utf8');
console.log('FocusModeModal completely minimized');
