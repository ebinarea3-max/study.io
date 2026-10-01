const fs = require('fs');

let content = fs.readFileSync('src/components/timer/StudyTimer.tsx', 'utf8');

content = content.replace(
  'className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 w-full justify-start sm:justify-center mb-6 max-w-full"',
  'className="flex items-center gap-2 flex-wrap py-2 w-full justify-center mb-6 max-w-full"'
);

fs.writeFileSync('src/components/timer/StudyTimer.tsx', content);
