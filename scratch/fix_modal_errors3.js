const fs = require('fs');
const path = 'src/components/timer/FocusModeModal.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /ambientSound === 'campfire' \? 'Fireplace' :\r?\n\s*ambientSound === 'lofi' \? 'Lofi Cafe' : 'Silent'/,
  "ambientSound === 'campfire' ? 'Fireplace' : 'Silent'"
);

fs.writeFileSync(path, content, 'utf8');
