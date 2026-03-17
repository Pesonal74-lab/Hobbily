/**
 * Notifications screen
 * Shows all in-app notifications grouped by date: Today, Yesterday, Earlier.
 * Tapping a notification marks it read and navigates to the relevant screen.
 */
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTheme } from "../context/ThemeContext";
import { useNotifications, AppNotification } from "../context/NotificationsContext";

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);

  if (mins  <  1) return "Just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  <  2) return "Yesterday";
  if (days  <  7) return `${days} days ago`;

  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function dayBucket(iso: string): "today" | "yesterday" | "earlier" {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days < 1)  return "today";
  if (days < 2)  return "yesterday";
  return "earlier";
}

const BUCKET_LABELS: Record<string, string> = {
  today:     "Today",
  yesterday: "Yesterday",
  earlier:   "Earlier",
};

// ── Notification row ──────────────────────────────────────────────────────────

function NotifRow({
  notif, colors, onPress,
}: {
  notif: AppNotification & { read: boolean };
  colors: any;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.row,
        {
          backgroundColor: notif.read ? colors.card : colors.primary + "12",
          borderColor: colors.border,
          borderLeftColor: notif.read ? colors.border : notif.iconColor,
          borderLeftWidth: notif.read ? 1 : 3,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Icon circle */}
      <View style={[styles.iconCircle, { backgroundColor: notif.iconColor + "20" }]}>
        <Ionicons name={notif.icon as any} size={22} color={notif.iconColor} />
      </View>

      {/* Content */}
      <View style={styles.rowContent}>
        <View style={styles.rowTop}>
          <Text
            style={[styles.rowTitle, { color: colors.text, fontWeight: notif.read ? "600" : "800" }]}
            numberOfLines={1}
          >
            {notif.title}
          </Text>
          {!notif.read && (
            <View style={[styles.unreadDot, { backgroundColor: notif.iconColor }]} />
          )}
        </View>
        <Text style={[styles.rowBody, { color: colors.secondaryText }]} numberOfLines={2}>
          {notif.body}
        </Text>
        <Text style={[styles.rowTime, { color: colors.secondaryText }]}>
          {relativeTime(notif.timestamp)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications();

  // Group by bucket
  const grouped: Record<string, (AppNotification & { read: boolean })[]> = {
    today:     [],
    yesterday: [],
    earlier:   [],
  };
  for (const n of notifications) {
    grouped[dayBucket(n.timestamp)].push(n);
  }

  function handlePress(n: AppNotification & { read: boolean }) {
    markRead(n.id);
    if (n.route) router.push(n.route as any);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { borderColor: colors.border }]}>
          <Text style={[styles.backBtnText, { color: colors.primary }]}>Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.primary }]}>NOTIFICATIONS</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
            <Text style={[styles.markAllText, { color: colors.accent }]}>Mark all read</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      {notifications.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="notifications-off-outline" size={52} color={colors.secondaryText} />
          <Text style={[styles.emptyTitle, { color: colors.primary }]}>All caught up</Text>
          <Text style={[styles.emptyBody, { color: colors.secondaryText }]}>
            Notifications will appear here as you use the app.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {(["today", "yesterday", "earlier"] as const).map((bucket) => {
            const items = grouped[bucket];
            if (items.length === 0) return null;
            return (
              <View key={bucket}>
                <Text style={[styles.sectionLabel, { color: colors.secondaryText }]}>
                  {BUCKET_LABELS[bucket].toUpperCase()}
                </Text>
                {items.map((n) => (
                  <NotifRow
                    key={n.id}
                    notif={n}
                    colors={colors}
                    onPress={() => handlePress(n)}
                  />
                ))}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  backBtnText: { fontSize: 14, fontWeight: "600" },
  title: { fontSize: 20, fontWeight: "800", letterSpacing: 1 },
  markAllBtn: { paddingHorizontal: 4, paddingVertical: 6 },
  markAllText: { fontSize: 13, fontWeight: "700" },

  // Empty state
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 12,
  },
  emptyTitle: { fontSize: 20, fontWeight: "800" },
  emptyBody: { fontSize: 14, textAlign: "center", lineHeight: 20 },

  // List
  list: { padding: 16, gap: 4, paddingBottom: 40 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 12,
    marginBottom: 6,
    marginLeft: 2,
  },

  // Row
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  rowContent: { flex: 1, gap: 3 },
  rowTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 6 },
  rowTitle: { fontSize: 14, flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  rowBody: { fontSize: 13, lineHeight: 18 },
  rowTime: { fontSize: 11, marginTop: 2 },
});
