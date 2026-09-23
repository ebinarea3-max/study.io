const fs = require('fs');

// globals.css
const globalsPath = './src/app/globals.css';
let globals = fs.readFileSync(globalsPath, 'utf8');

globals = globals.replace(/--accent: #00F2FE;/g, '--accent: #FFFFFF;');
globals = globals.replace(/--primary: #00F2FE;/g, '--primary: #FFFFFF;');
globals = globals.replace(/--accent-glow: rgba\(0, 242, 254, 0\.3\);/g, '--accent-glow: rgba(255, 255, 255, 0.3);');

fs.writeFileSync(globalsPath, globals, 'utf8');
console.log('Purged globals.css cyan');
