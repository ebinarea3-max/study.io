import os

path = 'src/context/StudyContext.tsx'
content = open(path, encoding='utf-8').read()
target = """  const dismissRankSettlement = useCallback(() => {
    setSettlementData(null);
    // Keep paused break state intact if transitioning to break
    if (timerMode !== 'pomodoro' || pomodoroPhase !== 'shortBreak') {
      resetTimer();
    }
    setCurrentNotes('');
    setIsFocusModeOpen(false);
    refetchSessions();
  }, [timerMode, pomodoroPhase, resetTimer, refetchSessions]);"""

repl = """  const dismissRankSettlement = useCallback(() => {
    setSettlementData(null);
    setCurrentNotes('');
    setIsFocusModeOpen(false);
    refetchSessions();
  }, [refetchSessions]);"""

if target in content:
    content = content.replace(target, repl)
elif target.replace('\n', '\r\n') in content:
    content = content.replace(target.replace('\n', '\r\n'), repl)

open(path, 'w', encoding='utf-8').write(content)
