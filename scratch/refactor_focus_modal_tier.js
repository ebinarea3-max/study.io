const fs = require('fs');
const path = 'src/components/timer/FocusModeModal.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Central Timer ambient glow
content = content.replace(
  'bg-[radial-gradient(circle_at_center,rgba(217,119,6,0.12)_0%,transparent_70%)]',
  'bg-[radial-gradient(circle_at_center,var(--tier-glow)_0%,transparent_70%)]'
);

// Timer dial border
content = content.replace(
  /border-amber-500\/20/g,
  'border-[var(--tier-border)]'
);

// Start Session Button
content = content.replace(
  /bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-semibold text-sm transition-all duration-300 shadow-\[0_0_30px_rgba\(245,158,11,0\.35\)\]/g,
  'bg-[var(--tier-accent)] hover:bg-[var(--tier-accent-hover)] text-slate-950 font-black text-sm transition-all duration-300 shadow-[0_0_30px_var(--tier-glow)]'
);

// Synced indicator ping
content = content.replace(
  /'bg-amber-400 animate-pulse'/g,
  "'bg-[var(--tier-accent)] animate-pulse'"
);

// Studying as
content = content.replace(
  'text-amber-400 font-medium',
  'text-[var(--tier-accent)] font-medium'
);

// Popover Menu changes
content = content.replace(
  /hover:border-amber-500\/30/g,
  'hover:border-[var(--tier-border)]'
);
content = content.replace(
  /'text-amber-500'/g,
  "'text-[var(--tier-accent)]'"
);
content = content.replace(
  /bg-amber-400 animate-pulse/g,
  'bg-[var(--tier-accent)] animate-pulse'
);
content = content.replace(
  /'bg-amber-500\/15 text-amber-300'/g,
  "'bg-[var(--tier-accent)]/[0.15] text-[var(--tier-accent)]'"
);
content = content.replace(
  /<Check className="w-4 h-4 text-amber-400" \/>/g,
  '<Check className="w-4 h-4 text-[var(--tier-accent)]" />'
);

// Volume slider
content = content.replace(
  /accent-amber-500/g,
  'accent-[var(--tier-accent)]'
);

// Status dots
content = content.replace(
  /'bg-amber-400 animate-ping'/g,
  "'bg-[var(--tier-accent)] animate-ping'"
);
content = content.replace(
  /'bg-amber-400 animate-bounce'/g,
  "'bg-[var(--tier-accent)] animate-bounce'"
);

// Bottom Popover Menu Container -> A standard card layout with a title header
content = content.replace(
  /<div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-\[var\(--border\)\]">/,
  '<div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pt-4">'
);
content = content.replace(
  /<div className="relative">/,
  `<div className="relative">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1 font-hud">Atmosphere</div>`
);


// Break banners
content = content.replace(
  /bg-amber-500\/20 border border-amber-500\/40 text-amber-200 text-xs font-semibold backdrop-blur-md shadow-xl shadow-amber-500\/10/g,
  'bg-[var(--tier-accent)]/[0.15] border border-[var(--tier-border)] text-[var(--tier-accent)] text-xs font-semibold backdrop-blur-md shadow-xl'
);
content = content.replace(
  /text-amber-300 animate-pulse/g,
  'text-[var(--tier-accent)] animate-pulse'
);
content = content.replace(
  /hover:bg-amber-500\/20 text-amber-300/g,
  'hover:bg-[var(--tier-accent)]/[0.2] text-[var(--tier-accent)]'
);

// Pause Break button
content = content.replace(
  /text-amber-300 font-bold text-sm border border-amber-500\/30/g,
  'text-[var(--tier-accent)] font-bold text-sm border border-[var(--tier-border)]'
);

fs.writeFileSync(path, content, 'utf8');
console.log('Tier colors applied');
