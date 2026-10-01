const fs = require('fs');
let content = fs.readFileSync('src/components/timer/StudyTimer.tsx', 'utf8');

content = content.replace("Target } from 'lucide-react';", "Target, Settings } from 'lucide-react';");
content = content.replace(
  'placeholder="Custom ⚙"',
  'placeholder="Custom"'
);
content = content.replace(
  '<input\n                      type="text"\n                      placeholder="Custom"',
  '<Settings className="w-3.5 h-3.5 text-neutral-500" />\n                    <input\n                      type="text"\n                      placeholder="Custom"'
);

fs.writeFileSync('src/components/timer/StudyTimer.tsx', content);
