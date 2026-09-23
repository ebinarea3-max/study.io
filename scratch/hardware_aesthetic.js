const fs = require('fs');

// 1. UPDATE GLOBALS.CSS
const globalsPath = './src/app/globals.css';
let globals = fs.readFileSync(globalsPath, 'utf8');

globals = globals.replace(/--bg: #0A0D14;/g, '--bg: #090B10;');
globals = globals.replace(/--background: #0A0D14;/g, '--background: #090B10;');
globals = globals.replace(/--surface: rgba\(16, 22, 31, 0\.75\);/g, '--surface: rgba(14, 18, 26, 0.7);');
globals = globals.replace(/--accent: #00E599;/g, '--accent: #00F2FE;');
globals = globals.replace(/--primary: #00E599;/g, '--primary: #00F2FE;');
globals = globals.replace(/--accent-glow: rgba\(0, 229, 153, 0\.3\);/g, '--accent-glow: rgba(0, 242, 254, 0.3);');

const hudSurfaceRegex = /\.hud-surface \{[\s\S]*?\}/;
const newHudSurface = `.hud-surface {
  background-color: var(--surface);
  border: 1px solid var(--border);
  border-top: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}`;
globals = globals.replace(hudSurfaceRegex, newHudSurface);
fs.writeFileSync(globalsPath, globals, 'utf8');


// 2. UPDATE StudyTimer.tsx
const studyTimerPath = './src/components/timer/StudyTimer.tsx';
let timer = fs.readFileSync(studyTimerPath, 'utf8');

// Update main timer card classes
// Old: className="relative rounded-3xl bg-[var(--surface)] backdrop-blur-xl border border-[var(--border)] p-3.5 sm:p-8 lg:p-10 shadow-xl overflow-hidden flex-1 flex flex-col justify-between transition-all"
timer = timer.replace(
  /className="relative rounded-3xl bg-\[var\(--surface\)\] backdrop-blur-xl border border-\[var\(--border\)\] p-3\.5 sm:p-8 lg:p-10 shadow-xl overflow-hidden flex-1 flex flex-col justify-between transition-all"/g,
  'className="hud-surface relative rounded-3xl p-3.5 sm:p-8 lg:p-10 overflow-hidden flex-1 flex flex-col justify-between transition-all"'
);
timer = timer.replace(
  /style=\{\{ backgroundImage: "var\(--card-texture, none\)", borderColor: 'var\(--border\)', boxShadow: 'inset 0 1px 0 var\(--card-highlight, transparent\)' \}\}/g,
  ''
);

// Ambient glow remove
timer = timer.replace(
  /<div\s*className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-\[100px\] opacity-15 pointer-events-none transition-all duration-700"[\s\S]*?<\/div>/,
  ''
);

// Toggles (Pomodoro / Stopwatch, Today / Yesterday)
// Change: text-xs uppercase font-bold text-slate-400 tracking-widest
timer = timer.replace(
  /className="p-1 rounded-xl bg-black\/40 border border-white\/5 flex shadow-inner"/g,
  'className="p-1 rounded-md bg-black/40 border border-white/5 flex shadow-inner"'
);
timer = timer.replace(
  /className={`flex-1 text-center py-2 text-xs font-bold font-hud uppercase tracking-wider rounded-lg transition-all \${/g,
  'className={`flex-1 text-center py-1.5 text-[10px] font-bold font-hud uppercase tracking-widest rounded-md transition-all ${'
);
// Make active toggles use frosted glass
timer = timer.replace(
  /style=\{timerMode === 'pomodoro' \? \{ backgroundColor: 'rgba\(255, 255, 255, 0\.05\)', color: 'var\(--accent\)', boxShadow: 'inset 0 0 0 1px var\(--border\)' \} : undefined\}/g,
  "style={timerMode === 'pomodoro' ? { backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' } : { color: '#94A3B8' }}"
);
timer = timer.replace(
  /style=\{timerMode === 'stopwatch' \? \{ backgroundColor: 'rgba\(255, 255, 255, 0\.05\)', color: 'var\(--accent\)', boxShadow: 'inset 0 0 0 1px var\(--border\)' \} : undefined\}/g,
  "style={timerMode === 'stopwatch' ? { backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' } : { color: '#94A3B8' }}"
);

// START SESSION button
timer = timer.replace(
  /style=\{\{\s*background:\s*'linear-gradient\(135deg, #06B6D4 0%, #0891B2 100%\)',\s*boxShadow:\s*'0 4px 20px rgba\(6, 182, 212, 0\.28\)',\s*color:\s*'#FFFFFF'\s*\}\}/g,
  "style={{ background: 'linear-gradient(180deg, #00F2FE 0%, #00C4D4 100%)', boxShadow: '0 4px 20px rgba(0, 242, 254, 0.3)', color: '#041014', border: '1px solid rgba(255, 255, 255, 0.35)' }}"
);
timer = timer.replace(
  /className="px-8 sm:px-10 py-3\.5 sm:py-4 font-hud font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2\.5 w-full xs:w-auto hud-btn-primary cursor-pointer hover:scale-\[1\.02\]"/g,
  'className="px-8 sm:px-10 py-3.5 sm:py-4 font-sans font-semibold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 w-full xs:w-auto rounded-xl cursor-pointer hover:scale-[1.02]"'
);
timer = timer.replace(
  /className={`px-8 sm:px-10 py-3\.5 sm:py-4 font-hud font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2\.5 w-full xs:w-auto hud-btn-primary \$\{/g,
  'className={`px-8 sm:px-10 py-3.5 sm:py-4 font-sans font-semibold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 w-full xs:w-auto rounded-xl ${'
);

// Timer Dial
timer = timer.replace(
  /className="w-\[78%\] h-\[78%\] rounded-full bg-\[var\(--bg\)\] border-2 border-\[var\(--border\)\] relative flex flex-col items-center justify-center shadow-inner"/g,
  'className="w-[78%] h-[78%] rounded-full bg-[var(--bg)] border border-white/10 relative flex flex-col items-center justify-center" style={{ boxShadow: "inset 0 2px 10px rgba(0, 0, 0, 0.8)" }}'
);
// SVG Progress ring color
timer = timer.replace(/stroke="var\(--accent\)"/g, 'stroke="#00F2FE"');

// Today on Subject card relocation
// Remove it from the bottom of the container
const todayCardRegex = /\{\/\* Subject Today's Progress Card - Hidden on mobile single-screen view, visible on desktop \*\/\}[\s\S]*?<\/div>(\s*<\/div>\s*\{\/\* Right Secondary Column)/;
const todayCardMatch = timer.match(todayCardRegex);

if (todayCardMatch) {
  const cardHtml = todayCardMatch[0].replace(todayCardMatch[1], '');
  
  // Remove the old card HTML
  timer = timer.replace(todayCardRegex, '$1');

  // Insert the card HTML inside the main timer card, just below the buttons (line ~1348)
  // Actually let's just insert it after the end of the flex container holding the Start Session button
  const insertTarget = /<\/div>\s*<\/div>\s*<\/div>\s*(?=\{\/\* Right Secondary Column)/;
  
  // We need to inject it before the last two </div>s of the main timer card
  // The main timer card structure:
  // <div className="hud-surface...">
  //   ...
  //   <div className="mt-8 flex justify-center..."> (Buttons) </div>
  // </div>
  
  const buttonsEndTarget = /(<div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 relative z-10">[\s\S]*?<\/div>)\s*(?=\s*<\/div>)/;
  
  const formattedCardHtml = cardHtml
    .replace(/className="hidden md:flex rounded-2xl bg-\[var\(--surface\)\] backdrop-blur-xl border border-\[var\(--border\)\] p-5 flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"/g, 'className="hidden md:flex pt-6 mt-8 border-t border-white/10 flex-col sm:flex-row items-start sm:items-center justify-between gap-4"')
    .replace(/\{\/\* Subject Today's Progress Card - Hidden on mobile single-screen view, visible on desktop \*\/\}/, '{/* Subject Today\'s Progress Integrated Bar */}');

  timer = timer.replace(buttonsEndTarget, `$1\n\n          ${formattedCardHtml}`);
}

fs.writeFileSync(studyTimerPath, timer, 'utf8');

console.log('Applied hardware aesthetic');
