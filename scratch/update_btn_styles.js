const fs = require('fs');
const file = './src/components/timer/StudyTimer.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace START SESSION button inline styles
// Currently: style={{ backgroundColor: 'var(--accent)', boxShadow: '0 0 20px var(--glow)' }}
content = content.replace(/style=\{\{\s*backgroundColor:\s*'var\(--accent\)',\s*boxShadow:\s*'0 0 20px var\(--glow\)'\s*\}\}/g, "style={{ background: 'var(--btn-bg)', boxShadow: 'var(--btn-shadow)' }}");
content = content.replace(/backgroundColor:\s*'var\(--accent\)',\s*boxShadow:\s*'0 0 20px var\(--glow\)'/g, "background: 'var(--btn-bg)', boxShadow: 'var(--btn-shadow)'");

// Also the RESUME button has:
// style={{ backgroundColor: 'var(--accent)', boxShadow: '0 0 20px var(--glow)' }}
// which will be caught by the above regex!

fs.writeFileSync(file, content, 'utf8');
console.log('Updated StudyTimer.tsx with btn-bg/btn-shadow');
