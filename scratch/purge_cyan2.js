const fs = require('fs');

// 1. Navbar.tsx
const navPath = './src/components/common/Navbar.tsx';
let nav = fs.readFileSync(navPath, 'utf8');

nav = nav.replace(
  /style=\{activeTab === 'timer' \? \{ backgroundColor: theme\.accent \} : undefined\}/g,
  "style={activeTab === 'timer' ? { background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#FFFFFF', fontWeight: 600 } : undefined}"
);
nav = nav.replace(
  /style=\{activeTab === 'tasks' \? \{ backgroundColor: theme\.accent \} : undefined\}/g,
  "style={activeTab === 'tasks' ? { background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#FFFFFF', fontWeight: 600 } : undefined}"
);
nav = nav.replace(
  /style=\{activeTab === 'analytics' \? \{ backgroundColor: theme\.accent \} : undefined\}/g,
  "style={activeTab === 'analytics' ? { background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#FFFFFF', fontWeight: 600 } : undefined}"
);
nav = nav.replace(
  /style=\{activeTab === 'settings' \? \{ backgroundColor: theme\.accent \} : undefined\}/g,
  "style={activeTab === 'settings' ? { background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#FFFFFF', fontWeight: 600 } : undefined}"
);

fs.writeFileSync(navPath, nav, 'utf8');

// 2. StudyTimer.tsx
const timerPath = './src/components/timer/StudyTimer.tsx';
let timer = fs.readFileSync(timerPath, 'utf8');

// Mode pills
timer = timer.replace(
  /className=\{`px-3 sm:px-4 py-1 sm:py-1\.5 rounded-xl text-xs font-hud font-bold tracking-wider transition-all active:scale-95 \$\{\n\s*timerMode === 'stopwatch'\n\s*\? 'text-slate-950 shadow-sm'\n\s*: 'text-neutral-400 hover:text-white'\n\s*\} \$\{isStudying \? 'cursor-not-allowed opacity-50' : 'cursor-pointer'\}`\}\n\s*style=\{timerMode === 'stopwatch' \? \{ backgroundColor: 'rgba\(255, 255, 255, 0\.1\)', color: '#FFFFFF', boxShadow: '0 2px 8px rgba\(0,0,0,0\.2\)' \} : \{ color: '#94A3B8' \}\}/,
  "className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-xl text-xs font-hud font-bold tracking-wider transition-all active:scale-95 ${timerMode === 'stopwatch' ? 'bg-white/10 text-white border border-white/20 shadow-sm' : 'text-neutral-400 hover:text-white border border-transparent'} ${isStudying ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}"
);
timer = timer.replace(
  /className=\{`px-3 sm:px-4 py-1 sm:py-1\.5 rounded-xl text-xs font-hud font-bold tracking-wider transition-all active:scale-95 \$\{\n\s*timerMode === 'pomodoro'\n\s*\? 'text-slate-950 shadow-sm'\n\s*: 'text-neutral-400 hover:text-white'\n\s*\} \$\{isStudying \? 'cursor-not-allowed opacity-50' : 'cursor-pointer'\}`\}\n\s*style=\{timerMode === 'pomodoro' \? \{ backgroundColor: 'rgba\(255, 255, 255, 0\.1\)', color: '#FFFFFF', boxShadow: '0 2px 8px rgba\(0,0,0,0\.2\)' \} : \{ color: '#94A3B8' \}\}/,
  "className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-xl text-xs font-hud font-bold tracking-wider transition-all active:scale-95 ${timerMode === 'pomodoro' ? 'bg-white/10 text-white border border-white/20 shadow-sm' : 'text-neutral-400 hover:text-white border border-transparent'} ${isStudying ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}"
);

// Presets
timer = timer.replace(
  /\? 'bg-primary-muted text-primary-bright border border-primary-muted shadow-sm'/g,
  "? 'bg-white/10 text-white border-white/20 shadow-sm'"
);

