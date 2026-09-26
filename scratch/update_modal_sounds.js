const fs = require('fs');
const path = 'src/components/timer/FocusModeModal.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /ambientSound === 'rain' \? 'Rain' :[\s\S]*?ambientSound === 'campfire' \? 'Fireplace' :/,
  "ambientSound === 'rain' ? 'Rain' :\n                ambientSound === 'campfire' ? 'Fireplace' :"
);

content = content.replace(
  /\{ id: 'waves', label: 'Waves', icon: <Waves className="w-4 h-4" \/> \},/,
  ''
);

content = content.replace(
  /\{ id: 'lofi', label: 'Lofi Cafe', icon: <Sparkles className="w-4 h-4" \/> \}/,
  ''
);

// We need to fix the trailing commas or map function
content = content.replace(
  /,\s*\]\.map/,
  '].map'
);

// Clean up unused icons
content = content.replace(
  /Waves,\s*Sparkles,/,
  ''
);

fs.writeFileSync(path, content, 'utf8');
console.log('FocusModeModal.tsx updated');
