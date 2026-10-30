/**
 * Smart Task Parser for Study.io
 * 
 * Automatically parses real-world student lists (e.g., WhatsApp messages,
 * syllabi, lecture notes, textbook outlines) into clean, individual tasks.
 * 
 * Features:
 * 1. Filters messaging/chat metadata (timestamps, "Forwarded", etc.).
 * 2. Recognizes numbered lists with or without spaces (e.g., "1.Logic gates" and "1. Logic gates").
 * 3. Distinguishes genuine soft-wrapped lines from distinct topics.
 * 4. Identifies and skips syllabus/exam headers (e.g., "IA-2 portions", "Mod-2", "Unit 1", "Shift registers:").
 * 5. Cleans all leading numbers, letters, checkboxes, and bullet markers.
 * 6. Uniformly capitalizes the first letter of each task title.
 */

// Common messaging metadata lines to ignore (WhatsApp, Telegram, etc.)
const METADATA_PATTERNS = [
  /^forwarded(\s+as\s+received)?$/i,
  /^mensaje\s+reenviado$/i,
  /^\[?\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4},?\s+\d{1,2}:\d{2}(:\d{2})?(\s*[ap]m)?\]?\s*(-|:)?\s*.*$/i,
  /^\d{1,2}:\d{2}(\s*[ap]m)?(\s*-\s*.*)?$/i,
  /^(yesterday|today)(\s+at\s+\d{1,2}:\d{2}(\s*[ap]m)?)?$/i,
  /^<media\s+omitted>$/i,
  /^this\s+message\s+was\s+deleted$/i,
  /^(messages\s+and\s+calls\s+are\s+end-to-end\s+encrypted)/i,
];

// Explicit list marker patterns (supporting with or without space before letters, e.g. "1.Logic gates")
const NUMBERED_MARKER_REGEX = /^(?:\(?\d+(?:\.\d+)*[\.\)]|\(?\d+\))(?:\s+|(?=[a-zA-Z]))/;
const LETTERED_MARKER_REGEX = /^(?:[a-zA-Z][\.\)]|\(?[a-zA-Z]\))(?:\s+|(?=[a-zA-Z]))/;
const ROMAN_MARKER_REGEX = /^(?:\(?[ivxlcdm]+[\.\)]|\(?[ivxlcdm]+\))(?:\s+|(?=[a-zA-Z]))/i;
const BULLET_MARKER_REGEX = /^(?:[-*•▪▸►✓✔○●\u2022\u2023\u25E6\u2043\u2219]|\[[\s xX✓✔]?\]|[🔹🔸▫️▪️◽️◾️★☆])\s*/;

/**
 * Checks whether a line starts with an explicit list marker.
 */
export function hasListMarker(line: string): boolean {
  const trimmed = line.trim();
  // Guard common abbreviations
  if (/^(?:i\.e\.|e\.g\.)/i.test(trimmed)) return false;

  return (
    NUMBERED_MARKER_REGEX.test(trimmed) ||
    LETTERED_MARKER_REGEX.test(trimmed) ||
    ROMAN_MARKER_REGEX.test(trimmed) ||
    BULLET_MARKER_REGEX.test(trimmed)
  );
}

/**
 * Detects whether a string contains metadata or empty noise.
 */
export function isMetadataLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return true;
  return METADATA_PATTERNS.some(pattern => pattern.test(trimmed));
}

/**
 * Checks if a line is a generic header / prompt line introducing sub-items,
 * which should be skipped rather than creating a standalone checkbox.
 */
