const fs = require('fs');
const path = './src/components/common/Navbar.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /      user\?\.user_metadata\?\.full_name \|\|[\s\S]*?\(user as any\)\?\.user_metadata\?\.name \|\|[\s\S]*?\(user as any\)\?\.user_metadata\?\.display_name \|\|[\s\S]*?user\?\.displayName \|\|/;
const replacement = `      user?.displayName ||
      user?.user_metadata?.full_name ||
      (user as any)?.user_metadata?.name ||
      (user as any)?.user_metadata?.display_name ||`;

content = content.replace(regex, replacement);
fs.writeFileSync(path, content, 'utf8');
console.log('Replaced?', content.includes('user?.displayName ||\n      user?.user_metadata?.full_name'));
