const fs = require('fs');
const path = require('path');

function refineUI3() {
    const timerPath = path.join(__dirname, 'src/components/timer/StudyTimer.tsx');
    let content = fs.readFileSync(timerPath, 'utf8');

    // 1. Remove the gap in the timer card
    // The main timer card class:
    content = content.replace(
        /className="relative w-full h-full rounded-3xl bg-\[var\(--surface\)\] backdrop-blur-xl border border-\[var\(--border\)\] p-5 sm:p-6 shadow-xl max-md:overflow-hidden md:overflow-hidden flex flex-col max-md:justify-between max-md:items-center md:justify-between transition-all"/g,
        'className="relative w-full h-full rounded-3xl bg-[var(--surface)] backdrop-blur-xl border border-[var(--border)] p-5 sm:p-6 shadow-xl max-md:overflow-hidden md:overflow-hidden flex flex-col transition-all"'
    );
    
    // Add `my-auto` to the center timer display to center it vertically
    content = content.replace(
        /<div className="relative z-10 flex flex-col items-center justify-center py-1 sm:py-6 max-md:my-auto">/g,
        '<div className="relative z-10 flex flex-col items-center justify-center py-1 sm:py-6 my-auto">'
    );

    // 2. Increase the size of DAILY OVERVIEW, TODAY, YESTERDAY
    // DAILY OVERVIEW text
    content = content.replace(
        /<span className="text-xs font-semibold tracking-wider text-neutral-300 uppercase">\s*DAILY OVERVIEW\s*<\/span>/g,
        '<span className="text-sm font-bold tracking-wider text-neutral-200 uppercase">\n                DAILY OVERVIEW\n              </span>'
    );

    // TODAY / YESTERDAY pills wrapper
    content = content.replace(
        /<div className="flex items-center gap-1 p-0\.5 rounded-xl bg-\[var\(--bg\)\] border border-\[var\(--border\)\] text-\[10px\]">/g,
        '<div className="flex items-center gap-1 p-0.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs">'
    );
    
    // Also change the padding of the pills slightly to accommodate the larger text
    content = content.replace(
        /px-2\.5 py-1 rounded-lg font-hud font-bold tracking-wider uppercase transition-all cursor-pointer/g,
        'px-3 py-1.5 rounded-lg font-hud font-bold tracking-wider uppercase transition-all cursor-pointer'
    );

    fs.writeFileSync(timerPath, content, 'utf8');
    console.log('Updated StudyTimer.tsx with layout alignment and text size fixes');
}

refineUI3();
