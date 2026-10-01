const fs = require('fs');
let content = fs.readFileSync('src/context/StudyContext.tsx', 'utf8');

const newDismiss = `  const dismissSeasonRecap = useCallback(() => {
    if (seasonRecap?.newSeasonId) {
      try {
        const safeKey = seasonRecap.newSeasonId.replace('-', '_');
        localStorage.setItem(\`season_settlement_acknowledged_\${safeKey}\`, 'true');
        if (user?.id && !user.id.startsWith('user-scholar')) {
          updateProfile({ last_acknowledged_season: seasonRecap.newSeasonId });
        }
      } catch {}
    }
    setSeasonRecap(null);
    try {
      localStorage.removeItem('studypulse_season_recap');
    } catch {}
  }, [seasonRecap, user?.id, updateProfile]);`;

content = content.replace(/  const dismissSeasonRecap = useCallback\(\(\) => \{\r?\n    setSeasonRecap\(null\);\r?\n    try \{\r?\n      localStorage\.removeItem\('studypulse_season_recap'\);\r?\n    \} catch \{\}\r?\n  \}, \[\]\);/g, newDismiss);

fs.writeFileSync('src/context/StudyContext.tsx', content);
