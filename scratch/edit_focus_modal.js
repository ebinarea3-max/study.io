const fs = require('fs');
const path = 'src/components/timer/FocusModeModal.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Central Timer ambient glow
content = content.replace(
  '<div className="relative z-10 my-auto flex flex-col items-center justify-center text-center">',
  '<div className="relative z-10 my-auto flex flex-col items-center justify-center text-center">\n        {/* Soft Radial Gradient Glow Behind Timer */}\n        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(217,119,6,0.12)_0%,transparent_70%)] pointer-events-none" />'
);

// 2. Central Timer & Button
content = content.replace(
  'className="w-72 h-72 sm:w-96 sm:h-96 rounded-full border-2 border-dashed animate-pulse-breathe flex items-center justify-center transition-all duration-700"',
  'className="w-72 h-72 sm:w-96 sm:h-96 rounded-full border-2 border-dashed border-amber-500/20 animate-pulse-breathe flex items-center justify-center transition-all duration-700"'
);
content = content.replace(
  /style=\{\{\n\s*borderColor: `\$\{subjectColor\}40`,\n\s*boxShadow: isStudying && !isPaused \? `0 0 80px \$\{subjectColor\}25` : \'none\',\n\s*\}\}/,
  'style={{ boxShadow: isStudying && !isPaused ? `0 0 80px ${subjectColor}25` : \'none\' }}'
);
content = content.replace(
  'className="w-60 h-60 sm:w-80 sm:h-80 rounded-full border border-slate-800 bg-slate-950/60 backdrop-blur-2xl flex flex-col items-center justify-center p-6 shadow-2xl"',
  'className="w-60 h-60 sm:w-80 sm:h-80 rounded-full border border-amber-500/20 bg-gradient-to-b from-[#0c0d12] to-[#121318] flex flex-col items-center justify-center p-6 shadow-2xl"'
);
content = content.replace(
  /style=\{\{ borderColor: `\$\{subjectColor\}50` \}\}/,
  ''
);

content = content.replace(
  'className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm transition-all shadow-xl shadow-emerald-500/25 flex items-center gap-2.5 active:scale-95 hover:scale-[1.02] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"',
  'className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-semibold text-sm transition-all duration-300 shadow-[0_0_30px_rgba(245,158,11,0.35)] flex items-center gap-2.5 active:scale-95 hover:scale-[1.02] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"'
);

// 3. Header & Status Indicators
content = content.replace(
  /className=\{`flex items-center gap-1\.5 px-3 py-1\.5 rounded-xl text-xs font-semibold backdrop-blur-md transition-all \$\{\n\s*isSyncConnected\n\s*\? \'bg-emerald-500\/10 text-emerald-400 border border-emerald-500\/20\'\n\s*: \'bg-amber-500\/10 text-amber-400 border border-amber-500\/30\'\n\s*\}`\}/,
  'className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-md transition-all bg-white/5 border border-white/10 text-neutral-300"'
);
content = content.replace(
  'Studying as <span className="text-emerald-400 font-medium">',
  'Studying as <span className="text-amber-400 font-medium">'
);
content = content.replace(
  'className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono"',
  'className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono tracking-widest uppercase"'
);

// 4. Bottom Atmosphere Selector
const activeClass = "bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]";
const inactiveClass = "bg-white/[0.03] border-white/10 text-neutral-400 hover:text-white hover:bg-white/[0.06]";

content = content.replace(/ambientSound === 'none'\n\s*\? 'bg-white\/\[0\.12\] text-white border border-white\/25 shadow-sm shadow-white\/5'\n\s*: 'bg-white\/\[0\.03\] hover:bg-white\/\[0\.08\] text-neutral-400 hover:text-white border border-white\/\[0\.06\] hover:border-\[var\(--border\)\]'/g,
`ambientSound === 'none' ? '${activeClass}' : '${inactiveClass}'`);

content = content.replace(/ambientSound === 'whitenoise'\n\s*\? 'bg-teal-500\/15 text-teal-200 border border-teal-500\/40 shadow-sm shadow-teal-500\/20'\n\s*: 'bg-white\/\[0\.03\] hover:bg-white\/\[0\.08\] text-neutral-400 hover:text-white border border-white\/\[0\.06\] hover:border-\[var\(--border\)\]'/g,
`ambientSound === 'whitenoise' ? '${activeClass}' : '${inactiveClass}'`);

content = content.replace(/ambientSound === 'brownnoise'\n\s*\? 'bg-amber-600\/20 text-amber-200 border border-amber-600\/40 shadow-sm shadow-amber-500\/20'\n\s*: 'bg-white\/\[0\.03\] hover:bg-white\/\[0\.08\] text-neutral-400 hover:text-white border border-white\/\[0\.06\] hover:border-\[var\(--border\)\]'/g,
`ambientSound === 'brownnoise' ? '${activeClass}' : '${inactiveClass}'`);

content = content.replace(/ambientSound === 'rain'\n\s*\? 'bg-blue-500\/15 text-blue-200 border border-blue-500\/40 shadow-sm shadow-blue-500\/20'\n\s*: 'bg-white\/\[0\.03\] hover:bg-white\/\[0\.08\] text-neutral-400 hover:text-white border border-white\/\[0\.06\] hover:border-\[var\(--border\)\]'/g,
`ambientSound === 'rain' ? '${activeClass}' : '${inactiveClass}'`);

content = content.replace(/ambientSound === 'lofi'\n\s*\? 'bg-purple-500\/15 text-purple-200 border border-purple-500\/40 shadow-sm shadow-purple-500\/20'\n\s*: 'bg-white\/\[0\.03\] hover:bg-white\/\[0\.08\] text-neutral-400 hover:text-white border border-white\/\[0\.06\] hover:border-\[var\(--border\)\]'/g,
`ambientSound === 'lofi' ? '${activeClass}' : '${inactiveClass}'`);

content = content.replace(/ambientSound === 'campfire'\n\s*\? 'bg-orange-500\/15 text-orange-200 border border-orange-500\/40 shadow-sm shadow-orange-500\/20'\n\s*: 'bg-white\/\[0\.03\] hover:bg-white\/\[0\.08\] text-neutral-400 hover:text-white border border-white\/\[0\.06\] hover:border-\[var\(--border\)\]'/g,
`ambientSound === 'campfire' ? '${activeClass}' : '${inactiveClass}'`);

content = content.replace(/ambientSound === 'waves'\n\s*\? 'bg-cyan-500\/15 text-cyan-200 border border-cyan-500\/40 shadow-sm shadow-cyan-500\/20'\n\s*: 'bg-white\/\[0\.03\] hover:bg-white\/\[0\.08\] text-neutral-400 hover:text-white border border-white\/\[0\.06\] hover:border-\[var\(--border\)\]'/g,
`ambientSound === 'waves' ? '${activeClass}' : '${inactiveClass}'`);

// Icons
content = content.replace(/<Music className="w-3\.5 h-3\.5 text-emerald-400" \/>/g, '<Music className="w-3.5 h-3.5 text-amber-500" />');
content = content.replace(/<Radio className="w-3\.5 h-3\.5 text-teal-400" \/>/g, '<Radio className="w-3.5 h-3.5" />');
content = content.replace(/<Headphones className="w-3\.5 h-3\.5 text-amber-400" \/>/g, '<Headphones className="w-3.5 h-3.5" />');
content = content.replace(/<CloudRain className="w-3\.5 h-3\.5 text-blue-400" \/>/g, '<CloudRain className="w-3.5 h-3.5" />');
content = content.replace(/<Sparkles className="w-3\.5 h-3\.5 text-purple-400" \/>/g, '<Sparkles className="w-3.5 h-3.5" />');
content = content.replace(/<Flame className="w-3\.5 h-3\.5 text-orange-400" \/>/g, '<Flame className="w-3.5 h-3.5" />');
content = content.replace(/<Waves className="w-3\.5 h-3\.5 text-cyan-400" \/>/g, '<Waves className="w-3.5 h-3.5" />');

// Indicator dots
content = content.replace(/<span className="w-1\.5 h-1\.5 rounded-full bg-teal-400 animate-pulse" \/>/g, '<span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />');
content = content.replace(/<span className="w-1\.5 h-1\.5 rounded-full bg-blue-400 animate-pulse" \/>/g, '<span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />');
content = content.replace(/<span className="w-1\.5 h-1\.5 rounded-full bg-purple-400 animate-pulse" \/>/g, '<span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />');
content = content.replace(/<span className="w-1\.5 h-1\.5 rounded-full bg-orange-400 animate-pulse" \/>/g, '<span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />');
content = content.replace(/<span className="w-1\.5 h-1\.5 rounded-full bg-cyan-400 animate-pulse" \/>/g, '<span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />');

// Status ping dot
content = content.replace(
  `                      ? 'bg-emerald-400 animate-ping'
                      : pomodoroCompletedPhase === 'break'
                      ? 'bg-amber-400 animate-bounce'
                      : isStudying && !isPaused
                      ? 'bg-emerald-400 animate-ping'`,
  `                      ? 'bg-amber-400 animate-ping'
                      : pomodoroCompletedPhase === 'break'
                      ? 'bg-amber-400 animate-bounce'
                      : isStudying && !isPaused
                      ? 'bg-amber-400 animate-ping'`
);


fs.writeFileSync(path, content, 'utf8');
