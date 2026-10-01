const fs = require('fs');

let lines = fs.readFileSync('src/context/StudyContext.tsx', 'utf8').split('\n');

const startIdx = lines.findIndex(l => l.includes('Realtime Sync Engine'));
const endIdx = lines.findIndex(l => l.includes('Load from Supabase or localStorage fallback'));

const newBlock = `  // -------------------------------------------------------------
  // REST Polling Engine (Replaces Supabase Postgres Changes)
  // -------------------------------------------------------------
  useEffect(() => {
    const userId = user?.id;
    if (!userId || userId.startsWith('user-scholar') || userId.startsWith('guest')) {
      setRealtimeStatus('WAITING_AUTH');
      setIsSyncConnected(false);
      setIsUsingPollingFallback(false);
      isUsingPollingFallbackRef.current = false;
      return;
    }

    setRealtimeStatus('HTTP_POLLING');
    setIsUsingPollingFallback(true);
    isUsingPollingFallbackRef.current = true;
    setIsSyncConnected(true);

    const runPoll = async () => {
      try {
        const { data, error } = await supabase
          .from('active_sessions')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (!error && handleRemoteSyncRef.current) {
          handleRemoteSyncRef.current(data || null);
        }
      } catch (err) {
        // Only log actual unhandled errors, omit standard net errors to reduce noise
      }
    };

    // Initial fetch
    runPoll();

    // Background interval (25 seconds)
    const interval = setInterval(() => {
      runPoll();
    }, 25000);

    // Window focus refresh
    const handleFocus = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        runPoll();
        refetchSessions(); // Refresh stats on focus
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [user?.id, refetchSessions]);

`;

lines.splice(startIdx - 1, endIdx - startIdx, newBlock);

fs.writeFileSync('src/context/StudyContext.tsx', lines.join('\n'));
