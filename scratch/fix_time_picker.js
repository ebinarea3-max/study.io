const fs = require('fs');

let content = fs.readFileSync('src/components/timer/StudyTimer.tsx', 'utf8');

const oldInput = `<input
                          type="time"
                          step="1"
                          autoFocus
                          className="bg-transparent border-none text-center outline-none w-full text-white/95"
                          defaultValue={displayTime}
                          onBlur={(e) => {
                            setIsEditingCountdown(false);
                            const val = e.target.value;
                            if (val) {
                              const parts = val.split(':');
                              let secs = 0;
                              if (parts.length === 3) {
                                secs = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
                              } else if (parts.length === 2) {
                                secs = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60; // browsers usually return HH:mm if no seconds are chosen
                              }
                              if (!isNaN(secs) && secs > 0) {
                                setCountdownTarget(secs);
                              }
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.currentTarget.blur();
                            }
                          }}
                        />`;

const newInput = `<input
                          type="text"
                          inputMode="numeric"
                          autoFocus
                          spellCheck={false}
                          autoComplete="off"
                          className="bg-transparent border-none text-center outline-none w-full text-white/95 placeholder:text-white/20 selection:bg-amber-500/40"
                          defaultValue={displayTime}
                          placeholder="HH:MM:SS (or just 45 for mins)"
                          onBlur={(e) => {
                            setIsEditingCountdown(false);
                            const val = e.target.value.trim();
                            if (val) {
                              const parts = val.split(':').map(n => parseInt(n.trim()) || 0);
                              let secs = 0;
                              if (parts.length === 3) {
                                secs = parts[0] * 3600 + parts[1] * 60 + parts[2];
                              } else if (parts.length === 2) {
                                secs = parts[0] * 60 + parts[1]; // mm:ss
                              } else if (parts.length === 1) {
                                secs = parts[0] * 60; // just minutes
                              }
                              if (secs > 0) {
                                setCountdownTarget(secs);
                              }
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.currentTarget.blur();
                            }
                          }}
                        />`;

content = content.replace(oldInput, newInput);

fs.writeFileSync('src/components/timer/StudyTimer.tsx', content);
