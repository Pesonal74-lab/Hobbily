/**
 * Home / Dashboard (tab 0)
 * Matches mockup: "Hey username" greeting, today's schedule card, suggested grid,
 * quick action buttons.
 */
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTheme } from "../../context/ThemeContext";
import { useProfile } from "../../context/ProfileContext";
import { useTime } from "../../context/TimeContext";
import { useProgress } from "../../context/ProgressContext";
import SwipeableTab from "../../components/SwipeableTab";
import { useState, useEffect } from "react";

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayISO() { return new Date().toISOString().slice(0, 10); }

function todayLabel(): string {
  return new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
}

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "pm" : "am";
  return `${h % 12 || 12}:${m.toString().padStart(2, "0")}${ampm}`;
}

// ── Weather (compact) ─────────────────────────────────────────────────────────

type WeatherData = { tempC: string; desc: string; humidity: string };

function useWeatherCompact(city: string) {
  const [data, setData] = useState<WeatherData | null>(null);
  useEffect(() => {
    if (!city) return;
    fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`)
      .then((r) => r.json())
      .then((json) => {
        const cur = json.current_condition?.[0];
        if (!cur) return;
        setData({ tempC: cur.temp_C, desc: cur.weatherDesc?.[0]?.value ?? "", humidity: cur.humidity });
      })
      .catch(() => {});
  }, [city]);
  return data;
}

// ── Suggested people placeholders ─────────────────────────────────────────────

const SUGGESTED = [
  { id: "1", name: "Alex" },
  { id: "2", name: "Maya" },
  { id: "3", name: "Omar" },
  { id: "4", name: "Lena" },
];

// ── Main screen ───────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { colors } = useTheme();
  const { profile } = useProfile();
  const { tasks } = useTime();
  const { currentStreak, streakFreezeAvailable, useStreakFreeze } = useProgress();
  const weather = useWeatherCompact(profile.city);

  const today = todayISO();
  const todayTasks = tasks
    .filter((t) => t.date === today)
    .sort((a, b) => a.time.localeCompare(b.time))
    .slice(0, 4);

  const name = profile.username || "there";

  return (
    <SwipeableTab tabIndex={0} backgroundColor={colors.background}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.greeting, { color: colors.primary }]}>Hey "{name}"</Text>
            {profile.city ? (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={12} color={colors.secondaryText} />
                <Text style={[styles.locationText, { color: colors.secondaryText }]}>{profile.city}</Text>
                {weather && (
                  <Text style={[styles.locationText, { color: colors.secondaryText }]}>
                    {" · "}{weather.tempC}°C
                  </Text>
                )}
              </View>
            ) : null}
          </View>
          <TouchableOpacity onPress={() => router.push("/(tabs)/profile" as any)} style={styles.notifBtn}>
            <Ionicons name="notifications-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

          {/* Today's Schedule card */}
          <View style={[styles.scheduleCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.scheduleTitle, { color: colors.accent }]}>
              Today's Schedule:{" "}
              <Text style={[styles.scheduleDay, { color: colors.primary }]}>{todayLabel()}</Text>
            </Text>

            {todayTasks.length === 0 ? (
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/time-manager" as any)}
                style={[styles.emptySchedule, { backgroundColor: colors.secondary }]}
              >
                <Text style={[{ color: colors.accent, fontWeight: "600", fontSize: 14 }]}>
                  Nothing scheduled — add an activity
                </Text>
              </TouchableOpacity>
            ) : (
              todayTasks.map((t) => (
                <View
                  key={t.id}
                  style={[styles.taskRow, { backgroundColor: t.type === "hobby" ? colors.primary : colors.primary }]}
                >
                  <Text style={styles.taskTitle} numberOfLines={1}>{t.title}</Text>
                  <Text style={styles.taskTime}>
                    {formatTime(t.time)} - {formatTime(
                      `${(parseInt(t.time.split(":")[0]) + Math.floor((t.duration || 60) / 60)).toString().padStart(2, "0")}:${((parseInt(t.time.split(":")[1]) + (t.duration || 60) % 60) % 60).toString().padStart(2, "0")}`
                    )}
                  </Text>
                  <View style={[styles.checkBox, t.completed && styles.checkBoxDone]}>
                    {t.completed && <Ionicons name="checkmark" size={14} color="#22C55E" />}
                  </View>
                </View>
              ))
            )}

            <TouchableOpacity
              onPress={() => router.push("/(tabs)/time-manager" as any)}
              style={[styles.viewPlannerBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
            >
              <Text style={[{ color: colors.primary, fontWeight: "700", fontSize: 13 }]}>Open Planner</Text>
            </TouchableOpacity>
          </View>

          {/* Streak banner */}
          {currentStreak > 0 && (
            <View style={[styles.streakBanner, { backgroundColor: colors.accent }]}>
              <Ionicons name="flame" size={20} color="#fff" />
              <Text style={styles.streakBannerText}>Streak: {currentStreak} days</Text>
              {streakFreezeAvailable && (
                <TouchableOpacity onPress={useStreakFreeze} style={styles.freezeBtn}>
                  <Ionicons name="snow-outline" size={16} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Suggested section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>Suggested</Text>
            <View style={styles.suggestedGrid}>
              {SUGGESTED.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.suggestedCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => router.push("/(tabs)/community" as any)}
                >
                  <View style={[styles.suggestedAvatar, { borderColor: colors.primary }]}>
                    <Ionicons name="person-outline" size={36} color={colors.primary} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Quick actions */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>Quick Actions</Text>
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push("/(tabs)/opportunities" as any)}
              >
                <Ionicons name="search-outline" size={18} color={colors.accent} />
                <Text style={styles.actionBtnText}>Explore</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push("/(tabs)/time-manager" as any)}
              >
                <Ionicons name="time-outline" size={18} color={colors.accent} />
                <Text style={styles.actionBtnText}>Planner</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push("/(tabs)/community" as any)}
              >
                <Ionicons name="chatbubbles-outline" size={18} color={colors.accent} />
                <Text style={styles.actionBtnText}>Community</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push("/feed" as any)}
              >
                <Ionicons name="newspaper-outline" size={18} color={colors.accent} />
                <Text style={styles.actionBtnText}>Feed</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Hobbies */}
          {profile.hobbies.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>Your Hobbies</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {profile.hobbies.map((h) => (
                  <View key={h} style={[styles.hobbyChip, { backgroundColor: colors.primary }]}>
                    <Text style={styles.hobbyChipText}>{h}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </SwipeableTab>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 10,
  },
  greeting: { fontSize: 22, fontWeight: "800" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  locationText: { fontSize: 12 },
  notifBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },

  // Schedule card
  scheduleCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  scheduleTitle: { fontSize: 16, fontWeight: "700" },
  scheduleDay: { fontWeight: "400" },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  taskTitle: { flex: 1, color: "#fff", fontWeight: "600", fontSize: 14 },
  taskTime: { color: "rgba(255,255,255,0.85)", fontSize: 12 },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkBoxDone: { backgroundColor: "rgba(255,255,255,0.9)" },
  emptySchedule: {
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  viewPlannerBtn: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    marginTop: 4,
  },

  // Streak
  streakBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  streakBannerText: { color: "#fff", fontWeight: "700", fontSize: 15, flex: 1 },
  freezeBtn: { padding: 4 },

  // Sections
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "800", marginBottom: 12 },

  // Suggested grid
  suggestedGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  suggestedCard: {
    width: "46%",
    aspectRatio: 1,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  suggestedAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },

  // Action buttons
  actionRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: 12,
  },
  actionBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  // Hobbies
  hobbyChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  hobbyChipText: { color: "#fff", fontWeight: "600", fontSize: 13 },
});
