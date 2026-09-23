const fs = require('fs');

// 1. page.tsx
const pagePath = './src/app/page.tsx';
let page = fs.readFileSync(pagePath, 'utf8');

page = page.replace(
  /className=\{`max-w-7xl w-full mx-auto relative z-10 \$\{activeTab === 'timer' \? 'flex-1 overflow-hidden flex flex-col justify-between px-4 pb-20 pt-2 md:px-6 md:py-4 md:pb-4' : 'flex-1 overflow-y-auto overscroll-contain pb-24 px-4 pt-2 md:px-6 md:py-8'\}`\}/,
  "className={`max-w-7xl w-full mx-auto relative z-10 ${activeTab === 'timer' ? 'flex-1 max-md:overflow-hidden flex flex-col justify-between px-4 pb-20 pt-2 md:px-6 md:py-4 md:pb-4 md:overflow-visible' : 'flex-1 max-md:overflow-y-auto overscroll-contain pb-24 px-4 pt-2 md:px-6 md:py-8 md:overflow-visible'}`}"
);

fs.writeFileSync(pagePath, page, 'utf8');

// 2. StudyTimer.tsx
const timerPath = './src/components/timer/StudyTimer.tsx';
let timer = fs.readFileSync(timerPath, 'utf8');

timer = timer.replace(
  /className="w-full max-w-6xl mx-auto h-full flex flex-col md:grid md:grid-cols-1 lg:grid-cols-12 justify-between md:justify-start gap-4 lg:gap-6 overflow-hidden md:overflow-visible p-4 pb-24 md:p-0"/,
  'className="w-full max-w-6xl mx-auto max-md:h-full flex flex-col md:grid md:grid-cols-1 lg:grid-cols-12 justify-between md:justify-start gap-4 lg:gap-6 max-md:overflow-hidden md:overflow-visible p-4 pb-24 md:p-0"'
);

timer = timer.replace(
  /className="lg:col-span-8 flex-1 flex flex-col justify-between overflow-hidden space-y-0 md:space-y-3"/,
  'className="lg:col-span-8 flex-1 flex flex-col justify-between max-md:overflow-hidden md:overflow-visible space-y-0 md:space-y-3"'
);

timer = timer.replace(
  /className="hidden lg:block lg:col-span-4 space-y-4 pr-2"/,
  'className="hidden lg:block lg:col-span-4 space-y-4 pr-2 md:overflow-visible"'
);

// Wait, the right column previously was `overflow-y-auto pr-2`
// Let's replace the original if it exists
timer = timer.replace(
  /className="hidden lg:block lg:col-span-4 space-y-4 overflow-y-auto pr-2"/,
  'className="hidden lg:block lg:col-span-4 space-y-4 pr-2 md:overflow-visible"'
);


fs.writeFileSync(timerPath, timer, 'utf8');
console.log('Fixed Desktop Scroll');
