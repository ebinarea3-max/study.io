const fs = require('fs');

const timerPath = './src/components/timer/StudyTimer.tsx';
let timer = fs.readFileSync(timerPath, 'utf8');

// Ensure the dial doesn't shrink to 0
timer = timer.replace(
  /className=\{`relative flex items-center justify-center p-1 sm:p-2 w-52 h-52 sm:w-64 sm:h-64 md:w-80 md:h-80 mx-auto aspect-square transition-all duration-300 rounded-full/g,
  'className={`relative flex-shrink-0 flex items-center justify-center p-1 sm:p-2 w-52 h-52 sm:w-64 sm:h-64 md:w-80 md:h-80 mx-auto aspect-square transition-all duration-300 rounded-full'
);

// Ensure the wrapper uses flex-1 to fill the SwipeTabContainer correctly
timer = timer.replace(
  /className="w-full max-w-6xl mx-auto max-md:h-full flex flex-col/g,
  'className="w-full max-w-6xl mx-auto flex-1 flex flex-col'
);

fs.writeFileSync(timerPath, timer, 'utf8');

const swipeContainerPath = './src/components/common/SwipeTabContainer.tsx';
let swipe = fs.readFileSync(swipeContainerPath, 'utf8');

// Give the tab container `h-full` so its children can use flex-1 or h-full properly
swipe = swipe.replace(
  /className="w-1\/4 flex-shrink-0 flex flex-col transition-opacity duration-300"/g,
  'className="w-1/4 flex-shrink-0 flex flex-col transition-opacity duration-300 h-full"'
);

fs.writeFileSync(swipeContainerPath, swipe, 'utf8');

console.log('Fixed Mobile Timer Disappearance');
