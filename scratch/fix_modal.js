const fs = require('fs');
const path = 'src/components/timer/FocusModeModal.tsx';
let content = fs.readFileSync(path, 'utf8');

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

content = content.replace(
  /\[\s*\{\s*id:\s*'none',[\s\S]*?\}\s*\]\.map/,
  `[
                    { id: 'none', label: 'Silent', icon: <span className="w-3.5 h-3.5 rounded-full bg-neutral-300 mx-0.5" /> },
                    { id: 'pinknoise', label: 'Pink Noise', icon: <Radio className="w-4 h-4" /> },
                    { id: 'brownnoise', label: 'Brown Noise', icon: <Headphones className="w-4 h-4" /> },
                    { id: 'whitenoise', label: 'White Noise', icon: <Radio className="w-4 h-4" /> },
                    { id: 'rain', label: 'Rain', icon: <CloudRain className="w-4 h-4" /> },
                    { id: 'waves', label: 'Waves', icon: <Waves className="w-4 h-4" /> },
                    { id: 'campfire', label: 'Fireplace', icon: <Flame className="w-4 h-4" /> },
                    { id: 'lofi', label: 'Lofi Cafe', icon: <Sparkles className="w-4 h-4" /> }
                  ].map`
);

content = content.replace(
  /<div className="text-\[10px\] font-bold text-slate-400 uppercase tracking-widest mb-1\.5 ml-1 font-hud">Atmosphere<\/div>\r?\n\s*<div className="text-\[10px\] font-bold text-slate-400 uppercase tracking-widest mb-1\.5 ml-1 font-hud">Atmosphere<\/div>/,
  '<div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1 font-hud">Atmosphere</div>'
);

fs.writeFileSync(path, content, 'utf8');
