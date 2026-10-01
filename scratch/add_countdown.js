const fs = require('fs');

let content = fs.readFileSync('src/components/timer/StudyTimer.tsx', 'utf8');

// 1. Add countdownTarget state
if (!content.includes('const [countdownTarget, setCountdownTarget]')) {
  content = content.replace(
    'const [isAmbientMenuOpen, setIsAmbientMenuOpen] = useState(false);',
    'const [isAmbientMenuOpen, setIsAmbientMenuOpen] = useState(false);\n  const [countdownTarget, setCountdownTarget] = useState<number>(3600);\n  const [customCountdownInput, setCustomCountdownInput] = useState("");'
  );
}

// 2. Add useEffect for countdown auto-complete
const useEffectHook = `  useEffect(() => {
    if (timerMode === 'countdown' && isStudying && elapsedSeconds >= countdownTarget) {
      soundFx.playStartChime();
      completeTimer();
    }
  }, [timerMode, isStudying, elapsedSeconds, countdownTarget, completeTimer]);

  useEffect(() => {
    return () => {`;
content = content.replace(/  useEffect\(\(\) => \{\n    return \(\) => \{/, useEffectHook);

// 3. Update displayTime and progressPercent
const displayTimeLogic = `  if (timerMode === 'pomodoro') {
    const target = pomodoroPhase === 'work' ? pomodoroWorkDuration : pomodoroBreakDuration;
    const remaining = Math.max(0, target - elapsedSeconds);
    displayTime = formatSeconds(remaining);
    progressPercent = Math.min(100, (elapsedSeconds / target) * 100);
  } else if (timerMode === 'countdown') {
    const target = countdownTarget;
    const remaining = Math.max(0, target - elapsedSeconds);
    displayTime = formatSeconds(remaining);
    progressPercent = Math.min(100, (elapsedSeconds / Math.max(1, target)) * 100);
  } else {`;
content = content.replace(/  if \(timerMode === 'pomodoro'\) \{[\s\S]*?\} else \{/, displayTimeLogic);

// 4. Update the Toggle Mode section
const toggleModeRegex = /<div className="flex bg-\[\#131822\] p-1 rounded-2xl border border-white\/10 mb-5 sm:mb-8 mx-auto max-w-\[200px\] sm:max-w-xs shadow-inner">[\s\S]*?<\/div>/;
const newToggleMode = `<div className="grid grid-cols-3 gap-1 p-1 bg-[#131822] rounded-xl border border-white/10 mb-5 sm:mb-8 mx-auto w-full sm:max-w-md shadow-inner">
                <button
                  onClick={() => { if (!isStudying) setTimerMode('stopwatch'); }}
                  disabled={isStudying}
                  className={\`px-1 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-hud font-bold tracking-wider transition-all active:scale-95 \${
                    timerMode === 'stopwatch'
                      ? 'text-slate-950 shadow-sm bg-white/10'
                      : 'text-neutral-400 hover:text-white'
                  } \${isStudying ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}\`}
                  style={timerMode === 'stopwatch' ? { backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' } : { color: '#94A3B8' }}
                >
                  STOPWATCH
                </button>
                <button
                  onClick={() => { if (!isStudying) setTimerMode('pomodoro'); }}
                  disabled={isStudying}
                  className={\`px-1 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-hud font-bold tracking-wider transition-all active:scale-95 \${
                    timerMode === 'pomodoro'
                      ? 'text-slate-950 shadow-sm bg-white/10'
                      : 'text-neutral-400 hover:text-white'
                  } \${isStudying ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}\`}
                  style={timerMode === 'pomodoro' ? { backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' } : { color: '#94A3B8' }}
                >
                  <span className="hidden sm:inline">POMODORO</span><span className="sm:hidden">POMO</span>
                </button>
                <button
                  onClick={() => { if (!isStudying) setTimerMode('countdown'); }}
                  disabled={isStudying}
                  className={\`px-1 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-hud font-bold tracking-wider transition-all active:scale-95 \${
                    timerMode === 'countdown'
                      ? 'text-slate-950 shadow-sm bg-white/10'
                      : 'text-neutral-400 hover:text-white'
                  } \${isStudying ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}\`}
                  style={timerMode === 'countdown' ? { backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' } : { color: '#94A3B8' }}
                >
                  <span className="hidden sm:inline">COUNTDOWN</span><span className="sm:hidden">TIMER</span>
                </button>
              </div>`;

content = content.replace(toggleModeRegex, newToggleMode);

// 5. Add Countdown Duration Presets UI right after the Pomodoro Preset UI
const countdownPresets = `
              {/* Countdown Duration Selector */}
              {timerMode === 'countdown' && !isRunning && elapsedSeconds === 0 && (
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 w-full justify-start sm:justify-center mb-6 max-w-full">
                  {[ 
                    { label: '30m', val: 1800 }, 
                    { label: '45m', val: 2700 }, 
                    { label: '1h', val: 3600 }, 
                    { label: '1.5h', val: 5400 }, 
                    { label: '2h', val: 7200 }, 
                    { label: '3h', val: 10800 } 
                  ].map(preset => (
                    <button
                      key={preset.label}
                      onClick={() => {
                        setCountdownTarget(preset.val);
                        setCustomCountdownInput("");
                      }}
                      className={\`flex-shrink-0 px-3 py-1.5 text-xs font-mono rounded-md transition-all \${
                        countdownTarget === preset.val && !customCountdownInput
                          ? 'border border-amber-500/60 bg-amber-500/10 text-amber-400 font-semibold shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                          : 'border border-white/10 bg-[#161b22] text-neutral-300 hover:border-amber-500/50 hover:text-amber-400'
                      }\`}
                    >
                      {preset.label}
                    </button>
                  ))}
                  <div className="flex-shrink-0 flex items-center gap-1 border border-white/10 bg-[#161b22] rounded-md px-2 py-1 focus-within:border-amber-500/50 transition-colors">
                    <input
                      type="text"
                      placeholder="Custom ⚙"
                      value={customCountdownInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomCountdownInput(val);
                        const mins = parseInt(val, 10);
                        if (!isNaN(mins) && mins > 0 && mins <= 720) {
                          setCountdownTarget(mins * 60);
                        }
                      }}
                      className="bg-transparent text-xs font-mono text-neutral-300 placeholder:text-neutral-500 outline-none w-20 text-center"
                    />
                  </div>
                </div>
              )}`;

content = content.replace('{/* Clean Pill/Segment Preset Selector (25/5 and 50/10) */}', countdownPresets + '\n\n              {/* Clean Pill/Segment Preset Selector (25/5 and 50/10) */}');

// Update dial size to responsive `w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 mx-auto` and text to `text-3xl sm:text-5xl font-mono font-bold tracking-tight text-white`
content = content.replace('className="relative w-64 h-64 sm:w-80 sm:h-80 mx-auto flex items-center justify-center"', 'className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 mx-auto flex items-center justify-center"');
content = content.replace('className="text-4xl sm:text-6xl font-mono font-bold tracking-tight text-white drop-shadow-xl"', 'className="text-3xl sm:text-5xl md:text-6xl font-mono font-bold tracking-tight text-white drop-shadow-xl"');

// Update primary action button styling
const buttonRegex = /<button\s+onClick=\{isRunning \? (handleStopClick|pauseTimer) : handlePlayClick\}[\s\S]*?<\/button>/g;
content = content.replace(buttonRegex, (match) => {
  return match.replace(/className="[^"]+"/, 'className="w-full max-w-sm mx-auto flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold uppercase tracking-wider py-3.5 sm:py-4 rounded-lg shadow-[0_0_25px_rgba(245,158,11,0.25)] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"');
});

fs.writeFileSync('src/components/timer/StudyTimer.tsx', content);
console.log("Done");
