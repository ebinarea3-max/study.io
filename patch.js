const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(srcDir);

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (content.includes('.fullTitle')) {
    // Careful with newTier.fullTitle or rank.fullTitle
    content = content.replace(/\b(\w+)\.fullTitle\b/g, '$1.name.toUpperCase()');
    changed = true;
  }
  
  if (file.includes('Navbar.tsx')) {
    content = content.replace(/userRank\.rp/g, '(user?.seasonRp || 0)');
    content = content.replace(/userRank\.tier as RankTierName/g, 'userRank.tier');
    changed = true;
  }

  if (file.includes('SettingsTabContent.tsx')) {
    content = content.replace(/userRank\.rp/g, '(user?.seasonRp || 0)');
    changed = true;
  }

  // MonthlyLeaderboard
  if (file.includes('MonthlyLeaderboard.tsx')) {
    content = content.replace(/r\.name\.toUpperCase\(\)\s*===\s*rankTitle\.toUpperCase\(\)/g, "r.name.toUpperCase() === rankTitle.toUpperCase()");
    changed = true;
  }

  if (file.includes('RankSettlementModal.tsx')) {
    // maxRp -> we can import { getMaxRpForTier } from '../lib/ranks'
    if (content.includes('.maxRp')) {
      if (!content.includes('getMaxRpForTier')) {
         content = content.replace("import { getRankFromRp, RankTierName, RankTier } from '../lib/ranks';", "import { getRankFromRp, RankTierName, RankTier, getMaxRpForTier } from '../lib/ranks';");
      }
      content = content.replace(/\b(\w+)\.maxRp\b/g, 'getMaxRpForTier($1.name)');
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
}
