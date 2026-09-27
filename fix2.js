const fs = require('fs');
let content = fs.readFileSync('src/components/timer/StudyTimer.tsx', 'utf8');

content = content.replace(/<\/div>\\n\s*<\/div>\\n\s*<\/div>\\n\s*<\/div>\\n\s*\);\\n\}/, `      </div>
    </div>
  </div>
</div>
  );
}`);

fs.writeFileSync('src/components/timer/StudyTimer.tsx', content);
console.log("Fixed literal newlines");
