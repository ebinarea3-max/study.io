const fs = require('fs');
const path = 'src/lib/audio.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /export type AmbientSoundType = 'pinknoise' \| 'brownnoise' \| 'whitenoise' \| 'rain' \| 'waves' \| 'campfire' \| 'lofi';/,
  "export type AmbientSoundType = 'pinknoise' | 'brownnoise' | 'whitenoise' | 'rain' | 'campfire';"
);

content = content.replace(
  /'waves': 1\.0,\r?\n\s*'campfire': 0\.9,\r?\n\s*'lofi': 0\.7,/,
  "'campfire': 0.9,"
);

content = content.replace(
  /'waves': '\/audio\/ambience\/waves\.wav',\r?\n\s*'campfire': '\/audio\/ambience\/fireplace\.wav',\r?\n\s*'lofi': '\/audio\/ambience\/lofi-cafe\.wav',/,
  "'campfire': '/audio/ambience/fireplace.wav',"
);

fs.writeFileSync(path, content, 'utf8');
console.log('audio.ts updated');
