export type Subject = {
  id: string;
  name: string;
  color: string;
  icon?: string;
  targetMinutesPerDay?: number;
  userId?: string;
  createdAt: string;
};

export type StudySession = {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  durationSeconds: number;
  notes?: string;
  taskId?: string;
  mode: 'stopwatch' | 'pomodoro' | 'countdown';
  createdAt: string;
};

export type TodoItem = {
  id: string;
  userId: string;
  title: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  estimatedMinutes?: number;
  subjectId?: string;
  subjectName?: string;
  subjectColor?: string;
  completedAt?: string;
  createdAt: string;
};

export type UserProfile = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  bio?: string;
  dailyGoalHours: number;
  streakDays: number;
  level: number;
  xp?: number;
  levelTitle?: string;
  totalStudySeconds: number;
  status: 'studying' | 'resting' | 'offline';
  currentSubjectId?: string;
  currentSubjectName?: string;
  currentSubjectColor?: string;
  activeSessionStartTime?: string; // ISO string if currently studying
  currentSessionElapsedSeconds?: number;
  createdAt: string;
  currentSeasonId?: string;
  seasonRp?: number;
  rp?: number;
  user_metadata?: {
    avatar_url?: string;
    picture?: string;
    full_name?: string;
    name?: string;
    display_name?: string;
    [key: string]: unknown;
  };
};

export type RankSettlementBreakdown = {
  sessionRP: number;          // 10 RP per focused minute
  goalStreakBonus: number;     // +50 RP (Goal / Streak Bonus)
  taskBonus: number;           // +10 RP (Task Completion)
  totalGained: number;         // Total RP gained
  durationSeconds: number;
};

export type RankSettlementData = {
  prevRP: number;
  newRP: number;
  breakdown: RankSettlementBreakdown;
  subjectName?: string;
  subjectColor?: string;
};

export type SeasonRecapData = {
  previousSeasonId: string;
  newSeasonId: string;
  previousRP: number;
  previousTierTitle: string;
  newRP: number;
  newTierTitle: string;
};

export type StudyRoom = {
  id: string;
  name: string;
  description: string;
  category: 'general' | 'stem' | 'medical' | 'language' | 'pomodoro' | 'custom';
  tags: string[];
  isPrivate: boolean;
  passcode?: string;
  maxMembers: number;
  memberCount: number;
  createdBy: string;
  createdAt: string;
};

export type RoomMember = {
  id: string;
  roomId: string;
  userId: string;
  displayName: string;
  avatarUrl: string;
  status: 'studying' | 'resting' | 'offline';
  currentSubjectName?: string;
  currentSubjectColor?: string;
  activeTimerSeconds: number;
  todayTotalSeconds: number;
  streakDays: number;
  isBot?: boolean;
  lastActive: string;
};

export type RoomChatMessage = {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  message: string;
  type: 'text' | 'cheer' | 'system' | 'milestone';
  cheerEmoji?: string;
  timestamp: string;
};

export type CheerReaction = {
  id: string;
  fromName: string;
  toName: string;
  emoji: string;
  x: number; // percentage on screen for floating animation
  y: number;
  timestamp: number;
};

export type TimerMode = 'stopwatch' | 'pomodoro' | 'countdown';

export type PomodoroPhase = 'work' | 'shortBreak' | 'longBreak';
