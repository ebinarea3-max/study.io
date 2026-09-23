const fs = require('fs');

// 1. UPDATE src/app/page.tsx
const pagePath = './src/app/page.tsx';
let page = fs.readFileSync(pagePath, 'utf8');

// Update root div
page = page.replace(
  /<div className="h-\[100dvh\] overflow-hidden/g,
  '<div className="max-md:h-[100dvh] max-md:overflow-hidden md:min-h-screen w-full md:overflow-y-auto'
);

// Update main wrapper base classes
page = page.replace(
  /className=\{`flex-1 max-w-7xl w-full mx-auto relative z-10 flex flex-col overflow-hidden \$\{/g,
  'className={`flex-1 max-w-7xl w-full mx-auto relative z-10 flex flex-col max-md:overflow-hidden md:overflow-visible ${'
);

// Update main wrapper active tab classes
page = page.replace(
  /\? 'p-0 md:px-6 md:py-4 pb-0 md:pb-4 overflow-hidden'/g,
  "? 'p-0 md:px-6 md:py-4 pb-0 md:pb-4 max-md:overflow-hidden md:overflow-visible'"
);

fs.writeFileSync(pagePath, page, 'utf8');

// 2. UPDATE src/app/layout.tsx
const layoutPath = './src/app/layout.tsx';
let layout = fs.readFileSync(layoutPath, 'utf8');
// If html has h-full, remove it, since h-full + min-h-screen can be weird
layout = layout.replace(/dark h-full antialiased/g, 'dark antialiased');
fs.writeFileSync(layoutPath, layout, 'utf8');


console.log('Restored desktop scrolling');
