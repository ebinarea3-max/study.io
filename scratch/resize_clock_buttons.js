const fs = require('fs');
let content = fs.readFileSync('src/components/timer/FocusModeModal.tsx', 'utf8');

// 1. Resize clock scale
const oldScale = "className={`flex items-center justify-center gap-3 sm:gap-6 transition-all duration-700 ease-in-out ${isStudying && !isPaused ? 'scale-[1.15] sm:scale-125 translate-y-4' : 'scale-100 translate-y-0'}`}";
const newScale = "className={`flex items-center justify-center gap-3 sm:gap-6 transition-all duration-700 ease-in-out ${isStudying ? (isPaused ? 'scale-[1.15] sm:scale-[1.3] translate-y-2' : 'scale-[1.4] sm:scale-[1.7] md:scale-[2.1] translate-y-6') : 'scale-100 translate-y-0'}`}";
content = content.replace(oldScale, newScale);

// 2. Button resizing (Pause)
content = content.replace(
  'className="px-6 py-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-[var(--tier-accent)] font-bold text-sm border border-[var(--tier-border)] transition-all flex items-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"',
  'className="px-4 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-[var(--tier-accent)] font-bold text-xs border border-[var(--tier-border)] transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"'
);

// 3. Button resizing (Stop & Save) - there are two instances (Running and Paused states)
content = content.replaceAll(
  'className="px-6 py-3 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-sm transition-all flex items-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"',
  'className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"'
);

// 4. Button resizing (Resume)
content = content.replace(
  'className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"',
  'className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"'
);

// 5. Button resizing (Reset)
content = content.replace(
  'className="p-3 rounded-2xl bg-slate-900/50 hover:bg-slate-800 border border-slate-800 text-neutral-500 hover:text-white transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"',
  'className="p-2 rounded-xl bg-slate-900/50 hover:bg-slate-800 border border-slate-800 text-neutral-500 hover:text-white transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"'
);

fs.writeFileSync('src/components/timer/FocusModeModal.tsx', content);
console.log('Modifications complete.');
