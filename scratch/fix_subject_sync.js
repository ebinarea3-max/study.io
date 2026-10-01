const fs = require('fs');

let content = fs.readFileSync('src/context/StudyContext.tsx', 'utf8');

// Replace in sync section
const syncTarget = `            // Sync local cached subjects to Supabase
            localCached.forEach(async (cachedSub) => {
              try {
                if (!cachedSub.name) return;
                await supabase.from('subjects').insert({
                  user_id: uid,
                  name: cachedSub.name,
                  color: cachedSub.color || '#10B981',
                  daily_goal_minutes: cachedSub.daily_goal_minutes || 60,
                  is_archived: Boolean(cachedSub.is_archived),
                });
              } catch (e) {
                console.warn("Error syncing cached subject to Supabase:", e);
              }
            });`;

const syncReplacement = `            // Sync local cached subjects to Supabase
            localCached.forEach(async (cachedSub) => {
              try {
                if (!cachedSub.name) return;
                
                const sanitizedSubject = {
                  user_id: uid,
                  name: cachedSub.name.trim(),
                  color: cachedSub.color || '#06b6d4'
                };
                
                // Only pass ID if it is a valid UUID
                const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cachedSub.id);
                if (isUuid) {
                  sanitizedSubject.id = cachedSub.id;
                }
                
                const { error: syncError } = await supabase.from('subjects').insert(sanitizedSubject);
                if (syncError) {
                  console.error("Subject sync failed:", syncError.message, syncError.details);
                }
              } catch (e) {
                console.error("Subject sync failed:", e.message, e.details);
              }
            });`;

content = content.replace(syncTarget, syncReplacement);

// Replace in addSubject section
const addTarget = `            supabase
              .from('subjects')
              .insert({
                user_id: activeUserId,
                name: trimmedName,
                color: newSub.color || '#10B981',
                daily_goal_minutes: targetDailyMins,
                is_archived: false,
              })
              .select()
              .single()
              .then(({ data, error }) => {`;

const addReplacement = `            supabase
              .from('subjects')
              .insert({
                user_id: activeUserId,
                name: trimmedName,
                color: newSub.color || '#06b6d4'
              })
              .select()
              .single()
              .then(({ data, error }) => {`;

content = content.replace(addTarget, addReplacement);

fs.writeFileSync('src/context/StudyContext.tsx', content);
