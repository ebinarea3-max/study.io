export interface RawSessionInput {
  subjectId?: string;
  subjectName?: string;
  taskName?: string;
  notes?: string;
  userId: string;
}

export interface SplitSessionRecord {
  userId: string;
  subjectId?: string;
  subjectName?: string;
  taskName?: string;
  notes?: string;
  startTime: string; // ISO String
  endTime: string;   // ISO String
  durationSeconds: number;
  rpEarned: number;
  date: string;      // YYYY-MM-DD (local date)
}

export function splitSessionAtMidnights(
  start: Date,
  end: Date,
  meta: RawSessionInput
): SplitSessionRecord[] {
  const sessions: SplitSessionRecord[] = [];
  let currentCursor = new Date(start);

  const toLocalDateStr = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  while (currentCursor < end) {
    // Find the next midnight in local time
    const nextMidnight = new Date(
      currentCursor.getFullYear(),
      currentCursor.getMonth(),
      currentCursor.getDate() + 1,
      0, 0, 0, 0
    );

    // Chunk end is either next midnight or the actual session end time
    const chunkEnd = nextMidnight < end ? nextMidnight : end;
    const chunkSeconds = Math.max(1, Math.floor((chunkEnd.getTime() - currentCursor.getTime()) / 1000));
    const chunkRp = Math.floor(chunkSeconds / 36);

    sessions.push({
      ...meta,
      startTime: currentCursor.toISOString(),
      endTime: chunkEnd.toISOString(),
      durationSeconds: chunkSeconds,
      rpEarned: chunkRp,
      date: toLocalDateStr(currentCursor),
    });

    // Move cursor to midnight
    currentCursor = new Date(chunkEnd);
  }

  return sessions;
}
