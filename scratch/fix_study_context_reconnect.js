const fs = require('fs');

let content = fs.readFileSync('src/context/StudyContext.tsx', 'utf8');

const target = `        } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED' || status === 'TIMED_OUT') {
          isSubscribed = false;
          console.log(\`[Realtime Status: \${status}] Network/Firewall blocks WebSockets. Activating HTTP fallback polling...\`);
          startPolling();
        }`;

const replacement = `        } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED' || status === 'TIMED_OUT') {
          isSubscribed = false;
          console.log(\`[Realtime Status: \${status}] Network/Firewall blocks WebSockets. Activating HTTP fallback polling...\`);
          if (status !== 'CLOSED') {
            supabase.removeChannel(channel);
          }
          startPolling();
        }`;

content = content.replace(target, replacement);

fs.writeFileSync('src/context/StudyContext.tsx', content);
