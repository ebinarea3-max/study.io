const fs = require('fs');
const path = 'src/components/timer/FocusModeModal.tsx';
let content = fs.readFileSync(path, 'utf8');

// The new options array: Pink Noise, Brown Noise, White Noise, Rain, Waves, Fireplace, Lofi Cafe
content = content.replace(
  /\[[\s\S]*?\]\.map\(option =>/m,
  `[
                    { id: 'none', label: 'Silent', icon: <span className="w-3.5 h-3.5 rounded-full bg-neutral-300 mx-0.5" /> },
                    { id: 'pinknoise', label: 'Pink Noise', icon: <Radio className="w-4 h-4" /> },
                    { id: 'brownnoise', label: 'Brown Noise', icon: <Headphones className="w-4 h-4" /> },
                    { id: 'whitenoise', label: 'White Noise', icon: <Radio className="w-4 h-4" /> },
                    { id: 'rain', label: 'Rain', icon: <CloudRain className="w-4 h-4" /> },
                    { id: 'waves', label: 'Waves', icon: <Waves className="w-4 h-4" /> },
                    { id: 'campfire', label: 'Fireplace', icon: <Flame className="w-4 h-4" /> },
                    { id: 'lofi', label: 'Lofi Cafe', icon: <Sparkles className="w-4 h-4" /> }
                  ].map(option =>`
);

content = content.replace(
  /ambientSound === 'whitenoise' \? 'White Noise' :[\s\S]*?ambientSound === 'waves' \? 'Waves' : 'Silent'/,
  `ambientSound === 'pinknoise' ? 'Pink Noise' :
                ambientSound === 'brownnoise' ? 'Brown Noise' :
                ambientSound === 'whitenoise' ? 'White Noise' :
                ambientSound === 'rain' ? 'Rain' :
                ambientSound === 'waves' ? 'Waves' :
                ambientSound === 'campfire' ? 'Fireplace' :
                ambientSound === 'lofi' ? 'Lofi Cafe' : 'Silent'`
);

fs.writeFileSync(path, content, 'utf8');
console.log('FocusModeModal.tsx updated');
