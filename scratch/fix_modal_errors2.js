const fs = require('fs');
const path = 'src/components/timer/FocusModeModal.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /,\r?\n\s*,\r?\n\s*Sparkles/g,
  ',\n  Sparkles'
);

content = content.replace(
  /Check,\r?\n\s*,\r?\n\s*Sparkles/,
  'Check,\n  Sparkles'
);

content = content.replace(
  /Check,\r?\n,\r?\n  Sparkles/,
  'Check,\n  Sparkles'
);

fs.writeFileSync(path, content, 'utf8');
