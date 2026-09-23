const fs = require('fs');
const path = require('path');

// 1. UPDATE GLOBALS.CSS
const globalsPath = './src/app/globals.css';
let globals = fs.readFileSync(globalsPath, 'utf8');

// Replace the root variables block
const rootRegex = /:root\s*\{[^}]*\}/;
const newRoot = `:root {
  /* Unified Permanent Premium UI Palette */
  --bg: #0A0D14;
  --background: #0A0D14;
  --surface: rgba(16, 21, 30, 0.8);
  --border: rgba(255, 255, 255, 0.08);
  
  --text-primary: #FFFFFF;
  --foreground: #FFFFFF;
  --text-secondary: #94A3B8;

  /* Base brand accent: Electric Emerald/Cyan */
  --accent: #00E599;
  --primary: #00E599;
  --accent-glow: rgba(0, 229, 153, 0.3);

  /* Fallbacks for older variables */
  --card-bg: var(--surface);
  --card-border: var(--border);
  --surface-high: rgba(30, 35, 51, 0.8);
}`;
globals = globals.replace(rootRegex, newRoot);
fs.writeFileSync(globalsPath, globals, 'utf8');


// 2. UPDATE useRankTheme.ts
const useRankPath = './src/hooks/useRankTheme.ts';
let useRank = fs.readFileSync(useRankPath, 'utf8');

const dynamicInjectionRegex = /\/\/ Set new tokens[\s\S]*?(?=\/\/ Keep legacy variables)/;
const newInjection = `// Inject CSS variables to documentElement for global tier reactive styles (RESTRICTED TO BADGES/CRESTS ONLY)
    
    // We only set the --tier-* variables here so the main app background remains static.
    `;
useRank = useRank.replace(dynamicInjectionRegex, newInjection);

// Clean up dev tier override
useRank = useRank.replace(/const \[devTierOverride, setDevTierOverride\] = useState<string \| null>\(null\);/, 'const devTierOverride = null;');
useRank = useRank.replace(/if \(devTierOverride\) \{\s*return getRankTheme\(devTierOverride\);\s*\}/, '');
fs.writeFileSync(useRankPath, useRank, 'utf8');


// 3. UPDATE StudyTimer.tsx
const studyTimerPath = './src/components/timer/StudyTimer.tsx';
let timer = fs.readFileSync(studyTimerPath, 'utf8');

// Add backdrop-blur to surface cards
timer = timer.replace(/className="([^"]*)bg-\[var\(--surface\)\]/g, 'className="$1bg-[var(--surface)] backdrop-blur-xl');
timer = timer.replace(/className=\{'([^']*)bg-\[var\(--surface\)\]/g, 'className={\'$1bg-[var(--surface)] backdrop-blur-xl');

// Timer Dial 2px border and white digits
timer = timer.replace(/className="w-\[78%\] h-\[78%\] rounded-full bg-\[var\(--bg\)\] border/g, 'className="w-[78%] h-[78%] rounded-full bg-[var(--bg)] border-2');
timer = timer.replace(/className="text-6xl sm:text-7xl font-black tabular-nums tracking-tighter/g, 'className="text-6xl sm:text-7xl font-black tabular-nums tracking-tighter text-white');
// Wait, the text color for the dial digits might already be set or handled dynamically.
// Line 1048: `<div className="text-6xl sm:text-7xl font-black tabular-nums tracking-tighter"`
timer = timer.replace(/className="text-6xl sm:text-7xl font-black tabular-nums tracking-tighter"/g, 'className="text-6xl sm:text-7xl font-black tabular-nums tracking-tighter text-white"');

// START SESSION button styling
// Old: background: 'var(--btn-bg)', boxShadow: 'var(--btn-shadow)'
// New: background: 'var(--accent)', boxShadow: '0 0 20px var(--accent-glow)', color: '#0A0D14'
timer = timer.replace(/background: 'var\(--btn-bg\)', boxShadow: 'var\(--btn-shadow\)'/g, "background: 'var(--accent)', boxShadow: '0 0 20px var(--accent-glow)', color: '#0A0D14'");
timer = timer.replace(/backgroundColor: 'var\(--btn-bg\)'/g, "backgroundColor: 'var(--accent)', color: '#0A0D14'");

// Stop/Pause buttons might also need clean up, but they use static tailwind mostly, except RESUME uses var(--btn-bg)
// Which is caught by the regex above.

fs.writeFileSync(studyTimerPath, timer, 'utf8');


// 4. REMOVE DevRankSwitcher FROM layout.tsx
const layoutPath = './src/app/layout.tsx';
let layout = fs.readFileSync(layoutPath, 'utf8');
layout = layout.replace(/import DevRankSwitcher from '\.\.\/components\/dev\/DevRankSwitcher';\n/, '');
layout = layout.replace(/<DevRankSwitcher \/>\n\s*/, '');
fs.writeFileSync(layoutPath, layout, 'utf8');

console.log('Successfully applied static premium theme and removed dynamic background overrides.');
