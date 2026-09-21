import { StudySession, Subject, TodoItem, UserProfile } from '../types';
import { formatSeconds, getLocalDateString } from './utils';

/**
 * Downloads full StudyPulse account data as a formatted JSON backup.
 */
export function exportDataAsJSON(
  user: UserProfile,
  subjects: Subject[],
  sessions: StudySession[],
  todos: TodoItem[]
) {
  const exportPayload = {
    metadata: {
      appName: 'StudyPulse',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      totalSessionsCount: sessions.length,
      totalStudySeconds: sessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0),
    },
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      level: user.level,
      streakDays: user.streakDays,
      dailyGoalHours: user.dailyGoalHours,
      createdAt: user.createdAt,
    },
    subjects,
    studySessions: sessions,
    todos,
  };

  const jsonString = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const dateStr = getLocalDateString();
  triggerDownload(blob, `studypulse-backup-${dateStr}.json`);
}

/**
 * Downloads lifetime study sessions as a standard CSV spreadsheet.
 */
export function exportSessionsAsCSV(sessions: StudySession[], subjects: Subject[]) {
  const subjectList = Array.isArray(subjects) ? subjects : [];
  const subjectColorMap = new Map(subjectList.map(s => [s?.id, s?.color || '#10B981']));

  const headers = [
    'Session ID',
    'Date',
    'Start Time',
    'End Time',
    'Subject Name',
    'Subject Color',
    'Duration (Seconds)',
    'Duration (Minutes)',
    'Formatted Duration (HH:MM:SS)',
    'Timer Mode',
    'Notes',
  ];

  const rows = sessions.map(s => {
    const matchedSubject = subjectList.find(
      sub => sub && (
        (s.subjectId && sub.id === s.subjectId) ||
        (sub.name && sub.name.trim().toLowerCase() === (s.subjectName || '').trim().toLowerCase())
      )
    );
    const color = matchedSubject?.color || subjectColorMap.get(s.subjectId) || s.subjectColor || '#10B981';
    const durationMins = (s.durationSeconds / 60).toFixed(1);
    const formattedDuration = formatSeconds(s.durationSeconds);
    const cleanNotes = (s.notes || '').replace(/"/g, '""');

    return [
      `"${s.id}"`,
      `"${dateStr}"`,
      `"${s.startTime || ''}"`,
      `"${s.endTime || ''}"`,
      `"${(s.subjectName || '').replace(/"/g, '""')}"`,
      `"${color}"`,
      s.durationSeconds,
      durationMins,
      `"${formattedDuration}"`,
      `"${s.mode || 'stopwatch'}"`,
      `"${cleanNotes}"`,
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const dateStr = getLocalDateString();
  triggerDownload(blob, `studypulse-study-sessions-${dateStr}.csv`);
}

function triggerDownload(blob: Blob, filename: string) {
  if (typeof window === 'undefined') return;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
