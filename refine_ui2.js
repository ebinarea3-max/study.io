const fs = require('fs');
const path = require('path');

function refineUI2() {
    const timerPath = path.join(__dirname, 'src/components/timer/StudyTimer.tsx');
    let content = fs.readFileSync(timerPath, 'utf8');

    // 1. Remove the violet theme from Daily Overview
    // Header Sparkle Icon
    content = content.replace(
        /<Sparkles className="w-4 h-4" style={{ color: "#6366F1" }} \/>/g,
        '<Sparkles className="w-4 h-4 text-amber-400/80" />'
    );

    // Toggle Pills - Active
    content = content.replace(
        /style=\{overviewView === 'today' \? \{ backgroundColor: '#6366F1', color: '#FFFFFF', boxShadow: 'inset 0 0 0 1px rgba\(99, 102, 241, 0\.5\)' \} : undefined\}/g,
        'style={overviewView === "today" ? { backgroundColor: "rgba(255,255,255,0.1)", color: "#FFFFFF", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)" } : undefined}'
    );
    
    // Toggle Pills - Active Yesterday
    content = content.replace(
        /style=\{overviewView === 'yesterday' \? \{ backgroundColor: '#6366F1', color: '#FFFFFF', boxShadow: 'inset 0 0 0 1px rgba\(99, 102, 241, 0\.5\)' \} : undefined\}/g,
        'style={overviewView === "yesterday" ? { backgroundColor: "rgba(255,255,255,0.1)", color: "#FFFFFF", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)" } : undefined}'
    );

    // TOTAL FOCUS Value color
    content = content.replace(
        /className="text-base md:text-lg font-bold text-white tracking-tight tabular-nums"\s*style={{ color: "#6366F1" }}/g,
        'className="text-base md:text-lg font-bold text-white tracking-tight tabular-nums font-mono"'
    );

    // ACTIVE STREAK Flame Icon color
    content = content.replace(
        /<Flame className="w-full h-full fill-current" style={{ color: "#6366F1" }} \/>/g,
        '<Flame className="w-full h-full fill-current text-amber-500" />'
    );

    // ACTIVE STREAK Value color
    content = content.replace(
        /<span className="text-base md:text-lg font-bold text-white tracking-tight"\s*style={{ color: "#6366F1" }}>/g,
        '<span className="text-base md:text-lg font-bold text-white tracking-tight">'
    );

    // 2. Center Timer Card top padding
    // Let's adjust the padding of the card and check if there's any other spacing.
    content = content.replace(
        /max-md:px-4 max-md:py-2 p-6 md:p-7/g,
        'p-5 sm:p-6'
    );
    
    // The inner container top spacing (maybe sm:pb-6 on line 736)
    content = content.replace(
        /sm:pb-6 max-md:border-b-0 border-b border-\[var\(--border\)\]/g,
        'pb-4 max-md:border-b-0 border-b border-[var(--border)]'
    );
    
    // The Action buttons container
    content = content.replace(
        /pt-3 sm:pt-8 flex flex-wrap items-center justify-center/g,
        'pt-4 flex flex-wrap items-center justify-center'
    );

    fs.writeFileSync(timerPath, content, 'utf8');
    console.log('Updated StudyTimer.tsx with layout and color fixes');
}

refineUI2();
