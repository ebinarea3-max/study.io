const fs = require('fs');
let content = fs.readFileSync('src/context/StudyContext.tsx', 'utf8');

const regex1 = /missingSubjects\.forEach\([^]+\?:\s*catch\s*\([^)]*\)\s*\{[^}]*\}\s*\}\);/g;
const regex2 = /localCached\.forEach\([^]+\?:\s*catch\s*\([^)]*\)\s*\{[^}]*\}\s*\}\);/g;

// Instead of complex regex, let's just find the start and end indices of the loops manually.
const lines = content.split('\n');

function replaceLoop(startText, searchName) {
    let startIdx = lines.findIndex(l => l.includes(startText));
    if (startIdx === -1) return false;
    
    let endIdx = startIdx;
    let openBrackets = 0;
    let foundFirst = false;
    for (let i = startIdx; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('{')) {
            openBrackets += (line.match(/\{/g) || []).length;
            foundFirst = true;
        }
        if (line.includes('}')) {
            openBrackets -= (line.match(/\}/g) || []).length;
        }
        if (foundFirst && openBrackets === 0 && line.includes('});')) {
            endIdx = i;
            break;
        }
    }
    
    if (endIdx > startIdx) {
        const newBlock = `            ${searchName}.forEach(async (cachedSub) => {
              try {
                if (!cachedSub.name) return;
                const sanitized = {
                  user_id: uid,
                  name: cachedSub.name.trim(),
                  color: cachedSub.color || '#06b6d4'
                };
                if (cachedSub.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cachedSub.id)) {
                  sanitized.id = cachedSub.id;
                }
                const { error } = await supabase.from('subjects').insert(sanitized);
                if (error) console.error('Subject sync error:', error);
              } catch (e) { console.error('Subject sync exception:', e); }
            });`;
        lines.splice(startIdx, endIdx - startIdx + 1, newBlock);
        return true;
    }
    return false;
}

const r1 = replaceLoop('missingSubjects.forEach(async (cachedSub) => {', 'missingSubjects');
const r2 = replaceLoop('localCached.forEach(async (cachedSub) => {', 'localCached');

fs.writeFileSync('src/context/StudyContext.tsx', lines.join('\n'));
console.log('Replaced 1:', r1, 'Replaced 2:', r2);
