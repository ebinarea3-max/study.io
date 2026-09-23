const fs = require('fs');
const studyTimerPath = './src/components/timer/StudyTimer.tsx';
let timer = fs.readFileSync(studyTimerPath, 'utf8');

// The messed up section is around line 684
const messedUpRegex = /\{\/\* Subtle Ambient Glow \*\/\}\s*<span className="font-hud tracking-wide">PREVIOUS SESSION RESTORED \(PAUSED\)<\/span>\s*<\/div>\s*<button\s*onClick=\{\(\) => setShowRecoveryBanner\(false\)\}\s*className="p-1\.5 rounded-xl hover:bg-amber-500\/20 text-amber-300 transition-colors cursor-pointer"\s*title="Dismiss"\s*>\s*<X className="w-3\.5 h-3\.5" \/>\s*<\/button>\s*<\/div>\s*\)\}/;

const fixedContent = `{/* Subtle Ambient Glow */}\n\n          {/* Session Resumed Alert Banner */}\n          {showRecoveryBanner && (\n            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-sm px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 backdrop-blur-md flex items-center justify-between shadow-lg z-50 animate-in fade-in slide-in-from-top-4">\n              <div className="flex items-center gap-2 text-amber-300 text-[10px] font-bold">\n                <Zap className="w-3.5 h-3.5 fill-current animate-pulse" />\n                <span className="font-hud tracking-wide">PREVIOUS SESSION RESTORED (PAUSED)</span>\n              </div>\n              <button\n                onClick={() => setShowRecoveryBanner(false)}\n                className="p-1.5 rounded-xl hover:bg-amber-500/20 text-amber-300 transition-colors cursor-pointer"\n                title="Dismiss"\n              >\n                <X className="w-3.5 h-3.5" />\n              </button>\n            </div>\n          )}`;

timer = timer.replace(messedUpRegex, fixedContent);
fs.writeFileSync(studyTimerPath, timer, 'utf8');

console.log('Fixed syntax error');
