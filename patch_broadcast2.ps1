$file = 'src/context/StudyContext.tsx'
$content = Get-Content $file -Raw

$targetEffect = '  // Real-Time Delta Tracking: Synchronized interval engine running at 500ms tick to eliminate background throttling drift'
$replacementEffect = '  // BroadcastChannel for Single-Active-Tab Timer Locking
  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;
    const channel = new BroadcastChannel("studypulse_timer_channel");
    broadcastChannelRef.current = channel;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "TIMER_STARTED") {
        if (isRunning) {
          setIsPaused(true);
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
          startTimeRef.current = null;
          toast("Timer paused because another tab started a session.", { icon: "?" });
        }
        setIsBlockedByOtherTab(true);
      } else if (event.data?.type === "TIMER_STOPPED") {
        setIsBlockedByOtherTab(false);
      } else if (event.data?.type === "PING_STATUS") {
        if (isRunning) {
          channel.postMessage({ type: "TIMER_STARTED" });
        }
      }
    };

    channel.addEventListener("message", handleMessage);
    channel.postMessage({ type: "PING_STATUS" });

    return () => {
      channel.removeEventListener("message", handleMessage);
      channel.close();
    };
  }, [isRunning]);

  // Broadcast state changes
  useEffect(() => {
    if (isRunning) {
      broadcastChannelRef.current?.postMessage({ type: "TIMER_STARTED" });
    } else {
      broadcastChannelRef.current?.postMessage({ type: "TIMER_STOPPED" });
    }
  }, [isRunning]);

  // Real-Time Delta Tracking: Synchronized interval engine running at 500ms tick to eliminate background throttling drift'
$content = $content.Replace($targetState, $replacementState)
$content = $content.Replace($targetEffect, $replacementEffect)

Set-Content $file -Value $content
