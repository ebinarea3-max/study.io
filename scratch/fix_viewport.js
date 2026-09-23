const fs = require('fs');

const pagePath = './src/app/page.tsx';
let page = fs.readFileSync(pagePath, 'utf8');

// Update root div
page = page.replace(
  /<div className="h-\[100dvh\] md:h-auto md:min-h-screen overflow-hidden md:overflow-x-hidden md:overflow-y-auto/g,
  '<div className="h-[100dvh] overflow-hidden'
);

// Update main
page = page.replace(
  /className=\{`flex-1 max-w-7xl w-full mx-auto relative z-10 flex flex-col md:block overflow-hidden md:overflow-visible \$\{/g,
  'className={`flex-1 max-w-7xl w-full mx-auto relative z-10 flex flex-col overflow-hidden ${'
);

// Update padding
page = page.replace(
  /\? 'p-0 md:px-6 md:py-8 pb-0 md:pb-12 overflow-hidden'/g,
  "? 'p-0 md:px-6 md:py-4 pb-0 md:pb-4 overflow-hidden'"
);

fs.writeFileSync(pagePath, page, 'utf8');

// Also check StudyTimer height constraints
const timerPath = './src/components/timer/StudyTimer.tsx';
let timer = fs.readFileSync(timerPath, 'utf8');
// For lg:col-span-8 column container, make sure it is flex-1 and overflow hidden to fit within screen
timer = timer.replace(
  /className="lg:col-span-8 flex-1 md:flex-initial flex flex-col justify-between md:justify-start overflow-hidden md:overflow-visible space-y-0 md:space-y-3"/g,
  'className="lg:col-span-8 flex-1 flex flex-col justify-between md:justify-start overflow-hidden space-y-0 md:space-y-3"'
);

// Right Secondary Column
timer = timer.replace(
  /className="hidden lg:block lg:col-span-4 space-y-6"/g,
  'className="hidden lg:block lg:col-span-4 space-y-4 overflow-y-auto pr-2"'
);

fs.writeFileSync(timerPath, timer, 'utf8');

console.log('Fixed viewport containment');
