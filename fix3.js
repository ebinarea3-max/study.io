const fs = require('fs');

let timerContent = fs.readFileSync('src/components/timer/StudyTimer.tsx', 'utf8');

if (!timerContent.includes('import { getDailyQuote }')) {
    timerContent = timerContent.replace(
        "import { getSupabase } from '../../lib/supabase';",
        "import { getSupabase } from '../../lib/supabase';\nimport { getDailyQuote } from '../../lib/quotes';"
    );
}

if (!timerContent.includes('const dailyQuote = getDailyQuote();')) {
    timerContent = timerContent.replace(
        "export function StudyTimer() {",
        "export function StudyTimer() {\n  const dailyQuote = getDailyQuote();"
    );
}

// Update the DAILY DIRECTIVE card text
const oldCardRegex = /<p className="text-\[14px\] font-semibold text-\[#E2E8F0\] leading-snug tracking-tight">[\s\S]*?<\/p>/;

const newCardText = `<div className="flex flex-col gap-1.5 mt-1">
              <p className="text-[13px] italic font-medium text-[#E2E8F0] leading-snug tracking-wide">
                &ldquo;{dailyQuote.text}&rdquo;
              </p>
              <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-widest text-right">
                — {dailyQuote.author}
              </p>
            </div>`;

timerContent = timerContent.replace(oldCardRegex, newCardText);

fs.writeFileSync('src/components/timer/StudyTimer.tsx', timerContent, 'utf8');
console.log('Updated StudyTimer.tsx with quotes');
