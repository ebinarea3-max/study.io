const fs = require('fs');

// 1. page.tsx
const pagePath = './src/app/page.tsx';
let page = fs.readFileSync(pagePath, 'utf8');

page = page.replace(
  /<div className="max-md:h-\[100dvh\] max-md:overflow-hidden md:min-h-screen w-full md:overflow-y-auto bg-\[var\(--bg\)\] text-slate-100 flex flex-col relative selection:bg-\[var\(--tier-accent\)\]\/30 selection:text-\[var\(--tier-text-accent\)\]">/,
  '<div className="h-[100dvh] w-full md:min-h-screen bg-[var(--bg)] text-slate-100 flex flex-col relative overflow-hidden md:overflow-y-auto selection:bg-emerald-500/30 selection:text-emerald-400">'
);

page = page.replace(
  /className=\{`flex-1 max-w-7xl w-full mx-auto relative z-10 flex flex-col max-md:overflow-hidden md:overflow-visible \$\{\n\s*activeTab === 'timer'\n\s*\? 'p-0 md:px-6 md:py-4 pb-0 md:pb-4 max-md:overflow-hidden md:overflow-visible'\n\s*: 'px-3\.5 sm:px-6 py-5 sm:py-8 pb-24 md:pb-12 overflow-y-auto overscroll-contain'\n\s*\}`\}/,
  "className={`max-w-7xl w-full mx-auto relative z-10 ${activeTab === 'timer' ? 'flex-1 overflow-hidden flex flex-col justify-between px-4 pb-20 pt-2 md:px-6 md:py-4 md:pb-4' : 'flex-1 overflow-y-auto overscroll-contain pb-24 px-4 pt-2 md:px-6 md:py-8'}`}"
);

fs.writeFileSync(pagePath, page, 'utf8');

// 2. Navbar.tsx
const navPath = './src/components/common/Navbar.tsx';
let nav = fs.readFileSync(navPath, 'utf8');

nav = nav.replace(
  /style=\{\{\n\s*width: '25%',\n\s*transform: `translateX\(\$\{\n\s*activeTab === 'timer' \? '0%' : activeTab === 'tasks' \? '100%' : activeTab === 'analytics' \? '200%' : '300%'\n\s*\}\)`,\n\s*background: theme\.gradient,\n\s*boxShadow: `0 0 20px \$\{theme\.glow\}`,\n\s*\}\}/,
  "style={{\n            width: '25%',\n            transform: `translateX(${activeTab === 'timer' ? '0%' : activeTab === 'tasks' ? '100%' : activeTab === 'analytics' ? '200%' : '300%' })`\n          }}\n          className=\"absolute top-0 bottom-0 rounded-full transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none bg-white/15 border border-white/20\""
);
fs.writeFileSync(navPath, nav, 'utf8');

// 3. StudyTimer.tsx
const timerPath = './src/components/timer/StudyTimer.tsx';
let timer = fs.readFileSync(timerPath, 'utf8');

timer = timer.replace(
  /<div className="w-\[78%\] h-\[78%\] rounded-full bg-\[var\(--bg\)\] flex flex-col items-center justify-center p-2\.5 sm:p-6 text-center relative z-10 shadow-inner"/,
  '<div className="w-[78%] h-[78%] max-w-[200px] max-h-[200px] sm:max-w-none sm:max-h-none rounded-full bg-[var(--bg)] flex flex-col items-center justify-center p-2.5 sm:p-6 text-center relative z-10 shadow-inner"'
);

timer = timer.replace(
  /className="flex flex-col md:grid md:grid-cols-12 gap-0 md:gap-6 flex-1 h-full min-h-0"/,
  'className="flex flex-col md:grid md:grid-cols-12 gap-0 md:gap-6 flex-1 h-full min-h-0 justify-between"'
);

timer = timer.replace(
  /className="lg:col-span-8 flex-1 flex flex-col justify-between md:justify-start overflow-hidden space-y-0 md:space-y-3"/,
  'className="lg:col-span-8 flex-1 flex flex-col justify-between overflow-hidden space-y-0 md:space-y-3"'
);

timer = timer.replace(
  /className="relative rounded-3xl bg-\[var\(--surface\)\] backdrop-blur-xl border border-\[var\(--border\)\] p-3\.5 sm:p-8 lg:p-10 shadow-xl overflow-hidden flex-1 md:flex-initial flex flex-col justify-between transition-all"/,
  'className="relative rounded-3xl bg-[var(--surface)] backdrop-blur-xl border border-[var(--border)] p-3.5 sm:p-8 lg:p-10 shadow-xl overflow-hidden flex-1 md:flex-initial flex flex-col justify-between transition-all mb-2"'
);

timer = timer.replace(
  /<div className="relative aspect-square w-full max-w-\[300px\] sm:max-w-\[400px\] md:max-w-\[420px\] mx-auto flex items-center justify-center filter drop-shadow-2xl">/,
  '<div className="relative aspect-square w-full max-w-[240px] sm:max-w-[400px] md:max-w-[420px] mx-auto flex items-center justify-center filter drop-shadow-2xl">'
);

fs.writeFileSync(timerPath, timer, 'utf8');
console.log('Mobile layout fixes applied.');
