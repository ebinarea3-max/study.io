const fs = require('fs');

// 1. UPDATE globals.css
const globalsPath = './src/app/globals.css';
let globals = fs.readFileSync(globalsPath, 'utf8');
globals = globals.replace(/--surface: rgba\(16, 21, 30, 0\.8\);/, '--surface: rgba(16, 22, 31, 0.75);');
fs.writeFileSync(globalsPath, globals, 'utf8');


// 2. UPDATE StudyTimer.tsx
const studyTimerPath = './src/components/timer/StudyTimer.tsx';
let timer = fs.readFileSync(studyTimerPath, 'utf8');

// Update Left Column container space
// From: md:space-y-6  To: md:space-y-3
timer = timer.replace(/space-y-0 md:space-y-6/g, 'space-y-0 md:space-y-3');

// Update START SESSION and START FOCUS SESSION buttons
// Currently uses style={{ background: 'var(--accent)', boxShadow: '0 0 20px var(--accent-glow)', color: '#0A0D14' }}
// Change to linear-gradient with pure white text and crisp glow
const newBtnStyle = "style={{ background: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)', boxShadow: '0 4px 20px rgba(6, 182, 212, 0.28)', color: '#FFFFFF' }}";
timer = timer.replace(/style=\{\{\s*background:\s*'var\(--accent\)',\s*boxShadow:\s*'0 0 20px var\(--accent-glow\)',\s*color:\s*'#0A0D14'\s*\}\}/g, newBtnStyle);

// Update Today on Subject card styling to ensure it docks perfectly
// Currently: <div className="hidden md:flex rounded-2xl bg-neutral-900/50 border border-[var(--border)] p-5 flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
// We will give it a crisp border, surface background, and backdrop blur to match "all three main dashboard panels"
timer = timer.replace(/className="hidden md:flex rounded-2xl bg-neutral-900\/50 border border-\[var\(--border\)\] p-5 flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"/g, 'className="hidden md:flex rounded-2xl bg-[var(--surface)] backdrop-blur-xl border border-[var(--border)] p-5 flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"');

fs.writeFileSync(studyTimerPath, timer, 'utf8');


// 3. UPDATE right side panels (DailyTodoList and others)
// Wait, DailyTodoList and SubjectOverview are in other files.
// Let's modify them next.
console.log('Updated StudyTimer and globals');
