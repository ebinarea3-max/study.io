const fs = require('fs');

let lines = fs.readFileSync('src/context/AuthContext.tsx', 'utf8').split('\n');

const startIdx = 168; // line 169 is index 168
const endIdx = 202;   // line 202 is index 201, exclusive end is 202

const newBlock = `  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !user?.id || user.id.startsWith('user-scholar') || user.id.startsWith('guest')) return;

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (data && !error) {
          setUser(prev => {
            const updated = {
              ...prev,
              displayName: data.name || prev.displayName,
              avatarUrl: data.avatar_url || prev.avatarUrl,
              dailyGoalHours: data.daily_goal_hours ?? prev.dailyGoalHours,
              streakDays: data.streak_days ?? prev.streakDays,
              level: data.level ?? prev.level,
              rp: data.rp ?? prev.rp,
              seasonRp: data.season_rp ?? data.rp ?? prev.seasonRp,
              totalStudySeconds: data.total_study_seconds ?? prev.totalStudySeconds,
              levelTitle: data.rank_title || data.level_title || prev.levelTitle,
              user_metadata: {
                ...(prev.user_metadata || {}),
                level: data.level ?? prev.level,
                levelTitle: data.rank_title || data.level_title || prev.levelTitle
              }
            };
            try { localStorage.setItem('studypulse_active_user', JSON.stringify(updated)); } catch {}
            return updated;
          });
        }
      } catch (err) {
        // Silent catch for polling
      }
    };

    // Initial fetch
    fetchProfile();

    // Background interval
    const interval = setInterval(() => {
      fetchProfile();
    }, 30000);

    // Window focus refresh
    const handleFocus = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        fetchProfile();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [user?.id]);`;

lines.splice(startIdx, endIdx - startIdx, newBlock);

fs.writeFileSync('src/context/AuthContext.tsx', lines.join('\n'));
