const fs = require('fs');
const path = 'src/components/timer/StudyTimer.tsx';
let content = fs.readFileSync(path, 'utf8');

// Darken the inner dial
content = content.replace(
  "backgroundColor: 'rgba(10, 15, 25, 0.65)'",
  "backgroundColor: '#05070a'"
);
content = content.replace(
  "border: \"1px solid rgba(255, 255, 255, 0.08)\"",
  "border: \"1px solid rgba(255, 255, 255, 0.03)\""
);
content = content.replace(
  "boxShadow: \"0 8px 32px rgba(0, 0, 0, 0.5), inset 0 2px 15px rgba(255, 255, 255, 0.05)\"",
  "boxShadow: \"0 8px 32px rgba(0, 0, 0, 0.8), inset 0 1px 4px rgba(255, 255, 255, 0.02)\""
);

// Darken button
content = content.replace(
  "style={{ background: theme.gradient, color: \"#000000\", fontWeight: 900, border: \"none\", boxShadow: `0 12px 40px ${theme.glow}70, inset 0 2px 6px rgba(255,255,255,0.4)` }}",
  "style={{ backgroundColor: \"#05070a\", color: \"var(--accent)\", fontWeight: 900, border: \"1px solid var(--accent)\", boxShadow: `0 8px 32px rgba(0,0,0,0.8), inset 0 2px 10px ${theme.glow}15` }}"
);

// Reduce halo opacity
content = content.replace(
  "opacity-[0.12] group-hover:opacity-[0.25]",
  "opacity-[0.05] group-hover:opacity-[0.1]"
);
content = content.replace(
  "opacity-[0.15] group-hover:opacity-[0.3]",
  "opacity-[0.08] group-hover:opacity-[0.15]"
);

fs.writeFileSync(path, content);
console.log('Applied dark mode!');
