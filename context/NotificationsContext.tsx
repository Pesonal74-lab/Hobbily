/**
 * NotificationsContext
 * Derives in-app notifications from existing data sources:
 *  - Achievements earned (ProgressContext)
 *  - Likes on own posts (PostsContext)
 *  - Comments on own posts by others (PostsContext)
 *  - Daily practice reminder (TimeContext)
 *
 * Read state is persisted to AsyncStorage so the badge resets correctly
 * across sessions.
 */
import { createContext, useContext, useState, useEffect, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useProgress } from "./ProgressContext";
import { usePosts } from "./PostsContext";
import { useProfile } from "./ProfileContext";
import { useTime } from "./TimeContext";

const READ_KEY = "@hobbily_notif_read";

export type AppNotification = {
  id: string;
  type: "achievement" | "like" | "comment" | "reminder";
  title: string;
  body: string;
  /** ISO timestamp — used for sorting and relative time display */
  timestamp: string;
  icon: string;
  iconColor: string;
  /** Route to push when the notification is tapped */
  route?: string;
};

type NotificationsContextType = {
  notifications: (AppNotification & { read: boolean })[];
  unreadCount: number;
  markAllRead: () => void;
  markRead: (id: string) => void;
};

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { achievements } = useProgress();
  const { posts } = usePosts();
  const { profile } = useProfile();
  const { dailyReminderEnabled } = useTime();
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    AsyncStorage.getItem(READ_KEY).then((raw) => {
      if (raw) setReadIds(new Set(JSON.parse(raw) as string[]));
    });
  }, []);

  const notifications = useMemo((): AppNotification[] => {
    const result: AppNotification[] = [];

    // ── Achievements ──────────────────────────────────────────────────────────
    for (const a of achievements) {
      result.push({
        id: `achievement_${a.id}`,
        type: "achievement",
        title: "Badge Unlocked!",
        body: `You earned "${a.title}" — ${a.description}`,
        // earnedAt is a date string like "2025-03-16"; anchor to midday
        timestamp: a.earnedAt + "T12:00:00.000Z",
        icon: a.icon,
        iconColor: "#F59E0B",
        route: "/achievements",
      });
    }

    // ── Post interactions (only for the signed-in user's own posts) ───────────
    const me = profile.username;
    if (me) {
      for (const post of posts) {
        if (post.username !== me) continue;

        // Likes
        if (post.likes.length > 0) {
          const n = post.likes.length;
          result.push({
            id: `likes_${post.id}`,
            type: "like",
            title: n === 1 ? "Someone liked your post" : `${n} people liked your post`,
            body: `"${post.title}"`,
            timestamp: post.createdAt,
            icon: "heart",
            iconColor: "#E86B5E",
            route: `/post/${post.id}`,
          });
        }

        // Comments by other users
        const otherComments = post.comments.filter(
          (c) => c.username !== me && !c.deletedAt
        );
        if (otherComments.length > 0) {
          const latest = otherComments[otherComments.length - 1];
          const n = otherComments.length;
          result.push({
            id: `comments_${post.id}`,
            type: "comment",
            title: n === 1
              ? `${latest.username} commented on your post`
              : `${n} people commented on your post`,
            body: `"${post.title}"`,
            timestamp: latest.createdAt,
            icon: "chatbubble-outline",
            iconColor: "#4A6FD4",
            route: `/post/${post.id}`,
          });
        }
      }
    }

    // ── Daily reminder ────────────────────────────────────────────────────────
    if (dailyReminderEnabled) {
      const today = new Date().toISOString().slice(0, 10);
      result.push({
        id: `reminder_${today}`,
        type: "reminder",
        title: "Daily Practice Reminder",
        body: "Don't forget to practice today and keep your streak alive!",
        timestamp: today + "T08:00:00.000Z",
        icon: "notifications-outline",
        iconColor: "#10B981",
        route: "/(tabs)/time-manager",
      });
    }

    // Sort newest first
    return result.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [achievements, posts, profile.username, dailyReminderEnabled]);

  const notificationsWithRead = notifications.map((n) => ({
    ...n,
    read: readIds.has(n.id),
  }));

  const unreadCount = notificationsWithRead.filter((n) => !n.read).length;

  function markAllRead() {
    const all = new Set(notifications.map((n) => n.id));
    setReadIds(all);
    AsyncStorage.setItem(READ_KEY, JSON.stringify([...all]));
  }

  function markRead(id: string) {
    const next = new Set(readIds);
    next.add(id);
    setReadIds(next);
    AsyncStorage.setItem(READ_KEY, JSON.stringify([...next]));
  }

  return (
    <NotificationsContext.Provider value={{ notifications: notificationsWithRead, unreadCount, markAllRead, markRead }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used inside NotificationsProvider");
  return ctx;
}
