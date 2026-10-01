const fs = require('fs');
const path = './src/context/AuthContext.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove localSessionSeconds logic
content = content.replace(
  /\/\/ Also check local storage sessions in case offline[\s\S]*?const totalStudySeconds = Math\.max\(dbSessionSeconds, localSessionSeconds\);/,
  `const totalStudySeconds = dbSessionSeconds;`
);

// 2. Clear cache on INITIAL_SESSION / SIGNED_IN
const cacheWipeCode = `
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        try {
          localStorage.removeItem('studypulse_sessions');
          localStorage.removeItem('studypulse_cached_profile');
          localStorage.removeItem('studypulse_todos');
          localStorage.removeItem('studypulse_active_sessions');
          if (session?.user) {
            localStorage.removeItem(\`study_io_sessions_\${session.user.id}\`);
            localStorage.removeItem(\`study_io_todos_\${session.user.id}\`);
          }
        } catch {}
      }
`;

content = content.replace(
  /const { data: { subscription } } = supabase\.auth\.onAuthStateChange\(async \(event, session\) => {[\s\S]*?if \(!isSubscribed\) return;/,
  `const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isSubscribed) return;${cacheWipeCode}`
);

fs.writeFileSync(path, content, 'utf8');
console.log('AuthContext updated successfully.');
