$file = "src/context/StudyContext.tsx"
$content = Get-Content $file -Raw

# 1. Add to StudyContextType
$typeTarget = "  dismissXpNotification: () => void;"
$typeReplacement = "  dismissXpNotification: () => void;
  isIdleCheckActive: boolean;
  confirmIdleCheck: () => void;"
$content = $content.Replace($typeTarget, $typeReplacement)

# 2. Add state to StudyProvider
$stateTarget = "  const [isFocusModeOpen, setIsFocusModeOpen] = useState(false);"
$stateReplacement = "  const [isFocusModeOpen, setIsFocusModeOpen] = useState(false);
  const [isIdleCheckActive, setIsIdleCheckActive] = useState(false);
  const idleCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const idleCheckFiredRef = useRef(false);

  const confirmIdleCheck = useCallback(() => {
    setIsIdleCheckActive(false);
    if (idleCheckTimeoutRef.current) {
      clearTimeout(idleCheckTimeoutRef.current);
      idleCheckTimeoutRef.current = null;
    }
  }, []);"
$content = $content.Replace($stateTarget, $stateReplacement)

# 3. Add to context provider value
$valTarget = "      dismissXpNotification,"
$valReplacement = "      dismissXpNotification,
      isIdleCheckActive,
      confirmIdleCheck,"
$content = $content.Replace($valTarget, $valReplacement)

# 4. Add timer logic for 14400s (4 hours)
$timerTarget = "        accumulatedSecondsRef.current = actualElapsed;"
$timerReplacement = "        accumulatedSecondsRef.current = actualElapsed;

        // 4-hour idle check
        if (actualElapsed >= 14400 && !idleCheckFiredRef.current && timerMode !== 'pomodoro') {
          idleCheckFiredRef.current = true;
          setIsIdleCheckActive(true);
          
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            const iconUrl = window.location.origin + '/icon-192.png';
            new Notification('Are you still studying?', { body: 'Timer reached 4 hours. Confirm to keep it running.', icon: iconUrl, requireInteraction: true });
          }

          idleCheckTimeoutRef.current = setTimeout(() => {
            setIsIdleCheckActive(false);
            setIsPaused(true);
            if (timerIntervalRef.current) {
              clearInterval(timerIntervalRef.current);
              timerIntervalRef.current = null;
            }
            startTimeRef.current = null;
          }, 20000);
        }
"
$content = $content.Replace($timerTarget, $timerReplacement)

# Reset idleCheckFired on timer stop/reset
$resetTarget = "    setElapsedSeconds(0);
    accumulatedSecondsRef.current = 0;
  }, [isStudying]);"
$resetReplacement = "    setElapsedSeconds(0);
    accumulatedSecondsRef.current = 0;
    idleCheckFiredRef.current = false;
  }, [isStudying]);"
$content = $content.Replace($resetTarget, $resetReplacement)

Set-Content $file -Value $content
