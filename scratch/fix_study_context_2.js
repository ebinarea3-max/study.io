const fs = require('fs');
let content = fs.readFileSync('src/context/StudyContext.tsx', 'utf8');

const newCheck = `// Monthly Ranked Season Check on app launch
  useEffect(() => {
    const currentMonth = getCurrentSeasonId();

    try {
      const savedRecap = localStorage.getItem('studypulse_season_recap');
      if (savedRecap) {
        const parsedRecap = JSON.parse(savedRecap);
        const safeKey = parsedRecap.newSeasonId ? parsedRecap.newSeasonId.replace('-', '_') : '';
        const isAcknowledged = localStorage.getItem(\`season_settlement_acknowledged_\${safeKey}\`) === 'true';
        if (!isAcknowledged && user?.last_acknowledged_season !== parsedRecap.newSeasonId) {
          setSeasonRecap(parsedRecap);
        } else {
          localStorage.removeItem('studypulse_season_recap');
        }
      }
    } catch {}

    if (user && user.id && !user.id.startsWith('user-scholar')) {
      if (user.currentSeasonId && user.currentSeasonId !== currentMonth) {
        const safeKey = currentMonth.replace('-', '_');
        const isAcknowledged = localStorage.getItem(\`season_settlement_acknowledged_\${safeKey}\`) === 'true';
        
        const prevSeason = user.currentSeasonId;
        const prevRP = user.seasonRp ?? user.rp ?? 0;
        const reset = calculateSeasonReset(prevRP);

        const recap: SeasonRecapData = {
          previousSeasonId: prevSeason,
          newSeasonId: currentMonth,
          previousRP: prevRP,
          previousTierTitle: reset.previousTier.fullTitle,
          newRP: reset.newRP,
          newTierTitle: reset.newTier.fullTitle,
        };

        updateProfile({
          currentSeasonId: currentMonth,
          seasonRp: reset.newRP,
        });

        if (!isAcknowledged && user.last_acknowledged_season !== currentMonth) {
          setSeasonRecap(recap);
          try {
            localStorage.setItem('studypulse_season_recap', JSON.stringify(recap));
          } catch {}
        }
      } else if (!user.currentSeasonId) {
        updateProfile({
          currentSeasonId: currentMonth,
          seasonRp: user.seasonRp ?? user.rp ?? 0,
        });
      }
    }
  }, [user?.id, user?.currentSeasonId, user?.seasonRp, user?.last_acknowledged_season, updateProfile]);`;

content = content.replace(/\/\/ Monthly Ranked Season Check on app launch[\s\S]*?\}, \[user\?\.id, user\?\.currentSeasonId, user\?\.seasonRp, updateProfile\]\);/, newCheck);

fs.writeFileSync('src/context/StudyContext.tsx', content);
