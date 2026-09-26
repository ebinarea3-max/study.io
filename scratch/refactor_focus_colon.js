const fs = require('fs');
const path = 'src/components/timer/FocusModeModal.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /className="font-mono text-7xl sm:text-8xl md:text-\[8rem\] font-extralight tracking-tight text-white\/95 drop-shadow-sm"\r?\n\s*style=\{\{ fontVariantNumeric: 'tabular-nums' \}\}\r?\n\s*>\r?\n\s*\{displayTime\}\r?\n\s*<\/div>/,
  `className="font-mono text-7xl sm:text-8xl md:text-[8rem] font-extralight tracking-tight text-white/95 drop-shadow-sm flex items-center justify-center gap-2"
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
              </div>`
);

fs.writeFileSync(path, content, 'utf8');
console.log('FocusModeModal colon animated');