export function isParentPromptHeader(line: string, followingLines: string[] = []): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  // If there are no following lines, do not discard as a header
  if (followingLines.length === 0) return false;

  // Strip leading numbers or bullets first (e.g. "16. Should be able to do the following:" or "Module 1:")
  const stripped = trimmed.replace(
    /^(?:\[[\s xX✓✔]?\]\s*|(?:\(?\d+(?:\.\d+)*[\.\)]|\(?[a-zA-Z][\.\)]|\(?[ivxlcdm]+[\.\)]|[-*•▪▸►✓✔○●\u2022\u2023\u25E6\u2043\u2219]|(?:[🔹🔸▫️▪️◽️◾️★☆]))\s*)+/u,
    ''
  ).trim();

  // 1. Explicit prompt phrases introducing topics/sub-items
  if (/^(?:should\s+be\s+able\s+to|able\s+to|need\s+to|have\s+to|must\s+know|know\s+how\s+to|learn\s+how\s+to|questions\s+to\s+solve)\b/i.test(stripped)) {
    return true;
  }
  if (/^(?:the\s+following|following\s+(?:topics|questions|concepts|objectives|points|items|syllabus|assignments|portions))\b/i.test(stripped)) {
    return true;
  }
  if (/^(?:topics\s+to\s+cover|topics|syllabus|objectives|questions|assignments|to\s*do\s*list|todo\s*list|course\s+outline|study\s+guide|review\s+topics|important\s+topics)[\s:\-–—]*$/i.test(stripped)) {
    return true;
  }

  // 2. Portion / Exam / Assessment titles e.g. "IA-2 portions", "Midterm portions", "Exam syllabus", "Portions for IA2"
  if (/^(?:ia|internal|internals|assessment|exam|test|midterm|final|quiz|semester|unit|module|chapter|course)?[\s\-_0-9]*(?:portions?|syllabus|topics?|outline)[\s:\-–—]*.*$/i.test(stripped)) {
    return true;
  }

  // 3. Any line ending with a colon ':' when tasks follow it (e.g. "Digital Electronics Syllabus:", "Shift registers:")
  if (stripped.endsWith(':')) {
    return true;
  }

  // 4. Module / Unit / Chapter / Part / Section headers e.g. "Mod-2", "Mod 3", "Module 1", "Unit-4", "Chapter 5", "Part A"
  if (/^(?:module|mod|unit|chapter|ch|part|section)[\s\-_]*[0-9a-zA-Z]+[\s:\-–—]*.*$/i.test(stripped)) {
    return true;
  }

  return false;
}

/**
 * Determines whether a line is a soft-wrapped sentence continuation of the previous line
 * rather than a distinct new topic or task.
 */
export function isLineContinuation(line: string, prevLine: string): boolean {
  const trimmed = line.trim();
  const prevTrimmed = prevLine.trim();

  if (!trimmed || !prevTrimmed) return false;
  if (hasListMarker(trimmed)) return false;

  // Wrapped line starting with lowercase (e.g. "and excitation table design using", "race around condition")
  if (/^[a-z]/.test(trimmed)) {
    return true;
  }

  // Previous line ends with dangling conjunction, preposition, or connecting punctuation
  if (/(?:[\,\-\/\&\+]|\b(?:and|or|using|with|for|of|in|to|by|via|into|including|such\s+as))\s*$/i.test(prevTrimmed)) {
    return true;
  }

  // Hanging closing brackets (e.g. ")", "]", "}")
  if (/^[\)\]\}]/.test(trimmed)) {
    return true;
  }

  return false;
}

/**
 * Cleans leading markers from a task title and capitalizes the first character.
 */
