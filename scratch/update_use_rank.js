const fs = require('fs');

const file = './src/hooks/useRankTheme.ts';
let content = fs.readFileSync(file, 'utf8');

// Update btnBg and btnShadow logic
const oldLogic = `    // Dynamic Elite Tier Start Session Button Overrides
    let btnBg = theme.accent;
    let btnShadow = \`0 0 20px \${theme.glow}\`;
    
    if (theme.tier === 'Master') {
      btnBg = theme.gradient || theme.accent;
      // Electric purple inset rim highlight
      btnShadow = \`inset 0 0 0 1px rgba(129, 140, 248, 0.5), 0 0 24px \${theme.glow}\`;
    } else if (theme.tier === 'Grandmaster') {
      btnBg = theme.gradient || theme.accent;
      btnShadow = \`0 0 24px rgba(255, 46, 99, 0.45)\`;
    }`;

const newLogic = `    // Elite Tier Luxury Button Overrides (Milled Glass / Premium)
    let btnBg = theme.accent;
    let btnShadow = \`0 4px 20px \${theme.glow}\`;
    
    if (theme.tier === 'Master') {
      btnBg = 'rgba(255, 255, 255, 0.03)';
      btnShadow = \`inset 0 0 0 1px rgba(99, 102, 241, 0.6), 0 4px 20px rgba(99, 102, 241, 0.15)\`;
    } else if (theme.tier === 'Grandmaster') {
      btnBg = 'linear-gradient(135deg, rgba(225, 29, 72, 0.15) 0%, rgba(212, 175, 55, 0.08) 100%)';
      btnShadow = \`inset 0 0 0 1px rgba(225, 29, 72, 0.4), 0 4px 24px rgba(225, 29, 72, 0.2)\`;
    } else {
      // Tame the neon effects for all other tiers
      btnBg = 'rgba(255, 255, 255, 0.05)';
      btnShadow = \`inset 0 0 0 1px \${theme.border}, 0 4px 16px rgba(0,0,0,0.4)\`;
    }`;

content = content.replace(oldLogic, newLogic);
content = content.replace(/root\.style\.setProperty\('--gradient', theme\.gradient \|\| theme\.accent\);/g, "root.style.setProperty('--card-highlight', theme.gradient || 'none');\n    root.style.setProperty('--card-texture', theme.cardTexture || 'none');");

fs.writeFileSync(file, content, 'utf8');
console.log('Updated useRankTheme.ts');
