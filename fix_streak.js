const fs = require('fs');
const path = require('path');

function addStreakToNavbar() {
    const navbarPath = path.join(__dirname, 'src/components/common/Navbar.tsx');
    let content = fs.readFileSync(navbarPath, 'utf8');

    // Add Streak Pill before Rank Status Pill
    if (!content.includes('Streak Pill')) {
        content = content.replace(
            /\{\/\* Rank Status Pill \*\/\}/g,
            `{/* Streak Pill */}
              <div
                className="hidden sm:flex items-center h-8 sm:h-9 px-3 bg-[var(--surface)] border border-slate-800 text-slate-100 cursor-default select-none rounded-xl gap-1.5"
                title={\`\${user?.streakDays || 0} Day Streak\`}
              >
                <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                <span className="text-xs font-bold font-mono text-white">{user?.streakDays || 0}</span>
              </div>

              {/* Rank Status Pill */}`
        );
        fs.writeFileSync(navbarPath, content, 'utf8');
        console.log('Added Streak to Navbar.tsx');
    }
}

function ensureOrangeStreakInTimer() {
    const timerPath = path.join(__dirname, 'src/components/timer/StudyTimer.tsx');
    let content = fs.readFileSync(timerPath, 'utf8');

    // Make sure the flame icon is strictly orange-500
    content = content.replace(
        /<Flame className="w-full h-full fill-current text-amber-500" \/>/g,
        '<Flame className="w-full h-full text-orange-500 fill-orange-500" style={{ color: "#f97316" }} />'
    );
    
    // Check if there are any other stray flames that might inherit
    content = content.replace(
        /<Flame className="w-full h-full fill-current" style=\{\{ color: ".*?" \}\} \/>/g,
        '<Flame className="w-full h-full text-orange-500 fill-orange-500" style={{ color: "#f97316" }} />'
    );

    fs.writeFileSync(timerPath, content, 'utf8');
    console.log('Ensured Orange Streak in StudyTimer.tsx');
}

addStreakToNavbar();
ensureOrangeStreakInTimer();
