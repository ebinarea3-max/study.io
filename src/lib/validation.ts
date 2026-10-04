const PROFANITY_LIST = [
  'fuck', 'shit', 'bitch', 'cunt', 'dick', 'cock', 'pussy', 'whore',
  'slut', 'fag', 'nigger', 'nigga', 'porn', 'sex', 'rape', 'incest',
  'pedophile', 'pedo', 'nude', 'naked', 'cum', 'semen', 'masturbat',
  'tit', 'boob', 'vagina', 'penis', 'anal', 'asshole', 'blowjob',
  'handjob', 'orgasm', 'slut', 'hooker', 'escort', 'camgirl', 'onlyfans'
];

export function isAppropriateHandle(handle: string): boolean {
  if (!handle) return true;
  
  // Normalize leetspeak
  const normalized = handle.toLowerCase()
    .replace(/[0@]/g, 'o')
    .replace(/[1!]/g, 'i')
    .replace(/[3]/g, 'e')
    .replace(/[4]/g, 'a')
    .replace(/[5\$]/g, 's')
    .replace(/[7]/g, 't')
    .replace(/[8]/g, 'b');

  for (const word of PROFANITY_LIST) {
    if (normalized.includes(word)) {
      return false;
    }
  }

  return true;
}

export function isValidHandleFormat(handle: string): boolean {
  // Length check
  if (handle.length < 3 || handle.length > 24) return false;
  
  // Character allowlist check
  if (!/^[a-z0-9_-]+$/.test(handle)) return false;
  
  // No consecutive special characters
  if (/[-_]{2,}/.test(handle)) return false;
  
  // No leading or trailing special characters
  if (handle.startsWith('-') || handle.startsWith('_') || handle.endsWith('-') || handle.endsWith('_')) return false;

  return true;
}

export function sanitizeHandleInput(input: string): string {
  // Strip invalid chars, convert to lowercase
  let sanitized = input.toLowerCase().replace(/[^a-z0-9_-]/g, '');
  
  // Optional: Auto-collapse consecutive hyphens/underscores if you want real-time cleanup, 
  // but it might be better to just let the validation block it so the user can see what's wrong.
  // We will just strip characters outside the allowed set for typing convenience.
  return sanitized;
}
