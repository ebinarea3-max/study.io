/**
 * Smart Task Parser for Study.io
 * 
 * Automatically parses real-world student lists (e.g., WhatsApp messages,
 * syllabi, lecture notes, textbook outlines) into clean, individual tasks.
 * 
 * Features:
 * 1. Filters messaging/chat metadata (timestamps, "Forwarded", etc.).
 * 2. Merges soft-wrapped multi-line topics into single tasks.
 * 3. Skips generic parent prompt lines / headers (e.g. "Should be able to do:").
 * 4. Cleans all leading numbers, letters, checkboxes, and bullet markers.
 * 5. Uniformly capitalizes the first letter of each task title.
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

// Explicit list marker patterns
const NUMBERED_MARKER_REGEX = /^(?:\(?\d+(?:\.\d+)*[\.\)]|\(?\d+\))\s+/;
const LETTERED_MARKER_REGEX = /^(?:[a-zA-Z][\.\)]|\(?[a-zA-Z]\))\s+/;
const ROMAN_MARKER_REGEX = /^(?:[ivxlcdm]+[\.\)]|\(?[ivxlcdm]+\))\s+/i;
const BULLET_MARKER_REGEX = /^(?:[-*•▪▸►✓✔○●\u2022\u2023\u25E6\u2043\u2219]|\[[\s xX✓✔]?\]|[🔹🔸▫️▪️◽️◾️★☆])\s*/;

/**
 * Checks whether a line starts with an explicit list marker.
 */
export function hasListMarker(line: string): boolean {
  const trimmed = line.trim();
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
function isMetadataLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return true;
  return METADATA_PATTERNS.some(pattern => pattern.test(trimmed));
}

/**
 * Checks if a line is a generic header / prompt line introducing sub-items,
 * which should be skipped rather than creating a standalone checkbox.
 */
function isParentPromptHeader(line: string, followingLines: string[] = []): boolean {
  const trimmed = line.trim();
  // Strip leading numbers or bullets first (e.g. "16. Should be able to do the following:")
  const stripped = trimmed.replace(/^(?:\(?\d+[\.\)]|\(?\w[\.\)]|[-*•▪▸►✓✔\[\]])\s*/, '').trim();

  // Explicit prompt phrases
  if (/^(?:should\s+be\s+able\s+to|able\s+to|need\s+to|have\s+to|must\s+know|know\s+how\s+to|learn\s+how\s+to|questions\s+to\s+solve)\b/i.test(stripped)) {
    return true;
  }
  if (/^(?:the\s+following|following\s+(?:topics|questions|concepts|objectives|points|items|syllabus|assignments))\b/i.test(stripped)) {
    return true;
  }
  if (/^(?:topics\s+to\s+cover|topics|syllabus|objectives|questions|assignments|to\s*do\s*list|todo\s*list|course\s+outline)[\s:]*$/i.test(stripped)) {
    return true;
  }

  // Any line ending with a colon that precedes sub-items e.g. "Shift registers:" or "Digital Electronics Syllabus:"
  if (stripped.endsWith(':') && followingLines.length > 0) {
    return true;
  }

  // Generic Module / Unit / Chapter headers e.g. "Module 3", "Unit 2", "Chapter 5"
  if (/^(?:module|unit|chapter|section|part)\s+\d+[\s:\-–—]*.*$/i.test(stripped) && followingLines.length > 0) {
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
  
  // Check inline markers
  if (/(?:^|\s)\d+[\.\)]\s+.+(?:\s)\d+[\.\)]\s+/.test(text)) return true;
  if (/(?:^|\s)[a-zA-Z][\.\)]\s+.+(?:\s)[a-zA-Z][\.\)]\s+/.test(text)) return true;
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

  // Handle single-line text with inline markers e.g. "1. First 2. Second 3. Third"
  const expandedLines: string[] = [];
  for (const line of rawLines) {
    if (isMetadataLine(line)) continue;

    const hasMultipleNumberedInline = /(?:^|\s)\d+[\.\)]\s+.+(?:\s)\d+[\.\)]\s+/.test(line);
    const hasMultipleLetteredInline = /(?:^|\s)[a-zA-Z][\.\)]\s+.+(?:\s)[a-zA-Z][\.\)]\s+/.test(line);
    const hasMultipleBulletsInline = /(?:^|\s)[•▪\-\*]\s+.+(?:\s)[•▪\-\*]\s+/.test(line);

    if (hasMultipleNumberedInline) {
      const parts = line.split(/(?<=\S)\s+(?=\d+[\.\)]\s+)/).map(s => s.trim()).filter(Boolean);
      expandedLines.push(...parts);
    } else if (hasMultipleLetteredInline) {
      const parts = line.split(/(?<=\S)\s+(?=[a-zA-Z][\.\)]\s+)/).map(s => s.trim()).filter(Boolean);
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

  // Check if this text block uses list markers
  const totalWithMarkers = validLines.filter(hasListMarker).length;
  const isListMode = totalWithMarkers > 0;

  const tasks: string[] = [];
  let currentTask: string | null = null;

  for (let i = 0; i < validLines.length; i++) {
    const line = validLines[i];
    const following = validLines.slice(i + 1);

    // 1. Check if line is a generic parent prompt header (skip standalone checkbox)
    if (isParentPromptHeader(line, following)) {
      if (currentTask) {
        tasks.push(currentTask);
        currentTask = null;
      }
      continue;
    }

    // 2. In list mode, determine if this is a new item or a line wrap continuation
    if (isListMode) {
      if (hasListMarker(line)) {
        // Starts with marker -> new item!
        if (currentTask) {
          tasks.push(currentTask);
        }
        currentTask = line;
      } else {
        // Does NOT start with marker
        if (currentTask) {
          // Wrapped line continuation! Append to currentTask
          currentTask += ' ' + line;
        } else {
          // Standalone line before first marker
          currentTask = line;
        }
      }
    } else {
      // Plain text mode (no markers anywhere): each clean non-empty line is an individual task
      tasks.push(line);
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

