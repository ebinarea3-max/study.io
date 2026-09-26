const fs = require('fs');
let content = fs.readFileSync('src/components/timer/FocusModeModal.tsx', 'utf8');

const oldStr = `              {/* Big Digital Clock */}
              <div
                className="font-mono text-7xl sm:text-8xl md:text-[8rem] font-extralight tracking-tight text-white/95 drop-shadow-sm flex items-center justify-center gap-2"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {displayTime.split(':').map((part, i, arr) => (
                  <React.Fragment key={i}>
                    {part}
                    {i < arr.length - 1 && (
                      <span className={\`opacity-30 \${isStudying && !isPaused ? 'animate-pulse' : ''} -mt-4\`}>
                        :
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </div>`;

const newStr = `              {/* Big Digital Clock (Flip Clock Aesthetic) */}
              <div className={\`flex items-center justify-center gap-3 sm:gap-6 transition-all duration-700 ease-in-out \${isStudying && !isPaused ? 'scale-[1.15] sm:scale-125 translate-y-4' : 'scale-100 translate-y-0'}\`}>
                {displayTime.split(':').map((part, i, arr) => (
                  <React.Fragment key={i}>
                    {/* Digit Block (Flip Clock Style) */}
                    <div className="relative overflow-hidden rounded-3xl bg-[#0c0d12] border border-white/5 shadow-2xl flex items-center justify-center min-w-[110px] sm:min-w-[150px] md:min-w-[190px] h-[130px] sm:h-[180px] md:h-[230px]">
                      {/* Subtle horizontal line for flip-clock aesthetic */}
                      <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-black/60 z-10 w-full shadow-[0_1px_0_rgba(255,255,255,0.05)]" />
                      
                      <span 
                        className="font-mono text-7xl sm:text-[7.5rem] md:text-[10rem] font-medium tracking-tighter text-white/95 z-0 relative"
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

if (content.includes(oldStr)) {
    content = content.replace(oldStr, newStr);
    fs.writeFileSync('src/components/timer/FocusModeModal.tsx', content);
    console.log("Successfully replaced timer");
} else {
    // try removing carriage returns from oldStr
    const oldStrNoCR = oldStr.replace(/\r/g, '');
    const contentNoCR = content.replace(/\r/g, '');
    if (contentNoCR.includes(oldStrNoCR)) {
        content = contentNoCR.replace(oldStrNoCR, newStr);
        fs.writeFileSync('src/components/timer/FocusModeModal.tsx', content);
        console.log("Successfully replaced timer (ignore CR)");
    } else {
        console.log("Not found even without CR");
    }
}
