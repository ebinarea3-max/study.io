const fs = require('fs');
const path = 'src/components/timer/FocusModeModal.tsx';
let content = fs.readFileSync(path, 'utf8');

// The current timer block starts with:
// className="font-mono text-7xl sm:text-8xl md:text-[8rem] font-extralight tracking-tight text-white/95 drop-shadow-sm flex items-center justify-center gap-2"
const oldTimerRegex = /<div\s+className="font-mono text-7xl sm:text-8xl md:text-\[8rem\][^>]*>[\s\S]*?<\/div>\r?\n\s*\}\r?\n\s*<\/React.Fragment>\r?\n\s*\)\)\}\r?\n\s*<\/div>/;

const newTimer = `<div className={\`flex items-center justify-center gap-3 sm:gap-6 transition-all duration-700 ease-in-out \${isStudying && !isPaused ? 'scale-[1.15] sm:scale-125 translate-y-4' : 'scale-100 translate-y-0'}\`}>
                {displayTime.split(':').map((part, i, arr) => (
                  <React.Fragment key={i}>
                    {/* Digit Block (Flip Clock Style) */}
                    <div className="relative overflow-hidden rounded-3xl bg-[#0c0d12] border border-white/5 shadow-2xl flex items-center justify-center min-w-[130px] sm:min-w-[180px] md:min-w-[220px] h-[150px] sm:h-[200px] md:h-[260px]">
                      {/* Subtle horizontal line for flip-clock aesthetic */}
                      <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-black/60 z-10 w-full shadow-[0_1px_0_rgba(255,255,255,0.05)]" />
                      
                      <span 
                        className="font-mono text-8xl sm:text-[9rem] md:text-[12rem] font-medium tracking-tighter text-white/95 z-0 relative mt-4"
                        style={{ fontVariantNumeric: 'tabular-nums' }}
                      >
                        {part}
                      </span>
                      
                      {/* Glass glare */}
                      <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />
                    </div>

                    {/* Separator */}
                    {i < arr.length - 1 && (
                      <div className={\`flex flex-col gap-6 sm:gap-10 justify-center transition-opacity duration-500 \${isStudying && !isPaused ? 'animate-pulse' : 'opacity-30'}\`}>
                        <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-neutral-300 shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
                        <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-neutral-300 shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>`;

content = content.replace(oldTimerRegex, newTimer);
fs.writeFileSync(path, content, 'utf8');
console.log('Timer redesigned!');
