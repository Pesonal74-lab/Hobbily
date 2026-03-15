/**
 * ProgressContext
 * Tracks streaks, total sessions, total practice minutes, and achievements.
 * All data persisted to Firestore at progress/{uid}.
 */
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Achievement, ProgressState } from "../types/Progress";
import { useAuth } from "./AuthContext";
import { db } from "../lib/firebase";

// ── Achievement definitions ───────────────────────────────────────────────────

type AchievementDef = Omit<Achievement, "earnedAt"> & {
  check: (state: ProgressState & { currentStreak: number }) => boolean;
};

const ACHIEVEMENT_DEFS: AchievementDef[] = [
  { id: "first_session",  title: "First Step",   description: "Complete your first session",    icon: "footsteps-outline", check: (s) => s.totalSessions >= 1 },
  { id: "streak_3",       title: "3-Day Streak", description: "Practice 3 days in a row",       icon: "flame-outline",     check: (s) => s.currentStreak >= 3 },
  { id: "streak_7",       title: "Week Warrior", description: "7-day streak!",                  icon: "trophy-outline",    check: (s) => s.currentStreak >= 7 },
  { id: "sessions_10",    title: "Dedicated",    description: "Complete 10 sessions",           icon: "star-outline",      check: (s) => s.totalSessions >= 10 },
  { id: "minutes_300",    title: "Five Hours",   description: "5+ hours of practice total",     icon: "time-outline",      check: (s) => s.totalMinutes >= 300 },
  { id: "streak_30",      title: "Month Master", description: "30-day streak!",                 icon: "medal-outline",     check: (s) => s.currentStreak >= 30 },
  { id: "sessions_50",    title: "Committed",    description: "Complete 50 sessions",           icon: "ribbon-outline",    check: (s) => s.totalSessions >= 50 },
];

// ── Streak computation ────────────────────────────────────────────────────────

function todayISO() { return new Date().toISOString().slice(0, 10); }
function offsetISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function computeCurrentStreak(streakDays: string[], freezeUsed?: string | null): number {
  if (streakDays.length === 0) return 0;
  const set = new Set(streakDays);
  const today = todayISO();
  const yesterday = offsetISO(-1);
  const startDate = set.has(today) ? today : set.has(yesterday) ? yesterday : null;
  if (!startDate) return 0;
  let count = 0;
  let check = startDate;
  for (let i = 0; i < 366; i++) {
    if (set.has(check)) {
      count++;
    } else if (i === 0 && freezeUsed === today) {
      count++;
    } else {
      break;
    }
    const d = new Date(check + "T00:00:00");
    d.setDate(d.getDate() - 1);
    check = d.toISOString().slice(0, 10);
  }
  return count;
}

function getThisMonday(): string {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return d.toISOString().slice(0, 10);
}

// ── Context type ──────────────────────────────────────────────────────────────

type ProgressContextType = {
  currentStreak: number;
  longestStreak: number;
  totalSessions: number;
  totalMinutes: number;
  achievements: Achievement[];
  streakFreezeAvailable: boolean;
  recordSession: (minutes: number) => Promise<void>;
  useStreakFreeze: () => Promise<void>;
};

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

const DEFAULT_STATE: ProgressState = {
  streakDays: [],
  totalSessions: 0,
  totalMinutes: 0,
  longestStreak: 0,
  achievements: [],
  streakFreezeAvailable: true,
  streakFreezeLastGranted: "",
};

// ── Provider ──────────────────────────────────────────────────────────────────

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthLoaded } = useAuth();
  const [state, setState] = useState<ProgressState>(DEFAULT_STATE);
  const [freezeUsedDate, setFreezeUsedDate] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthLoaded || !user) {
      setState(DEFAULT_STATE);
      setFreezeUsedDate(null);
      return;
    }
    getDoc(doc(db, "progress", user.uid)).then((snap) => {
      if (snap.exists()) {
        const parsed = snap.data();
        setState({ ...DEFAULT_STATE, ...parsed.state });
        setFreezeUsedDate(parsed.freezeUsedDate ?? null);
      }
    });
  }, [user, isAuthLoaded]);

  async function persist(newState: ProgressState, newFreeze: string | null) {
    setState(newState);
    setFreezeUsedDate(newFreeze);
    if (user) {
      await setDoc(
        doc(db, "progress", user.uid),
        { state: newState, freezeUsedDate: newFreeze },
        { merge: true }
      );
    }
  }

  const currentStreak = computeCurrentStreak(state.streakDays, freezeUsedDate);

  function checkAchievements(s: ProgressState, streak: number): Achievement[] {
    const combined = { ...s, currentStreak: streak };
    const earned = new Set(s.achievements.map((a) => a.id));
    const newOnes: Achievement[] = [];
    for (const def of ACHIEVEMENT_DEFS) {
      if (!earned.has(def.id) && def.check(combined)) {
        newOnes.push({ id: def.id, title: def.title, description: def.description, icon: def.icon, earnedAt: todayISO() });
      }
    }
    return newOnes;
  }

  const recordSession = useCallback(async (minutes: number) => {
    const today = todayISO();
    const newDays = state.streakDays.includes(today)
      ? state.streakDays
      : [...state.streakDays, today];

    const newTotalSessions = state.totalSessions + 1;
    const newTotalMinutes = state.totalMinutes + minutes;

    const monday = getThisMonday();
    const freezeAvailable = state.streakFreezeLastGranted !== monday ? true : state.streakFreezeAvailable;

    const newStreak = computeCurrentStreak(newDays, freezeUsedDate);
    const newLongest = Math.max(state.longestStreak, newStreak);
    const newAchievements = checkAchievements(
      { ...state, streakDays: newDays, totalSessions: newTotalSessions, totalMinutes: newTotalMinutes, longestStreak: newLongest, streakFreezeAvailable: freezeAvailable },
      newStreak
    );

    const updated: ProgressState = {
      ...state,
      streakDays: newDays,
      totalSessions: newTotalSessions,
      totalMinutes: newTotalMinutes,
      longestStreak: newLongest,
      achievements: [...state.achievements, ...newAchievements],
      streakFreezeAvailable: freezeAvailable,
      streakFreezeLastGranted: freezeAvailable && state.streakFreezeLastGranted !== monday ? monday : state.streakFreezeLastGranted,
    };

    await persist(updated, freezeUsedDate);
  }, [state, freezeUsedDate]);

  const useStreakFreeze = useCallback(async () => {
    if (!state.streakFreezeAvailable) return;
    const updated: ProgressState = { ...state, streakFreezeAvailable: false };
    await persist(updated, todayISO());
  }, [state]);

  return (
    <ProgressContext.Provider
      value={{
        currentStreak,
        longestStreak: state.longestStreak,
        totalSessions: state.totalSessions,
        totalMinutes: state.totalMinutes,
        achievements: state.achievements,
        streakFreezeAvailable: state.streakFreezeAvailable,
        recordSession,
        useStreakFreeze,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used inside ProgressProvider");
  return ctx;
}
