const fs = require('fs');

const file = './src/lib/rankTheme.ts';
let content = fs.readFileSync(file, 'utf8');

// Replace all bg, base, surface, border in RANK_THEMES with the luxury obsidian palette
content = content.replace(/bg: '[^']+'/g, "bg: '#08090C'");
content = content.replace(/base: '[^']+'/g, "base: '#08090C'");
content = content.replace(/surface: '[^']+'/g, "surface: '#0F1117'");
content = content.replace(/border: '[^']+'/g, "border: 'rgba(255, 255, 255, 0.07)'");

// Master overrides
content = content.replace(/Master:\s*\{\s*tier:\s*'Master',[\s\S]*?textAccent:\s*'[^']+',\s*\}/g, `Master: {
    tier: 'Master',
    accent: '#6366F1',
    glow: 'rgba(99, 102, 241, 0.25)',
    bg: '#08090C',
    base: '#08090C',
    surface: '#0F1117',
    border: 'rgba(255, 255, 255, 0.07)',
    cardTexture: 'radial-gradient(circle at 50% 35%, rgba(99, 102, 241, 0.06), transparent 60%)',
    icon: 'Crown',
    accentRgb: '99, 102, 241',
    accentHover: '#818CF8',
    surfaceHigh: '#151722',
    gradient: 'linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.35), transparent)',
    badgeBg: 'rgba(99, 102, 241, 0.1)',
    textAccent: '#818CF8',
  }`);

// Grandmaster overrides
content = content.replace(/Grandmaster:\s*\{\s*tier:\s*'Grandmaster',[\s\S]*?textAccent:\s*'[^']+',\s*\}/g, `Grandmaster: {
    tier: 'Grandmaster',
    accent: '#E11D48',
    glow: 'rgba(225, 29, 72, 0.3)',
    bg: '#08090C',
    base: '#08090C',
    surface: '#0F1117',
    border: 'rgba(255, 255, 255, 0.07)',
    cardTexture: 'radial-gradient(circle at 50% 35%, rgba(225, 29, 72, 0.05), rgba(212, 175, 55, 0.03), transparent 65%)',
    icon: 'Award',
    accentRgb: '225, 29, 72',
    accentHover: '#BE123C',
    surfaceHigh: '#151722',
    gradient: 'linear-gradient(90deg, transparent, rgba(225, 29, 72, 0.4), rgba(212, 175, 55, 0.3), transparent)',
    badgeBg: 'rgba(225, 29, 72, 0.1)',
    textAccent: '#D4AF37',
  }`);

// Add cardHighlight to the interface
if (!content.includes('cardHighlight: string;')) {
  content = content.replace(/cardTexture: string;/g, "cardTexture: string;\n  cardHighlight?: string;");
}

fs.writeFileSync(file, content, 'utf8');
console.log('Updated rankTheme.ts');
