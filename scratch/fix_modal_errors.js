const fs = require('fs');
const path = 'src/components/timer/FocusModeModal.tsx';
let content = fs.readFileSync(path, 'utf8');

// Remove lofi and waves from the rendering switch case
content = content.replace(
  /ambientSound === 'lofi' \? 'Lofi Cafe' :\r?\n\s*/,
  ''
);

content = content.replace(
  /ambientSound === 'waves' \? 'Waves' :\r?\n\s*/,
  ''
);

// Restore Sparkles import
let importsMatch = content.match(/import \{([\s\S]*?)\} from 'lucide-react';/);
if (importsMatch) {
  let imports = importsMatch[1];
  if (!imports.includes('Sparkles')) {
    imports = imports + ',\n  Sparkles';
  }
  content = content.replace(importsMatch[0], `import {${imports}} from 'lucide-react';`);
}

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed modal errors');
