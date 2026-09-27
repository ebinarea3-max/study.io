const fs = require('fs');

const timerPath = 'src/components/timer/StudyTimer.tsx';
let timerContent = fs.readFileSync(timerPath, 'utf8');

// Ensure Target icon is imported
if (!timerContent.includes('Target,')) {
    timerContent = timerContent.replace(/import\s+\{([^}]+)\}\s+from\s+'lucide-react';/, "import {$1, Target} from 'lucide-react';");
}

// Target the "Today's Boost / Motivation Card" block exactly up to its closing tag, not grabbing extra divs
const regex = /\{\/\*\s*3\.\s*(Today's Boost|Daily Catalyst)\s*\/\s*Motivation Card\s*\*\/\}[\s\S]*?<div className="min-h-\[40px\] flex flex-col justify-center relative z-10">[\s\S]*?<\/div>\s*<\/div>/;

const newCardBlock = `{/* 3. Daily Directive / Motivation Card */}
        <div
          className="rounded-2xl bg-[var(--surface)] backdrop-blur-xl border border-[var(--border)] p-5 shadow-xl space-y-3 transition-all relative overflow-hidden"
          style={{ borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}
        >
          <div className="hud-corner-bracket hud-corner-tl" />
          <div className="hud-corner-bracket hud-corner-tr" />
          <div className="hud-corner-bracket hud-corner-bl" />
          <div className="hud-corner-bracket hud-corner-br" />

          <div className="flex items-center gap-2 pb-2.5 border-b border-[var(--border)] relative z-10">
            <Target className="w-4 h-4" style={{ color: "var(--accent)" }} />
            <span className="text-xs font-semibold tracking-wider text-neutral-300 uppercase">
              DAILY DIRECTIVE
            </span>
          </div>

          <div className="min-h-[40px] flex flex-col justify-center relative z-10">
            <p className="text-[14px] font-semibold text-[#E2E8F0] leading-snug tracking-tight">
              {(user?.streakDays || 1) > 1 
                ? \`Day \${user?.streakDays || 1} directive active. Complete your scheduled focus blocks to maintain momentum.\`
                : "Day 1 logged. Return tomorrow to maintain your active streak."
              }
            </p>
          </div>
        </div>`;

timerContent = timerContent.replace(regex, newCardBlock);
fs.writeFileSync(timerPath, timerContent, 'utf8');
console.log('Fixed StudyTimer.tsx safely.');
