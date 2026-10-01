const fs = require('fs');

let lines = fs.readFileSync('src/context/StudyContext.tsx', 'utf8').split('\n');

const startIdx = lines.findIndex(l => l.includes("useEffect(() => {") && lines.slice(Math.max(0, lines.indexOf(l) - 5), lines.indexOf(l)).some(x => x.includes("Realtime")));
let actualStart = startIdx;
if (actualStart === -1) {
  // Try another way to find it
  actualStart = lines.findIndex(l => l.includes('const stopPolling = () => {')) - 10;
}

const endStr = "  }, [user?.id, refetchActiveSession]);";
const endIdx = lines.findIndex((l, idx) => idx > actualStart && l === endStr);

if (actualStart > -1 && endIdx > -1) {
  // Need to find the start of the useEffect properly
  let uStart = actualStart;
  while(uStart > 0 && !lines[uStart].includes("useEffect(() => {")) {
    uStart--;
  }

  const newBlock = `  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

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
        // Silent error to prevent console noise
      }
    };

    runPoll();

    const interval = setInterval(() => {
      runPoll();
    }, 25000);

    const handleFocus = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        runPoll();
      }
    };

    document.addEventListener('visibilitychange', handleFocus);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleFocus);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user?.id, refetchActiveSession]);`;

  lines.splice(uStart, endIdx - uStart + 1, newBlock);
  fs.writeFileSync('src/context/StudyContext.tsx', lines.join('\n'));
} else {
  console.log("Could not find block boundaries", actualStart, endIdx);
}
