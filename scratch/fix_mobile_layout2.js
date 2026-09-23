const fs = require('fs');

// 1. Navbar.tsx
const navPath = './src/components/common/Navbar.tsx';
let nav = fs.readFileSync(navPath, 'utf8');

const badNav = `          style={{
            width: '25%',
            transform: \`translateX(\${activeTab === 'timer' ? '0%' : activeTab === 'tasks' ? '100%' : activeTab === 'analytics' ? '200%' : '300%' })\`
          }}
          className="absolute top-0 bottom-0 rounded-full transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none bg-white/15 border border-white/20"`;

const goodNav = `          className="absolute top-0 bottom-0 rounded-full transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none bg-white/15 border border-white/20"
          style={{
            width: '25%',
            transform: \`translateX(\${activeTab === 'timer' ? '0%' : activeTab === 'tasks' ? '100%' : activeTab === 'analytics' ? '200%' : '300%' })\`
          }}`;

nav = nav.replace(badNav, goodNav);
fs.writeFileSync(navPath, nav, 'utf8');

// 2. StudyTimer.tsx
const timerPath = './src/components/timer/StudyTimer.tsx';
let timer = fs.readFileSync(timerPath, 'utf8');

timer = timer.replace(
  /className="relative aspect-square w-full max-w-\[300px\] sm:max-w-\[400px\] md:max-w-\[420px\] mx-auto flex items-center justify-center filter drop-shadow-2xl"/,
  'className="relative aspect-square w-full max-w-[240px] sm:max-w-[400px] md:max-w-[420px] mx-auto flex items-center justify-center filter drop-shadow-2xl"'
);

timer = timer.replace(
  /className="w-\[78%\] h-\[78%\] rounded-full bg-\[var\(--bg\)\] flex flex-col items-center justify-center p-2\.5 sm:p-6 text-center relative z-10 shadow-inner"/,
  'className="w-[78%] h-[78%] max-w-[200px] max-h-[200px] sm:max-w-none sm:max-h-none rounded-full bg-[var(--bg)] flex flex-col items-center justify-center p-2.5 sm:p-6 text-center relative z-10 shadow-inner"'
);

timer = timer.replace(
  /className="flex flex-col md:grid md:grid-cols-12 gap-0 md:gap-6 flex-1 h-full min-h-0"/,
  'className="flex flex-col md:grid md:grid-cols-12 gap-0 md:gap-6 flex-1 h-full min-h-0 justify-between"'
);

fs.writeFileSync(timerPath, timer, 'utf8');
console.log('Fixed Navbar and Timer');
