const fs = require('fs');
const todoPath = './src/components/todo/DailyTodoList.tsx';
let todo = fs.readFileSync(todoPath, 'utf8');

todo = todo.replace(
  /className="px-2\.5 py-0\.5 rounded font-hud-mono text-\[11px\] font-bold border shadow-sm text-\[\#F59E0B\] border-tier-muted bg-\[\#F59E0B\]-muted"/g,
  'className="px-2.5 py-0.5 rounded font-hud-mono text-[11px] font-bold border shadow-sm" style={{ backgroundColor: "rgba(245, 158, 11, 0.1)", color: "#FBBF24", borderColor: "rgba(245, 158, 11, 0.25)" }}'
);

fs.writeFileSync(todoPath, todo, 'utf8');
console.log('Fixed badge count style');
