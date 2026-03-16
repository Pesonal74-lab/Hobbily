/**
 * Profile screen — overview hub.
 * Shows avatar, stats, compact interest chips, and navigation rows.
 * All editing / detailed views are pushed as separate screens.
 */
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTheme } from "../../context/ThemeContext";
import { useProfile } from "../../context/ProfileContext";
import { useProgress } from "../../context/ProgressContext";
import SwipeableTab from "../../components/SwipeableTab";

// ── Nav Row ───────────────────────────────────────────────────────────────────
function NavRow({
  icon, label, sublabel, onPress, colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sublabel?: string;
  onPress: () => void;
  colors: any;
}) {
  return (
    <TouchableOpacity
      style={[styles.navRow, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Ionicons name={icon} size={22} color={colors.primary} style={styles.navRowIcon} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.navRowLabel, { color: colors.primary }]}>{label}</Text>
        {sublabel ? (
          <Text style={[styles.navRowSub, { color: colors.secondaryText }]}>{sublabel}</Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.secondaryText} />
    </TouchableOpacity>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const { colors } = useTheme();
  const { profile } = useProfile();
  const { currentStreak, totalSessions, totalMinutes, achievements } = useProgress();

  const practiceHours = Math.floor(totalMinutes / 60);
  const practiceMin = totalMinutes % 60;
  const practiceLabel = practiceHours > 0
    ? `${practiceHours}h ${practiceMin}m`
    : totalMinutes > 0 ? `${totalMinutes}m` : "0m";

  return (
    <SwipeableTab tabIndex={2} backgroundColor={colors.background}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

          {/* Avatar + name */}
          <View style={styles.avatarSection}>
            <View style={[styles.avatarCircle, { borderColor: colors.primary }]}>
              <Ionicons name="person-outline" size={52} color={colors.primary} />
            </View>
            <Text style={[styles.heroName, { color: colors.primary }]}>
              {profile.username || "Your Name"}
            </Text>
            {profile.city ? (
              <View style={styles.cityRow}>
                <Ionicons name="location-outline" size={13} color={colors.secondaryText} />
                <Text style={[styles.cityText, { color: colors.secondaryText }]}>{profile.city}</Text>
              </View>
            ) : null}
          </View>

          {/* Stats row */}
          <View style={[styles.statsRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {[
              { label: "Streak", value: `${currentStreak}d`, icon: "flame-outline" as const },
              { label: "Sessions", value: `${totalSessions}`, icon: "checkmark-circle-outline" as const },
              { label: "Practice", value: practiceLabel, icon: "time-outline" as const },
              { label: "Badges", value: `${achievements.length}/7`, icon: "trophy-outline" as const },
            ].map((s, i, arr) => (
              <View key={s.label} style={[styles.statItem, i < arr.length - 1 && { borderRightWidth: 1, borderRightColor: colors.border }]}>
                <Ionicons name={s.icon} size={16} color={colors.accent} />
                <Text style={[styles.statValue, { color: colors.primary }]}>{s.value}</Text>
                <Text style={[styles.statLabel, { color: colors.secondaryText }]}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* My Interests card */}
          <View style={[styles.interestsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.interestsHeader}>
              <Text style={[styles.interestsTitle, { color: colors.primary }]}>My Interests</Text>
              <TouchableOpacity
                onPress={() => router.push("/edit-hobbies")}
                style={[styles.editChip, { backgroundColor: colors.secondary, borderColor: colors.border }]}
              >
                <Ionicons name="pencil-outline" size={13} color={colors.primary} />
                <Text style={[styles.editChipText, { color: colors.primary }]}>Edit</Text>
              </TouchableOpacity>
            </View>

            {profile.hobbies.length === 0 ? (
              <TouchableOpacity
                onPress={() => router.push("/edit-hobbies")}
                style={[styles.noHobbiesBtn, { backgroundColor: colors.secondary }]}
              >
                <Text style={[styles.noHobbiesText, { color: colors.primary }]}>
                  + Add your first hobby
                </Text>
              </TouchableOpacity>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsScroll}
              >
                {profile.hobbies.map((h) => (
                  <View key={h} style={[styles.hobbyChip, { backgroundColor: colors.primary }]}>
                    <Text style={styles.hobbyChipText}>{h}</Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Streak banner (only when active) */}
          {currentStreak > 0 && (
            <View style={[styles.streakBanner, { backgroundColor: colors.accent }]}>
              <Ionicons name="flame" size={18} color="#fff" />
              <Text style={styles.streakBannerText}>{currentStreak}-day streak — keep it going!</Text>
            </View>
          )}

          {/* Navigation menu */}
          <View style={styles.menuSection}>
            <NavRow
              icon="person-outline"
              label="Edit Profile"
              sublabel="Name, age, city, bio"
              onPress={() => router.push("/edit-profile")}
              colors={colors}
            />
            <NavRow
              icon="newspaper-outline"
              label="My Posts"
              sublabel="View and manage your posts"
              onPress={() => router.push("/my-posts")}
              colors={colors}
            />
            <NavRow
              icon="trophy-outline"
              label="Achievements"
              sublabel={`${achievements.length} of 7 earned`}
              onPress={() => router.push("/achievements")}
              colors={colors}
            />
            <NavRow
              icon="settings-outline"
              label="Settings"
              sublabel="Theme, reminders, account"
              onPress={() => router.push("/settings")}
              colors={colors}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </SwipeableTab>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Avatar
  avatarSection: { alignItems: "center", paddingTop: 28, paddingBottom: 16 },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  heroName: { fontSize: 22, fontWeight: "800", marginBottom: 4 },
  cityRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  cityText: { fontSize: 13 },

  // Stats
  statsRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    gap: 3,
  },
  statValue: { fontSize: 17, fontWeight: "800" },
  statLabel: { fontSize: 11, fontWeight: "600" },

  // Interests
  interestsCard: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  interestsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  interestsTitle: { fontSize: 15, fontWeight: "700" },
  editChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  editChipText: { fontSize: 12, fontWeight: "700" },
  chipsScroll: { gap: 8 },
  hobbyChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  hobbyChipText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  noHobbiesBtn: {
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  noHobbiesText: { fontWeight: "600", fontSize: 14 },

  // Streak banner
  streakBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
  },
  streakBannerText: { color: "#fff", fontWeight: "700", fontSize: 14, flex: 1 },

  // Nav menu
  menuSection: { marginHorizontal: 16, marginTop: 16, gap: 10 },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  navRowIcon: { marginRight: 14 },
  navRowLabel: { fontSize: 15, fontWeight: "700" },
  navRowSub: { fontSize: 12, marginTop: 2 },
});
