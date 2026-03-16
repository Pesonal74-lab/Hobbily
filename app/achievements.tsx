/**
 * Achievements screen — shows all 7 badges with earned/locked state.
 */
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTheme } from "../context/ThemeContext";
import { useProgress } from "../context/ProgressContext";
import { Achievement } from "../types/Progress";

const ALL_ACHIEVEMENTS = [
  { id: "first_session", title: "First Step",   description: "Complete your first session",  icon: "footsteps-outline" },
  { id: "streak_3",      title: "3-Day Streak", description: "Practice 3 days in a row",     icon: "flame-outline" },
  { id: "streak_7",      title: "Week Warrior", description: "7-day streak!",                icon: "trophy-outline" },
  { id: "sessions_10",   title: "Dedicated",    description: "Complete 10 sessions",         icon: "star-outline" },
  { id: "minutes_300",   title: "Five Hours",   description: "5+ hours of practice total",   icon: "time-outline" },
  { id: "streak_30",     title: "Month Master", description: "30-day streak!",               icon: "medal-outline" },
  { id: "sessions_50",   title: "Committed",    description: "Complete 50 sessions",         icon: "ribbon-outline" },
];

function Tile({ def, earned, colors }: {
  def: typeof ALL_ACHIEVEMENTS[0];
  earned: Achievement | undefined;
  colors: any;
}) {
  return (
    <View
      style={[
        styles.tile,
        {
          backgroundColor: earned ? colors.primary : colors.card,
          borderColor: earned ? colors.primary : colors.border,
          opacity: earned ? 1 : 0.5,
        },
      ]}
    >
      <Ionicons name={def.icon as any} size={32} color={earned ? "#fff" : colors.secondaryText} />
      <Text style={[styles.tileTitle, { color: earned ? "#fff" : colors.text }]} numberOfLines={1}>
        {def.title}
      </Text>
      <Text style={[styles.tileDesc, { color: earned ? "rgba(255,255,255,0.8)" : colors.secondaryText }]} numberOfLines={2}>
        {def.description}
      </Text>
      {earned ? (
        <Text style={styles.tileDate}>{earned.earnedAt}</Text>
      ) : (
        <View style={[styles.lockBadge, { backgroundColor: colors.border }]}>
          <Ionicons name="lock-closed" size={10} color={colors.secondaryText} />
          <Text style={[styles.lockText, { color: colors.secondaryText }]}>Locked</Text>
        </View>
      )}
    </View>
  );
}

export default function AchievementsScreen() {
  const { colors } = useTheme();
  const { achievements, currentStreak, totalSessions, totalMinutes } = useProgress();

  const earnedCount = achievements.length;
  const practiceHours = Math.floor(totalMinutes / 60);
  const practiceMin = totalMinutes % 60;
  const practiceLabel = practiceHours > 0
    ? `${practiceHours}h ${practiceMin}m`
    : `${totalMinutes}m`;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { borderColor: colors.border }]}
        >
          <Text style={[styles.backBtnText, { color: colors.primary }]}>Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.primary }]}>ACHIEVEMENTS</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 48 }}>
        {/* Progress summary */}
        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.summaryRow}>
            {[
              { label: "Earned", value: `${earnedCount}/${ALL_ACHIEVEMENTS.length}`, icon: "trophy-outline" as const },
              { label: "Streak", value: `${currentStreak}d`, icon: "flame-outline" as const },
              { label: "Sessions", value: `${totalSessions}`, icon: "checkmark-circle-outline" as const },
              { label: "Practice", value: practiceLabel, icon: "time-outline" as const },
            ].map((s) => (
              <View key={s.label} style={styles.statItem}>
                <Ionicons name={s.icon} size={18} color={colors.accent} />
                <Text style={[styles.statValue, { color: colors.primary }]}>{s.value}</Text>
                <Text style={[styles.statLabel, { color: colors.secondaryText }]}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Grid */}
        <Text style={[styles.gridLabel, { color: colors.primary }]}>
          {earnedCount} of {ALL_ACHIEVEMENTS.length} unlocked
        </Text>
        <View style={styles.grid}>
          {ALL_ACHIEVEMENTS.map((def) => {
            const earned = achievements.find((a) => a.id === def.id);
            return <Tile key={def.id} def={def} earned={earned} colors={colors} />;
          })}
        </View>
      </ScrollView>
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
  summaryCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginTop: 8,
    marginBottom: 20,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-around" },
  statItem: { alignItems: "center", gap: 3 },
  statValue: { fontSize: 18, fontWeight: "800" },
  statLabel: { fontSize: 11, fontWeight: "600" },
  gridLabel: { fontSize: 14, fontWeight: "700", marginBottom: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  tile: {
    width: "47%",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    gap: 6,
  },
  tileTitle: { fontSize: 13, fontWeight: "700", textAlign: "center" },
  tileDesc: { fontSize: 11, textAlign: "center", lineHeight: 15 },
  tileDate: { fontSize: 10, color: "rgba(255,255,255,0.6)", marginTop: 2 },
  lockBadge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginTop: 2 },
  lockText: { fontSize: 10, fontWeight: "600" },
});
