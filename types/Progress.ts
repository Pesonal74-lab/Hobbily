export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string; // Ionicons name
  earnedAt: string; // ISO date
};

export type ProgressState = {
  /** ISO date strings for days the user completed at least one session */
  streakDays: string[];
  totalSessions: number;
  totalMinutes: number;
  longestStreak: number;
  achievements: Achievement[];
  streakFreezeAvailable: boolean;
  streakFreezeLastGranted: string; // ISO date of last Monday freeze was granted
};
