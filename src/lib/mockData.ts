import { Subject, StudySession, TodoItem, StudyRoom, RoomMember, UserProfile } from '../types';

export const INITIAL_USER: UserProfile = {
  id: 'user-scholar-1',
  email: 'user@study.io',
  displayName: 'Focus Scholar',
  avatarUrl: '',
  bio: 'Dedicated to deep work & daily focus 🎯',
  dailyGoalHours: 4.0,
  streakDays: 0,
  level: 1,
  totalStudySeconds: 0,
  status: 'resting',
  currentSeasonId: '2026-09',
  seasonRp: 0,
  last_streak_bonus_date: undefined,
  lastStreakBonusDate: undefined,
  createdAt: new Date().toISOString(),
};

export const INITIAL_SUBJECTS: Subject[] = [
  {
    id: 'sub-1',
    name: 'General Focus',
    color: '#5A6B6A', // Muted Teal-Gray
    targetMinutesPerDay: 60,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sub-2',
    name: 'Deep Work',
    color: '#10B981', // Emerald
    targetMinutesPerDay: 120,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sub-3',
    name: 'Reading & Research',
    color: '#8B5CF6', // Purple
    targetMinutesPerDay: 45,
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_ROOMS: StudyRoom[] = [
  {
    id: 'room-global',
    name: 'Silent Focus Lounge 🌿',
    description: 'Quiet, high-intensity focus hall. Keep distractions off.',
    category: 'general',
    tags: ['Silent', 'Deep Work', 'All Subjects'],
    isPrivate: false,
    maxMembers: 50,
    memberCount: 1,
    createdBy: 'system',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'room-stem',
    name: 'Code & Problem Solving ⚡',
    description: 'Algorithms, engineering, and focused problem solving.',
    category: 'stem',
    tags: ['Coding', 'Math', 'Engineering'],
    isPrivate: false,
    maxMembers: 30,
    memberCount: 1,
    createdBy: 'system',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'room-pomo',
    name: 'Pomodoro Focus Room ⏱️',
    description: 'Structured study intervals with mindful recharge breaks.',
    category: 'pomodoro',
    tags: ['Pomodoro', 'Timed'],
    isPrivate: false,
    maxMembers: 40,
    memberCount: 1,
    createdBy: 'system',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'room-private-club',
    name: 'Deep Work Syndicate 🔒',
    description: 'Password-protected private focus group.',
    category: 'general',
    tags: ['Private', 'Deep Work'],
    isPrivate: true,
    passcode: '1234',
    maxMembers: 15,
    memberCount: 1,
    createdBy: 'system',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'room-reading',
    name: 'Quiet Reading Room 📖',
    description: 'Literature, papers, notes, and reflective deep work.',
    category: 'general',
    tags: ['Reading', 'Research', 'Quiet'],
    isPrivate: false,
    maxMembers: 25,
    memberCount: 1,
    createdBy: 'system',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'room-mcat-prep',
    name: 'MCAT & Medical Squad 🔒',
    description: 'Dedicated med school & biology sprint group.',
    category: 'medical',
    tags: ['Medical', 'MCAT', 'Private'],
    isPrivate: true,
    passcode: 'medfocus',
    maxMembers: 20,
    memberCount: 1,
    createdBy: 'system',
    createdAt: new Date().toISOString(),
  },
];

// No fake bots - only real active studiers appear in rooms
export const INITIAL_ROOM_MEMBERS: RoomMember[] = [];

// Empty initial study sessions - real sessions recorded as user studies
export function generateInitialSessions(_userId = 'user-scholar-1'): StudySession[] {
  return [];
}

export function getTodayDateString(offsetDays = 0): string {
  const d = new Date();
  if (offsetDays !== 0) {
    d.setDate(d.getDate() + offsetDays);
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Empty initial todos - user plans their own real daily tasks
export const INITIAL_TODOS: TodoItem[] = [];

/**
 * Calculates continuous study streak based on actual logged sessions.
 */
export function calculateStreak(sessions: StudySession[]): number {
  if (!sessions || sessions.length === 0) return 0;

  const studyDates = new Set<string>();
  sessions.forEach(s => {
    // Only count meaningful sessions (at least 30 seconds)
    if (s.startTime && s.durationSeconds >= 30) {
      const localDate = new Date(s.startTime);
      const year = localDate.getFullYear();
      const month = String(localDate.getMonth() + 1).padStart(2, '0');
      const day = String(localDate.getDate()).padStart(2, '0');
      studyDates.add(`${year}-${month}-${day}`);
    }
  });

  if (studyDates.size === 0) return 0;

  const todayStr = getTodayDateString(0);
  const yesterdayStr = getTodayDateString(-1);

  // If user hasn't studied today and also didn't study yesterday, streak is broken
  if (!studyDates.has(todayStr) && !studyDates.has(yesterdayStr)) {
    return 0;
  }

  let streak = 0;
  let offset = studyDates.has(todayStr) ? 0 : -1;

  while (true) {
    const dStr = getTodayDateString(offset);
    if (studyDates.has(dStr)) {
      streak += 1;
      offset -= 1;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Automatically purges legacy demo data (e.g. Alex Rivers, fake 30-day sessions, bot lists)
 * from the browser's localStorage.
 */
export function cleanupLegacyDemoData(): boolean {
  if (typeof window === 'undefined') return false;

  let cleaned = false;
  try {
    const savedUser = localStorage.getItem('studypulse_active_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      if (
        parsed.id === 'user-demo-1' ||
        parsed.displayName === 'Alex Rivers' ||
        parsed.email === 'alex.studier@studypulse.io' ||
        parsed.displayName === 'Maya Lin' ||
        parsed.displayName === 'Kenji Sato'
      ) {
        localStorage.removeItem('studypulse_active_user');
        cleaned = true;
      }
    }

    const savedSessions = localStorage.getItem('studypulse_sessions');
    if (savedSessions) {
      const parsed = JSON.parse(savedSessions);
      if (
        Array.isArray(parsed) &&
        parsed.some((s: StudySession) => s.id?.startsWith('sess-2') || s.userName === 'Alex Rivers' || s.userId === 'user-demo-1')
      ) {
        localStorage.removeItem('studypulse_sessions');
        cleaned = true;
      }
    }

    const savedTodos = localStorage.getItem('studypulse_todos');
    if (savedTodos) {
      const parsed = JSON.parse(savedTodos);
      if (
        Array.isArray(parsed) &&
        parsed.some((t: TodoItem) => t.userId === 'user-demo-1' || t.title?.includes('LeetCode Graph Traversal') || t.title?.includes('Calculus Problem Set'))
      ) {
        localStorage.removeItem('studypulse_todos');
        cleaned = true;
      }
    }

    const savedMembers = localStorage.getItem('studypulse_room_members');
    if (savedMembers) {
      localStorage.removeItem('studypulse_room_members');
      cleaned = true;
    }

    const savedMessages = localStorage.getItem('studypulse_room_messages');
    if (savedMessages) {
      localStorage.removeItem('studypulse_room_messages');
      cleaned = true;
    }
  } catch {
    // ignore
  }

  return cleaned;
}
