const fs = require('fs');
const studyTimerPath = './src/components/timer/StudyTimer.tsx';
let timer = fs.readFileSync(studyTimerPath, 'utf8');

const regex = /<div\s*className="w-\[78%\] h-\[78%\] rounded-full bg-\[var\(--bg\)\] border flex flex-col items-center justify-center p-2\.5 sm:p-6 text-center relative z-10 shadow-inner"\s*style=\{\{ borderColor: "rgba\(255, 255, 255, 0\.1\)", boxShadow: "inset 0 2px 10px rgba\(0, 0, 0, 0\.8\)" \}\}>/;

const missingCode = `<div
                className="w-[78%] h-[78%] rounded-full bg-[var(--bg)] border flex flex-col items-center justify-center p-2.5 sm:p-6 text-center relative z-10 shadow-inner"
                style={{ borderColor: "rgba(255, 255, 255, 0.1)", boxShadow: "inset 0 2px 10px rgba(0, 0, 0, 0.8)" }}
              >
                {/* Pomodoro Phase / Subject Pill */}
                <div
                  className="mb-1 sm:mb-2 text-[10px] sm:text-[11px] font-hud font-bold px-2.5 sm:px-3 py-0.5 rounded-full border transition-colors max-w-[90%] truncate shadow-sm uppercase tracking-wider"
                  style={{
                    backgroundColor: selectedSubject ? theme.badgeBg : 'rgba(255, 255, 255, 0.05)',
                    borderColor: selectedSubject ? 'var(--border)' : 'rgba(255, 255, 255, 0.1)',
                    color: selectedSubject ? 'var(--accent)' : '#94a3b8',
                  }}
                >
                  {!selectedSubject
                    ? 'Select a subject'
                    : timerMode === 'pomodoro'
                    ? pomodoroPhase === 'work'
                      ? \`Focus: \${selectedSubject.name}\`
                      : 'Break'
                    : selectedSubject.name}
                </div>

                {/* Big Technical Digital Numbers */}
                <div
                  className="font-mono text-4xl sm:text-5xl md:text-6xl tracking-tight text-white drop-shadow-lg tabular-nums select-none"
                  style={{
                    textShadow: isStudying && !isPaused ? '0 0 16px var(--glow)' : undefined,
                  }}
                >
                  {displayTime}
                </div>

                {/* Animated HUD Monospace Status Readout */}
                <div className="mt-1.5 sm:mt-2 flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-hud-mono font-bold tracking-wider uppercase">
                  <span
                    className={\`w-2 h-2 rounded-full transition-all \${
                      pomodoroCompletedPhase === 'work'
                        ? 'animate-ping'
                        : pomodoroCompletedPhase === 'break'
                        ? 'animate-bounce'
                        : isStudying
                        ? isPaused
                          ? ''
                          : 'animate-pulse'
                        : 'animate-[pulse_2s_ease-in-out_infinite]'
                    }\`}
                    style={{
                      backgroundColor:
                        pomodoroCompletedPhase === 'work'
                          ? '#10B981'
                          : isStudying
                          ? isPaused
                            ? '#f59e0b'
                            : '#10B981'
                          : '#10B981',
                      boxShadow: '0 0 8px #10B981',
                    }}
                  />
                  <span style={{ color: isStudying && !isPaused ? 'var(--accent)' : '#94A3B8' }}>`;

timer = timer.replace(regex, missingCode);
fs.writeFileSync(studyTimerPath, timer, 'utf8');
console.log('Fixed syntax error by restoring code');
