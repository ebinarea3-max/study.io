const fs = require('fs');

let content = fs.readFileSync('src/context/StudyContext.tsx', 'utf8');

content = content.replace(/const sanitized = \{/g, 'const sanitized: Record<string, any> = {');

fs.writeFileSync('src/context/StudyContext.tsx', content);