// Dial center ring
timer = timer.replace(
  /style=\{\{ borderColor: "rgba\(255, 255, 255, 0\.1\)", boxShadow: "inset 0 2px 10px rgba\(0, 0, 0, 0\.8\)" \}\}/,
  'style={{ border: "2px solid rgba(255, 255, 255, 0.12)", boxShadow: "inset 0 2px 10px rgba(0, 0, 0, 0.8)" }}'
);
timer = timer.replace(
  /className="w-\[78%\] h-\[78%\] rounded-full bg-\[var\(--bg\)\] border-2 flex flex-col items-center justify-center p-2\.5 sm:p-6 text-center relative z-10 shadow-inner"/,
  'className="w-[78%] h-[78%] rounded-full bg-[var(--bg)] flex flex-col items-center justify-center p-2.5 sm:p-6 text-center relative z-10 shadow-inner"'
);

// Radar glow
timer = timer.replace(
  /background: 'conic-gradient\(from 0deg, transparent 0deg, transparent 270deg, var\(--glow\) 330deg, var\(--accent\) 360deg\)'/,
  "background: 'conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(255,255,255,0.1) 330deg, rgba(255,255,255,0.3) 360deg)'"
);

// START SESSION Button
timer = timer.replace(
  /style=\{\{ background: '#10B981', boxShadow: '0 4px 20px rgba\(16, 185, 129, 0\.3\)', color: '#000000', border: '1px solid rgba\(255, 255, 255, 0\.35\)' \}\}/g,
  "style={{ background: '#10B981', color: '#021C11', fontWeight: 700, border: 'none', boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)' }}"
);
timer = timer.replace(
  /className={`px-8 sm:px-10 py-3\.5 sm:py-4 font-sans font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2\.5 w-full xs:w-auto rounded-xl cursor-pointer hover:scale-\[1\.02\]`}/g,
  'className={`px-8 sm:px-10 py-3.5 sm:py-4 font-sans font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 w-full xs:w-auto rounded-xl cursor-pointer hover:scale-[1.02]`}'
);

// Right hand cards daily overview Indigo
timer = timer.replace(
  /<Sparkles className="w-4 h-4" style=\{\{ color: "#06B6D4" \}\} \/>/g,
  '<Sparkles className="w-4 h-4" style={{ color: "#6366F1" }} />'
);
timer = timer.replace(
  /<Flame className="w-full h-full fill-current" style=\{\{ color: "#06B6D4" \}\} \/>/g,
  '<Flame className="w-full h-full fill-current" style={{ color: "#6366F1" }} />'
);
timer = timer.replace(
  /style=\{\{ borderTop: "1px solid rgba\(6, 182, 212, 0\.4\)" \}\}/g,
  'style={{ borderTop: "1px solid rgba(99, 102, 241, 0.4)" }}'
);
timer = timer.replace(
  /style=\{overviewView === 'today' \? \{ backgroundColor: '#06B6D4', color: '#04181C', boxShadow: 'inset 0 0 0 1px rgba\(6, 182, 212, 0\.5\)' \} : undefined\}/g,
  "style={overviewView === 'today' ? { backgroundColor: '#6366F1', color: '#FFFFFF', boxShadow: 'inset 0 0 0 1px rgba(99, 102, 241, 0.5)' } : undefined}"
);
timer = timer.replace(
  /style=\{overviewView === 'yesterday' \? \{ backgroundColor: '#06B6D4', color: '#04181C', boxShadow: 'inset 0 0 0 1px rgba\(6, 182, 212, 0\.5\)' \} : undefined\}/g,
  "style={overviewView === 'yesterday' ? { backgroundColor: '#6366F1', color: '#FFFFFF', boxShadow: 'inset 0 0 0 1px rgba(99, 102, 241, 0.5)' } : undefined}"
);
timer = timer.replace(
  /style=\{\{ color: "#06B6D4" \}\}/g,
  'style={{ color: "#6366F1" }}'
);

fs.writeFileSync(timerPath, timer, 'utf8');
console.log('Purged cyan');
