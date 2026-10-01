const fs = require('fs');

let content = fs.readFileSync('src/components/timer/StudyTimer.tsx', 'utf8');

const startIndex = content.indexOf('{/* Countdown Duration Selector */}');
const endIndex = content.indexOf('{/* Clean Pill/Segment Preset Selector (25/5 and 50/10) */}', startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + content.substring(endIndex);
}

// Now add isEditingCountdown state
if (!content.includes('const [isEditingCountdown, setIsEditingCountdown]')) {
  content = content.replace(
    'const [customCountdownInput, setCustomCountdownInput] = useState("");',
    'const [customCountdownInput, setCustomCountdownInput] = useState("");\n  const [isEditingCountdown, setIsEditingCountdown] = useState(false);'
  );
}

// Modify the timer text to be editable
const displayTimeStr = `{displayTime}`;
const editableTimeStr = `{timerMode === 'countdown' && !isStudying ? (
                      isEditingCountdown ? (
                        <input
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
                        />
                      ) : (
                        <span 
                          onClick={() => setIsEditingCountdown(true)} 
                          className="cursor-pointer hover:text-amber-400 transition-colors pointer-events-auto"
                          title="Click to edit duration"
                        >
                          {displayTime}
                        </span>
                      )
                    ) : (
                      displayTime
                    )}`;

content = content.replace(displayTimeStr, editableTimeStr);

// We need to change pointer-events-none on the Absolute Centered Content Wrapper
content = content.replace(
  '<div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">',
  '<div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 [&>div]:pointer-events-auto">'
);

fs.writeFileSync('src/components/timer/StudyTimer.tsx', content);