export function cleanTaskTitle(text: string): string {
  let cleaned = text.trim();

  // Strip leading list markers (numbers, letters, bullets, checkboxes, brackets)
  cleaned = cleaned.replace(
    /^(?:\[[\s xX✓✔]?\]\s*|(?:\(?\d+(?:\.\d+)*[\.\)]|\(?[a-zA-Z][\.\)]|\(?[ivxlcdm]+[\.\)]|[-*•▪▸►✓✔○●\u2022\u2023\u25E6\u2043\u2219]|(?:[🔹🔸▫️▪️◽️◾️★☆]))\s*)+/u,
    ''
  );

  // Normalize internal whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';

  // Capitalize first character
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/**
 * Quick heuristic to determine if pasted text contains multi-line or multi-task content.
 */
export function isMultiTaskPaste(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  
  if (text.includes('\n')) {
    const nonEmp = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (nonEmp.length > 1) return true;
  }
  
  // Check inline markers (with or without trailing space before letters)
  if (/(?:^|\s)\(?\d+[\.\)](?:\s|[a-zA-Z]).+(?:\s)\(?\d+[\.\)](?:\s|[a-zA-Z])/.test(text)) return true;
  if (/(?:^|\s)\(?[a-zA-Z][\.\)](?:\s|[a-zA-Z]).+(?:\s)\(?[a-zA-Z][\.\)](?:\s|[a-zA-Z])/.test(text)) return true;
  if (/(?:^|\s)[•▪\-\*]\s+.+(?:\s)[•▪\-\*]\s+/.test(text)) return true;
  
  return false;
}

/**
 * Main parser: takes arbitrary student text and returns an array of clean task titles.
 */
export function parseSmartTasks(rawText: string): string[] {
  if (!rawText || typeof rawText !== 'string') return [];

  // Split raw text into lines
  const rawLines = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);

  // Handle lines that contain multiple inline numbered or bulleted items
  const expandedLines: string[] = [];
  for (const line of rawLines) {
    if (isMetadataLine(line)) continue;

    const hasMultipleNumberedInline = /(?:^|\s)\(?\d+[\.\)](?:\s|[a-zA-Z]).+(?:\s)\(?\d+[\.\)](?:\s|[a-zA-Z])/.test(line);
    const hasMultipleLetteredInline = /(?:^|\s)\(?[a-zA-Z][\.\)](?:\s|[a-zA-Z]).+(?:\s)\(?[a-zA-Z][\.\)](?:\s|[a-zA-Z])/.test(line);
    const hasMultipleBulletsInline = /(?:^|\s)[•▪\-\*]\s+.+(?:\s)[•▪\-\*]\s+/.test(line);

    if (hasMultipleNumberedInline) {
      const parts = line.split(/(?<=\S)\s+(?=\(?\d+[\.\)](?:\s|[a-zA-Z]))/).map(s => s.trim()).filter(Boolean);
      expandedLines.push(...parts);
    } else if (hasMultipleLetteredInline) {
      const parts = line.split(/(?<=\S)\s+(?=\(?[a-zA-Z][\.\)](?:\s|[a-zA-Z]))/).map(s => s.trim()).filter(Boolean);
      expandedLines.push(...parts);
    } else if (hasMultipleBulletsInline) {
      const parts = line.split(/(?<=\S)\s+(?=[•▪\-\*]\s+)/).map(s => s.trim()).filter(Boolean);
      expandedLines.push(...parts);
    } else {
      expandedLines.push(line);
    }
  }

  // Filter out any metadata lines that remain
  const validLines = expandedLines.filter(line => !isMetadataLine(line));
  if (validLines.length === 0) return [];

  const tasks: string[] = [];
  let currentTask: string | null = null;

  for (let i = 0; i < validLines.length; i++) {
    const line = validLines[i];
    const following = validLines.slice(i + 1);

    // 1. Check if line is a generic parent prompt or section header (skip standalone checkbox)
    if (isParentPromptHeader(line, following)) {
      if (currentTask) {
        tasks.push(currentTask);
        currentTask = null;
      }
      continue;
    }

    // 2. Check if this line is a continuation of currentTask or a new task
    if (currentTask) {
      if (isLineContinuation(line, currentTask)) {
        currentTask += ' ' + line;
      } else {
        tasks.push(currentTask);
        currentTask = line;
      }
    } else {
      currentTask = line;
    }
  }

  if (currentTask) {
    tasks.push(currentTask);
  }

  // Clean titles, remove leading markers, and capitalize
  return tasks
    .map(cleanTaskTitle)
    .filter(t => t.length > 0);
}
