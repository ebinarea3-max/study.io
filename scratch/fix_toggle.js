const fs = require('fs');

let content = fs.readFileSync('src/components/timer/StudyTimer.tsx', 'utf8');

const regex = /<div className="flex items-center gap-1 p-0\.5 sm:p-1 rounded-2xl bg-\[var\(--bg\)\] border border-\[var\(--border\)\]">[\s\S]*?<\/div>/;

const newToggle = `<div className="grid grid-cols-3 gap-1 p-0.5 sm:p-1 rounded-2xl bg-[var(--bg)] border border-[var(--border)]">
                <button
                  onClick={() => { if (!isStudying) setTimerMode('stopwatch'); }}
                  disabled={isStudying}
                  className={\`px-2 sm:px-4 py-1 sm:py-1.5 rounded-xl text-[10px] sm:text-xs font-hud font-bold tracking-wider transition-all active:scale-95 \${
                    timerMode === 'stopwatch'
                      ? 'text-slate-950 shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  } \${isStudying ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}\`}
                  style={timerMode === 'stopwatch' ? { backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' } : { color: '#94A3B8' }}
                >
                  <span className="hidden sm:inline">STOPWATCH</span><span className="sm:hidden">STOP</span>
                </button>
                <button
                  onClick={() => { if (!isStudying) setTimerMode('pomodoro'); }}
                  disabled={isStudying}
                  className={\`px-2 sm:px-4 py-1 sm:py-1.5 rounded-xl text-[10px] sm:text-xs font-hud font-bold tracking-wider transition-all active:scale-95 \${
                    timerMode === 'pomodoro'
                      ? 'text-slate-950 shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  } \${isStudying ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}\`}
                  style={timerMode === 'pomodoro' ? { backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' } : { color: '#94A3B8' }}
                >
                  <span className="hidden sm:inline">POMODORO</span><span className="sm:hidden">POMO</span>
                </button>
                <button
                  onClick={() => { if (!isStudying) setTimerMode('countdown'); }}
                  disabled={isStudying}
                  className={\`px-2 sm:px-4 py-1 sm:py-1.5 rounded-xl text-[10px] sm:text-xs font-hud font-bold tracking-wider transition-all active:scale-95 \${
                    timerMode === 'countdown'
                      ? 'text-slate-950 shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  } \${isStudying ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}\`}
                  style={timerMode === 'countdown' ? { backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' } : { color: '#94A3B8' }}
                >
                  <span className="hidden sm:inline">COUNTDOWN</span><span className="sm:hidden">TIMER</span>
                </button>
              </div>`;

content = content.replace(regex, newToggle);

fs.writeFileSync('src/components/timer/StudyTimer.tsx', content);
