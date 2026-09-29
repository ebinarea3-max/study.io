import os

path = 'src/components/timer/StudyTimer.tsx'
content = open(path, encoding='utf-8').read()
target = "<span>50 / 10</span>\n                  </button>"

repl = """<span>50 / 10</span>
                  </button>

                  <button
                    onClick={() => {
                      if (!isStudying) setPomodoroPreset('test-5s');
                    }}
                    disabled={isStudying}
                    className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 active:scale-95 ${
                      pomodoroPreset === 'test-5s'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                        : 'text-neutral-400 hover:text-amber-500/50 border border-transparent'
                    } ${isStudying ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                    title="Dev Test: 5s Focus / 3s Break"
                  >
                    <span>Dev Test (5s)</span>
                  </button>"""

if target in content:
    content = content.replace(target, repl)
elif target.replace('\n', '\r\n') in content:
    content = content.replace(target.replace('\n', '\r\n'), repl)

open(path, 'w', encoding='utf-8').write(content)
