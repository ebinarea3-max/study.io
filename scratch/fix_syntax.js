const fs = require('fs');

const file = './src/components/timer/StudyTimer.tsx';
let content = fs.readFileSync(file, 'utf8');

// Fix border colors with opacities attached incorrectly
content = content.replace(/`\$\{'var\(--accent\)'\}35`/g, "'var(--border)'");
content = content.replace(/`\$\{'var\(--accent\)'\}50`/g, "'var(--border)'");
content = content.replace(/`\$\{'var\(--accent\)'\}30`/g, "'var(--border)'");

// Fix Hover invalid TS syntax
content = content.replace(/'var\(--accent\)'Hover/g, "'var(--accent)'");

// Fix template literals with just variables
content = content.replace(/`([^`]*)\$\{'var\(--glow\)'\}([^`]*)`/g, "'$1var(--glow)$2'");
content = content.replace(/`([^`]*)\$\{'var\(--accent\)'\}([^`]*)`/g, "'$1var(--accent)$2'");

// Clean up remaining conic gradient syntax
content = content.replace(/conic-gradient\(from 0deg, transparent 0deg, transparent 270deg, \$\{'var\(--glow\)'\} 330deg, \$\{'var\(--accent\)'\} 360deg\)/g, "conic-gradient(from 0deg, transparent 0deg, transparent 270deg, var(--glow) 330deg, var(--accent) 360deg)");

// Run it a second time for multiple template literal variables in the same string
content = content.replace(/`([^`]*)\$\{'var\(--glow\)'\}([^`]*)`/g, "'$1var(--glow)$2'");
content = content.replace(/`([^`]*)\$\{'var\(--accent\)'\}([^`]*)`/g, "'$1var(--accent)$2'");

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed invalid syntax in StudyTimer.tsx');
