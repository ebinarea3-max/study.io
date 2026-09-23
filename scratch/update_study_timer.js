const fs = require('fs');
const file = './src/components/timer/StudyTimer.tsx';
let content = fs.readFileSync(file, 'utf8');

// Update TODAY / YESTERDAY toggles
content = content.replace(/style=\{overviewView === 'today' \? \{ backgroundColor: 'var\(--accent\)' \} : undefined\}/g, "style={overviewView === 'today' ? { backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--accent)', boxShadow: 'inset 0 0 0 1px var(--border)' } : undefined}");
content = content.replace(/style=\{overviewView === 'yesterday' \? \{ backgroundColor: 'var\(--accent\)' \} : undefined\}/g, "style={overviewView === 'yesterday' ? { backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--accent)', boxShadow: 'inset 0 0 0 1px var(--border)' } : undefined}");

// Update POMODORO / STOPWATCH toggles
content = content.replace(/style=\{timerMode === 'stopwatch' \? \{ backgroundColor: 'var\(--accent\)' \} : undefined\}/g, "style={timerMode === 'stopwatch' ? { backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--accent)', boxShadow: 'inset 0 0 0 1px var(--border)' } : undefined}");
content = content.replace(/style=\{timerMode === 'pomodoro' \? \{ backgroundColor: 'var\(--accent\)' \} : undefined\}/g, "style={timerMode === 'pomodoro' ? { backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--accent)', boxShadow: 'inset 0 0 0 1px var(--border)' } : undefined}");

// Apply --card-texture and --card-highlight to the main timer card
// It currently has: className="relative rounded-3xl bg-[var(--surface)] border border-[var(--border)] p-3.5 sm:p-8 lg:p-10 shadow-2xl overflow-hidden flex-1 md:flex-initial flex flex-col justify-between transition-all"
content = content.replace(/className="relative rounded-3xl bg-\[var\(--surface\)\]/g, 'style={{ backgroundImage: "var(--card-texture, none)", boxShadow: "inset 0 1px 0 var(--card-highlight, transparent)" }} className="relative rounded-3xl bg-[var(--surface)]');

fs.writeFileSync(file, content, 'utf8');
console.log('Updated StudyTimer.tsx with luxury toggles and card ambient styling');
