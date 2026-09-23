const fs = require('fs');
const studyTimerPath = './src/components/timer/StudyTimer.tsx';
let timer = fs.readFileSync(studyTimerPath, 'utf8');

timer = timer.replace(/SkipForward,/, 'Zap,\n  SkipForward,');
fs.writeFileSync(studyTimerPath, timer, 'utf8');
console.log('Added Zap');
