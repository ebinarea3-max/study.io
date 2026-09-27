const fs = require('fs');
const path = require('path');

function refineUI() {
    const timerPath = path.join(__dirname, 'src/components/timer/StudyTimer.tsx');
    let content = fs.readFileSync(timerPath, 'utf8');

    // 1. Remove awkward top margin/empty gap & 2. Align bottom edges
    // The main timer card class currently is:
    // className="relative w-full h-full rounded-3xl bg-[var(--surface)] backdrop-blur-xl border border-[var(--border)] max-md:px-4 max-md:py-2 sm:p-8 lg:p-10 shadow-xl max-md:overflow-hidden md:overflow-hidden flex flex-col max-md:justify-between max-md:items-center md:justify-between transition-all max-md:mb-0 mb-2"
    // We want to remove `lg:p-10` and `sm:p-8`, replace with `p-6 md:p-7`. And remove `mb-2 max-md:mb-0`.
    content = content.replace(
        /className="relative w-full h-full rounded-3xl bg-\[var\(--surface\)\] backdrop-blur-xl border border-\[var\(--border\)\] max-md:px-4 max-md:py-2 sm:p-8 lg:p-10 shadow-xl max-md:overflow-hidden md:overflow-hidden flex flex-col max-md:justify-between max-md:items-center md:justify-between transition-all max-md:mb-0 mb-2"/g,
        'className="relative w-full h-full rounded-3xl bg-[var(--surface)] backdrop-blur-xl border border-[var(--border)] max-md:px-4 max-md:py-2 p-6 md:p-7 shadow-xl max-md:overflow-hidden md:overflow-hidden flex flex-col max-md:justify-between max-md:items-center md:justify-between transition-all"'
    );
    
    // Also, align bottom edges implies we should also check the left column flex space.
    // The left column div has `space-y-0 md:space-y-3`. We might leave it as is if it's fine.

    // 3. Make texts in "DAILY OVERVIEW" readable & aesthetic
    // 3a. Card Header
    content = content.replace(
        /<span className="text-xs font-hud font-bold text-white tracking-widest uppercase">\s*DAILY OVERVIEW\s*<\/span>/g,
        '<span className="text-xs font-semibold tracking-wider text-neutral-300 uppercase">\n                DAILY OVERVIEW\n              </span>'
    );

    // 3b. Section subtitle
    content = content.replace(
        /className="flex items-center justify-between text-\[11px\] text-slate-400 font-semibold font-hud tracking-wider uppercase relative z-10"/g,
        'className="flex items-center justify-between text-xs font-medium text-neutral-400 relative z-10"'
    );
    // Remove the `font-hud-mono` from the date
    content = content.replace(
        /<span className="font-hud-mono">/g,
        '<span>'
    );

    // 3c. Metric Row Labels & Values
    // Strip background class on readout strip and add gap
    content = content.replace(
        /<div className="rounded-xl bg-\[var\(--bg\)\] border border-\[var\(--border\)\] p-3 divide-y divide-white\/\[0\.08\] space-y-2 relative z-10">/g,
        '<div className="rounded-xl bg-[var(--bg)] border border-[var(--border)] p-3 relative z-10">'
    );

    // Row 1: Total Focus
    content = content.replace(
        /<div className="flex items-center justify-between pt-1">/g,
        '<div className="flex items-center justify-between py-2.5 sm:py-3 border-b border-white/[0.04]">'
    );
    content = content.replace(
        /<div className="text-\[10px\] font-hud font-bold tracking-widest text-slate-400 uppercase">\s*TOTAL FOCUS\s*<\/div>/g,
        '<div className="text-xs font-semibold tracking-wide text-neutral-200">TOTAL FOCUS</div>'
    );
    content = content.replace(
        /<div className="text-xs text-slate-500 font-medium">Recorded study duration<\/div>/g,
        '<div className="text-[11px] text-neutral-400/80">Recorded study duration</div>'
    );
    content = content.replace(
        /className="text-lg font-hud font-black tracking-tight tabular-nums"/g,
        'className="text-base md:text-lg font-bold text-white tracking-tight tabular-nums"'
    );

    // Row 2: SESSIONS
    content = content.replace(
        /<div className="flex items-center justify-between pt-2">/g,
        '<div className="flex items-center justify-between py-2.5 sm:py-3 border-b border-white/[0.04]">'
    );
    content = content.replace(
        /<div className="text-\[10px\] font-hud font-bold tracking-widest text-slate-400 uppercase">\s*SESSIONS\s*<\/div>/g,
        '<div className="text-xs font-semibold tracking-wide text-neutral-200">SESSIONS</div>'
    );
    content = content.replace(
        /<div className="text-xs text-slate-500 font-medium">Completed study blocks<\/div>/g,
        '<div className="text-[11px] text-neutral-400/80">Completed study blocks</div>'
    );
    content = content.replace(
        /<div className="text-lg font-hud font-black text-white tracking-tight tabular-nums">/g,
        '<div className="text-base md:text-lg font-bold text-white tracking-tight tabular-nums">'
    );

    // Row 3: ACTIVE STREAK
    content = content.replace(
        /<div className="flex items-center justify-between pt-2">/g,
        '<div className="flex items-center justify-between py-2.5 sm:py-3">'
    );
    content = content.replace(
        /<div className="text-\[10px\] font-hud font-bold tracking-widest text-slate-400 uppercase">\s*ACTIVE STREAK\s*<\/div>/g,
        '<div className="text-xs font-semibold tracking-wide text-neutral-200">ACTIVE STREAK</div>'
    );
    content = content.replace(
        /<div className="text-xs text-slate-500 font-medium">Daily consistency multiplier<\/div>/g,
        '<div className="text-[11px] text-neutral-400/80">Daily consistency multiplier</div>'
    );
    content = content.replace(
        /<span className="text-lg font-hud font-black tracking-tight"/g,
        '<span className="text-base md:text-lg font-bold text-white tracking-tight"'
    );
    
    // Ensure the main layout grid has matching heights.
    // The right column currently is: className="hidden lg:block lg:col-span-4 space-y-4 pr-2 md:overflow-visible"
    // To match bottom of right column, we can change the right column to be a flex column with space-between.
    content = content.replace(
        /<div className="hidden lg:block lg:col-span-4 space-y-4 pr-2 md:overflow-visible">/g,
        '<div className="hidden lg:block lg:col-span-4 flex flex-col justify-between h-full space-y-4 pr-2 md:overflow-visible">'
    );

    fs.writeFileSync(timerPath, content, 'utf8');
    console.log('Updated StudyTimer.tsx padding and typography');
}

refineUI();
