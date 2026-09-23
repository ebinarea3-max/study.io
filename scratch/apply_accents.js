const fs = require('fs');

// 1. UPDATE globals.css
const globalsPath = './src/app/globals.css';
let globals = fs.readFileSync(globalsPath, 'utf8');

globals = globals.replace(/--bg: #090B10;/g, '--bg: #0A0D14;');
globals = globals.replace(/--background: #090B10;/g, '--background: #0A0D14;');
globals = globals.replace(/--surface: rgba\(14, 18, 26, 0\.7\);/g, '--surface: rgba(15, 19, 28, 0.78);');
globals = globals.replace(/backdrop-filter: blur\(16px\);/g, 'backdrop-filter: blur(14px);');
globals = globals.replace(/-webkit-backdrop-filter: blur\(16px\);/g, '-webkit-backdrop-filter: blur(14px);');

fs.writeFileSync(globalsPath, globals, 'utf8');


// 2. UPDATE DailyTodoList.tsx
const todoPath = './src/components/todo/DailyTodoList.tsx';
let todo = fs.readFileSync(todoPath, 'utf8');

// Container
todo = todo.replace(
  /className="hud-surface border border-\[var\(--border\)\] rounded-2xl p-4 sm:p-5 space-y-3 relative overflow-hidden group"/,
  'className="hud-surface border border-[var(--border)] rounded-2xl p-4 sm:p-5 space-y-3 relative overflow-hidden group"\n      style={{ borderTop: "1px solid rgba(245, 158, 11, 0.4)" }}'
);
// Icon and title
todo = todo.replace(/text-tier/g, 'text-[#F59E0B]');
// Checkbox active state
todo = todo.replace(/bg-tier/g, 'bg-[#F59E0B]');
todo = todo.replace(/glow-tier/g, '');
// Badge count
todo = todo.replace(
  /className="px-2\.5 py-0\.5 rounded font-hud-mono text-\[11px\] font-bold border shadow-sm text-\[\#F59E0B\] border-tier-muted bg-tier-muted"/,
  'className="px-2.5 py-0.5 rounded font-hud-mono text-[11px] font-bold border shadow-sm" style={{ backgroundColor: "rgba(245, 158, 11, 0.1)", color: "#FBBF24", borderColor: "rgba(245, 158, 11, 0.25)" }}'
);
todo = todo.replace(
  /style=\{\{ '--tw-ring-color': theme\.accent \} as React\.CSSProperties\}/,
  "style={{ '--tw-ring-color': '#F59E0B' } as React.CSSProperties}"
);
fs.writeFileSync(todoPath, todo, 'utf8');


// 3. UPDATE StudyTimer.tsx
const studyTimerPath = './src/components/timer/StudyTimer.tsx';
let timer = fs.readFileSync(studyTimerPath, 'utf8');

// Dial Bezel (2px)
timer = timer.replace(
  /className="w-\[78%\] h-\[78%\] rounded-full bg-\[var\(--bg\)\] border flex flex-col items-center justify-center p-2\.5 sm:p-6 text-center relative z-10 shadow-inner"/g,
  'className="w-[78%] h-[78%] rounded-full bg-[var(--bg)] border-2 flex flex-col items-center justify-center p-2.5 sm:p-6 text-center relative z-10 shadow-inner"'
);
// START SESSION Button
timer = timer.replace(
  /style=\{\{\s*background:\s*'linear-gradient\(180deg, #00F2FE 0%, #00C4D4 100%\)',\s*boxShadow:\s*'0 4px 20px rgba\(0, 242, 254, 0\.3\)',\s*color:\s*'#041014',\s*border:\s*'1px solid rgba\(255, 255, 255, 0\.35\)'\s*\}\}/g,
  "style={{ background: '#10B981', boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)', color: '#000000', border: '1px solid rgba(255, 255, 255, 0.35)' }}"
);
timer = timer.replace(
  /className={`px-8 sm:px-10 py-3\.5 sm:py-4 font-sans font-semibold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2\.5 w-full xs:w-auto rounded-xl `}/,
  'className={`px-8 sm:px-10 py-3.5 sm:py-4 font-sans font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 w-full xs:w-auto rounded-xl '
);

// Daily Overview Card
timer = timer.replace(
  /className="rounded-2xl bg-\[var\(--surface\)\] backdrop-blur-xl border border-\[var\(--border\)\] p-5 shadow-xl space-y-4 transition-all relative overflow-hidden"\s*style=\{\{ borderColor: 'var\(--border\)' \}\}/,
  'className="rounded-2xl bg-[var(--surface)] backdrop-blur-xl border border-[var(--border)] p-5 shadow-xl space-y-4 transition-all relative overflow-hidden"\n          style={{ borderTop: "1px solid rgba(6, 182, 212, 0.4)" }}'
);
// Sparkles icon
timer = timer.replace(
  /<Sparkles className="w-4 h-4" style=\{\{ color: 'var\(--accent\)' \}\} \/>/,
  '<Sparkles className="w-4 h-4" style={{ color: "#06B6D4" }} />'
);
// Streak Flame and metrics
timer = timer.replace(
  /<Flame className="w-full h-full fill-current" style=\{\{ color: 'var\(--accent\)' \}\} \/>/,
  '<Flame className="w-full h-full fill-current" style={{ color: "#06B6D4" }} />'
);
timer = timer.replace(
  /style=\{\{ color: 'var\(--accent\)' \}\}/g,
  'style={{ color: "#06B6D4" }}'
);
// Daily overview toggle pills
timer = timer.replace(
  /style=\{overviewView === 'today' \? \{ backgroundColor: 'rgba\(255, 255, 255, 0\.05\)', color: 'var\(--accent\)', boxShadow: 'inset 0 0 0 1px var\(--border\)' \} : undefined\}/,
  "style={overviewView === 'today' ? { backgroundColor: '#06B6D4', color: '#04181C', boxShadow: 'inset 0 0 0 1px rgba(6, 182, 212, 0.5)' } : undefined}"
);
timer = timer.replace(
  /style=\{overviewView === 'yesterday' \? \{ backgroundColor: 'rgba\(255, 255, 255, 0\.05\)', color: 'var\(--accent\)', boxShadow: 'inset 0 0 0 1px var\(--border\)' \} : undefined\}/,
  "style={overviewView === 'yesterday' ? { backgroundColor: '#06B6D4', color: '#04181C', boxShadow: 'inset 0 0 0 1px rgba(6, 182, 212, 0.5)' } : undefined}"
);

// Today's Boost Card
timer = timer.replace(
  /className="rounded-2xl bg-\[var\(--surface\)\] backdrop-blur-xl border border-\[var\(--border\)\] p-5 shadow-xl space-y-3 transition-all relative overflow-hidden"\s*style=\{\{ borderColor: 'var\(--border\)' \}\}/,
  'className="rounded-2xl bg-[var(--surface)] backdrop-blur-xl border border-[var(--border)] p-5 shadow-xl space-y-3 transition-all relative overflow-hidden"\n          style={{ borderTop: "1px solid rgba(16, 185, 129, 0.4)" }}'
);
// Message Circle icon
timer = timer.replace(
  /<MessageCircle className="w-4 h-4" style=\{\{ color: "\#06B6D4" \}\} \/>/, // because previous replace hit this
  '<MessageCircle className="w-4 h-4" style={{ color: "#10B981" }} />'
);
// Motivational quote text
timer = timer.replace(
  /className="text-\[14px\] font-semibold text-slate-200 leading-snug tracking-tight"/,
  'className="text-[14px] font-semibold text-[#E2E8F0] leading-snug tracking-tight"'
);

fs.writeFileSync(studyTimerPath, timer, 'utf8');

console.log('Applied right-hand card accents');
