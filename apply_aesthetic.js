const fs = require('fs');
const path = 'src/components/timer/StudyTimer.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Timer Size
content = content.replace(
  'py-1 sm:py-6 my-auto',
  'py-4 sm:py-8 my-auto w-full'
);
content = content.replace(
  'p-1 sm:p-2 w-56 h-56 sm:w-64 sm:h-64 md:w-80 md:h-80 mx-auto aspect-square transition-all duration-300 rounded-full flex-shrink-0 ${',
  'group p-2 sm:p-4 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 mx-auto aspect-square transition-all duration-500 rounded-full flex-shrink-0 ${'
);
content = content.replace(
  ": ''",
  ": 'hover:scale-[1.02]'"
);

// 2. Halo
content = content.replace(
  "className=\"absolute inset-0 rounded-full blur-xl pointer-events-none transition-all duration-700 opacity-[0.08]\"",
  "className=\"absolute inset-[-10%] rounded-full blur-3xl pointer-events-none transition-all duration-700 opacity-[0.12] group-hover:opacity-[0.25]\""
);
// Insert second halo
content = content.replace(
  "style={{ backgroundColor: 'var(--accent)' }}\n              />",
  "style={{ backgroundColor: 'var(--accent)' }}\n              />\n              <div\n                className=\"absolute inset-[10%] rounded-full blur-2xl pointer-events-none transition-all duration-500 opacity-[0.15] group-hover:opacity-[0.3]\"\n                style={{ backgroundColor: 'var(--accent)' }}\n              />"
);

// 3. Inner Dial
content = content.replace(
  "w-[78%] h-[78%] rounded-full bg-[var(--bg)] flex flex-col items-center justify-center p-2.5 sm:p-6 text-center relative z-10 shadow-inner\"",
  "w-[78%] h-[78%] rounded-full flex flex-col items-center justify-center p-4 sm:p-8 text-center relative z-10 backdrop-blur-md transition-all duration-300\""
);
content = content.replace(
  "style={{ border: \"2px solid rgba(255, 255, 255, 0.12)\", boxShadow: \"inset 0 2px 10px rgba(0, 0, 0, 0.8)\" }}",
  "style={{ backgroundColor: 'rgba(10, 15, 25, 0.65)', border: \"1px solid rgba(255, 255, 255, 0.08)\", boxShadow: \"0 8px 32px rgba(0, 0, 0, 0.5), inset 0 2px 15px rgba(255, 255, 255, 0.05)\" }}"
);
content = content.replace(
  "className=\"mb-1 sm:mb-2 text-[10px] sm:text-[11px] font-hud font-bold px-2.5 sm:px-3 py-0.5 rounded-full border transition-colors max-w-[90%] truncate shadow-sm uppercase tracking-wider\"",
  "className=\"mb-2 sm:mb-3 text-[10px] sm:text-xs font-hud font-bold px-3 sm:px-4 py-1 rounded-full border transition-colors max-w-[90%] truncate shadow-sm uppercase tracking-wider backdrop-blur-sm\""
);
content = content.replace(
  "backgroundColor: selectedSubject ? theme.badgeBg : 'rgba(255, 255, 255, 0.05)'",
  "backgroundColor: selectedSubject ? theme.badgeBg : 'rgba(255, 255, 255, 0.03)'"
);
content = content.replace(
  "borderColor: selectedSubject ? 'var(--border)' : 'rgba(255, 255, 255, 0.1)'",
  "borderColor: selectedSubject ? 'var(--border)' : 'rgba(255, 255, 255, 0.08)'"
);
content = content.replace(
  "font-mono text-3xl sm:text-4xl md:text-5xl tracking-tight text-white drop-shadow-lg tabular-nums select-none",
  "font-mono text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tighter text-white drop-shadow-xl tabular-nums select-none transition-all duration-300 my-1 sm:my-2"
);
content = content.replace(
  "textShadow: isStudying && !isPaused ? '0 0 16px var(--glow)' : undefined",
  "textShadow: isStudying && !isPaused ? `0 0 20px ${theme.glow}, 0 0 40px ${theme.glow}80` : '0 4px 20px rgba(0,0,0,0.5)'"
);

// 4. Buttons
content = content.replace(
  "className={`px-8 sm:px-10 py-3.5 sm:py-4 font-sans font-bold text-sm uppercase tracking-wide transition-all flex items-center justify-center gap-2.5 w-full xs:w-auto rounded-xl ${",
  "className={`group relative overflow-hidden px-10 sm:px-12 py-4 sm:py-5 font-sans font-bold text-sm sm:text-base uppercase tracking-widest transition-all flex items-center justify-center gap-3 w-full xs:w-auto rounded-2xl ${"
);
content = content.replace(
  ": 'cursor-pointer hover:scale-[1.02]'",
  ": 'cursor-pointer hover:scale-[1.03] hover:-translate-y-1'"
);
content = content.replace(
  "style={{ background: theme.gradient, color: \"#000000\", fontWeight: 800, border: \"none\", boxShadow: `0 8px 32px ${theme.glow}60, inset 0 2px 4px rgba(255,255,255,0.3)` }}",
  "style={{ background: theme.gradient, color: \"#000000\", fontWeight: 900, border: \"none\", boxShadow: `0 12px 40px ${theme.glow}70, inset 0 2px 6px rgba(255,255,255,0.4)` }}"
);

// We add a shimmer to the start button 
content = content.replace(
  "<Play className=\"w-4 sm:w-5 h-4 sm:h-5 fill-current\" />\n                  <span>START SESSION</span>",
  "<div className=\"absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-[100%] group-hover:animate-[shimmer_1.5s_infinite]\" />\n                  <Play className=\"w-5 sm:w-6 h-5 sm:h-6 fill-current relative z-10\" />\n                  <span className=\"relative z-10\">START SESSION</span>"
);

fs.writeFileSync(path, content);
console.log('Applied!');
