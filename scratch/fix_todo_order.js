const fs = require('fs');

// 1. DailyTodoList.tsx
let dailyTodo = fs.readFileSync('src/components/todo/DailyTodoList.tsx', 'utf8');
dailyTodo = dailyTodo.replace('const updated = [optimisticItem, ...prev];', 'const updated = [...prev, optimisticItem];');
dailyTodo = dailyTodo.replace(
  /\.order\('created_at', \{ ascending: false \}\);/g,
  ".order('created_at', { ascending: true });"
);
dailyTodo = dailyTodo.replace(
  'const merged = [\n              ...pendingLocal,\n              ...remoteTodos.filter(r => !pendingLocal.some(p => p.task === r.task || p.id === r.id)),\n            ];',
  'const merged = [\n              ...remoteTodos.filter(r => !pendingLocal.some(p => p.task === r.task || p.id === r.id)),\n              ...pendingLocal,\n            ];'
);
fs.writeFileSync('src/components/todo/DailyTodoList.tsx', dailyTodo);

// 2. StudyContext.tsx
let studyCtx = fs.readFileSync('src/context/StudyContext.tsx', 'utf8');
studyCtx = studyCtx.replace('const updated = [item, ...prev];', 'const updated = [...prev, item];');
studyCtx = studyCtx.replace(
  /\.from\('todos'\)[\s\S]*?\.order\('created_at', \{ ascending: false \}\);/g,
  (match) => match.replace('ascending: false', 'ascending: true')
);
fs.writeFileSync('src/context/StudyContext.tsx', studyCtx);
console.log('Done!');
