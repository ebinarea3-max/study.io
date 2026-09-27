const fs = require('fs');
const path = require('path');

function fixThemes() {
    const timerPath = path.join(__dirname, 'src/components/timer/StudyTimer.tsx');
    let timerContent = fs.readFileSync(timerPath, 'utf8');

    // 1. START SESSION BUTTON: Remove hardcoded green, use dynamic theme
    timerContent = timerContent.replace(
        /style=\{\{ background: '#10B981', color: '#021C11', fontWeight: 800, border: 'none', boxShadow: '0 4px 20px rgba\(16, 185, 129, 0\.4\)' \}\}/g,
        'style={{ background: theme.gradient, color: "#000000", fontWeight: 800, border: "none", boxShadow: `0 8px 32px ${theme.glow}60, inset 0 2px 4px rgba(255,255,255,0.3)` }}'
    );
    timerContent = timerContent.replace(
        /<Play className="w-4 sm:w-5 h-4 sm:h-5 fill-current" \/>/g,
        '<Play className="w-4 sm:w-5 h-4 sm:h-5 fill-current" />' // actually this is already fill-current, no change needed
    );

    // 2. TIMER DIAL & STATUS DOT
    // Replace the status dot logic
    timerContent = timerContent.replace(
        /backgroundColor:\s*pomodoroCompletedPhase === 'work'\s*\?\s*'#10B981'\s*:\s*isStudying\s*\?\s*isPaused\s*\?\s*'#f59e0b'\s*:\s*'#10B981'\s*:\s*'#10B981',/g,
        `backgroundColor:
                        pomodoroCompletedPhase === 'work'
                          ? 'var(--accent)'
                          : isStudying
                          ? isPaused
                            ? '#f59e0b'
                            : 'var(--accent)'
                          : 'var(--accent)',`
    );
    timerContent = timerContent.replace(
        /boxShadow: '0 0 8px #10B981',/g,
        "boxShadow: '0 0 8px var(--glow)',"
    );

    // Replace the dropdown fallback green color
    timerContent = timerContent.replace(
        /sub\?\.color \|\| '#10B981'/g,
        "sub?.color || 'var(--accent)'"
    );

    fs.writeFileSync(timerPath, timerContent, 'utf8');
    console.log('Updated StudyTimer.tsx');

    // 3. BADGES: "TODO LIST" `0 / 0 COMPLETED` badge
    const todoPath = path.join(__dirname, 'src/components/todo/DailyTodoList.tsx');
    let todoContent = fs.readFileSync(todoPath, 'utf8');

    todoContent = todoContent.replace(
        /className="px-2\.5 py-0\.5 rounded font-hud-mono text-\[11px\] font-bold border shadow-sm"\s*style=\{\{ backgroundColor: "rgba\(245, 158, 11, 0\.1\)", color: "#FBBF24", borderColor: "rgba\(245, 158, 11, 0\.25\)" \}\}/g,
        'className="px-2.5 py-0.5 rounded font-hud-mono text-xs font-bold border shadow-sm bg-white/[0.04] border-white/10 text-neutral-300"'
    );

    fs.writeFileSync(todoPath, todoContent, 'utf8');
    console.log('Updated DailyTodoList.tsx');
}

fixThemes();
