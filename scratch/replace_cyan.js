const fs = require('fs');

const file = './src/components/timer/StudyTimer.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace standard theme properties with CSS variables
content = content.replace(/theme\.accent/g, "'var(--accent)'");
content = content.replace(/theme\.glow/g, "'var(--glow)'");
content = content.replace(/theme\.textAccent/g, "'var(--accent)'");

// START SESSION buttons and RESUME buttons have specific inline styles
content = content.replace(/backgroundColor: 'var\(--accent\)',\s*\n\s*}}/g, "backgroundColor: 'var(--accent)', boxShadow: '0 0 20px var(--glow)'\n                  }}");

// Resume button
content = content.replace(/style={{ background: theme\.gradient, boxShadow: `0 0 16px \${'var\(--glow\)'}` }}/g, "style={{ backgroundColor: 'var(--accent)', boxShadow: '0 0 20px var(--glow)' }}");

// TODAY / YESTERDAY toggles (which use theme.gradient originally)
content = content.replace(/style={overviewView === 'today' \? { background: theme\.gradient } : undefined}/g, "style={overviewView === 'today' ? { backgroundColor: 'var(--accent)' } : undefined}");
content = content.replace(/style={overviewView === 'yesterday' \? { background: theme\.gradient } : undefined}/g, "style={overviewView === 'yesterday' ? { backgroundColor: 'var(--accent)' } : undefined}");

// Let's also catch any remaining theme.gradient just in case
content = content.replace(/background: theme\.gradient/g, "backgroundColor: 'var(--accent)'");

fs.writeFileSync(file, content, 'utf8');
console.log('Updated StudyTimer.tsx');
