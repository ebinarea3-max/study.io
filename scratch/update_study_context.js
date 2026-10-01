const fs = require('fs');
const path = './src/context/StudyContext.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Empty syncPendingSessions
content = content.replace(
  /const syncPendingSessions = useCallback\(async \(\) => \{[\s\S]*?\}, \[\]\);/,
  `const syncPendingSessions = useCallback(async () => {
    return;
  }, []);`
);

// 2. Remove cacheLocallyFallback in persistStudySession
content = content.replace(
  /const cacheLocallyFallback = \(\) => \{[\s\S]*?\}\s*catch \{\}\s*\};/,
  `const cacheLocallyFallback = () => {};`
);

// 3. In persistCompletedSession, return false on failure
content = content.replace(
  /if \(supabase && activeUser\?\.id\) \{\s*try \{\s*const \{ data, error \} = await supabase\.from\('study_sessions'\)\.insert\(\[sessionPayload\]\)\.select\(\);\s*if \(error\) \{\s*console\.error\("Supabase session insert error:", error\);\s*\} else \{\s*insertedRecordId = data\?\.\[0\]\?\.id \|\| null;\s*\}\s*\} catch \(err\) \{\s*console\.error\('StudyContext: Exception inserting session:', err\);\s*\}\s*\}/,
  `if (activeUser?.id) {
      if (!supabase) return false;
      try {
        const { data, error } = await supabase.from('study_sessions').insert([sessionPayload]).select();
        if (error) {
          console.error("Supabase session insert error:", error);
          return false;
        } else {
          insertedRecordId = data?.[0]?.id || null;
        }
      } catch (err) {
        console.error('StudyContext: Exception inserting session:', err);
        return false;
      }
    }`
);

fs.writeFileSync(path, content, 'utf8');
console.log('StudyContext updated successfully.');
