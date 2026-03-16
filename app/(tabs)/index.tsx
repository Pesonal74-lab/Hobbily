/**
 * Home / Dashboard (tab 0)
 * Greeting, streak card, today's tasks, suggested opportunities, quick actions.
 */
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, Modal, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTheme } from "../../context/ThemeContext";
import { useProfile } from "../../context/ProfileContext";
import { useTime } from "../../context/TimeContext";
import { useProgress } from "../../context/ProgressContext";
import SwipeableTab from "../../components/SwipeableTab";
import TipBanner, { TIP_KEYS } from "../../components/TipBanner";
import { useState, useEffect } from "react";

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayISO() { return new Date().toISOString().slice(0, 10); }

function greeting(name: string): string {
  const h = new Date().getHours();
  const part = h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening";
  return `Good ${part}, ${name || "there"}!`;
}

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

// Opportunities that match user hobbies (subset of OPPORTUNITIES from explore tab)
const QUICK_OPPS = [
  { id: "2", name: "Maktoob Youth Coding Bootcamp", category: "Coding", cost: "Free", location: "Ramallah / Online" },
  { id: "4", name: "Al-Kamandjati Music School", category: "Music", cost: "Free", location: "Ramallah" },
  { id: "1", name: "Youth Photography Workshop", category: "Photography", cost: "Subsidised", location: "Tel Aviv" },
  { id: "3", name: "Football for Peace Academy", category: "Sports", cost: "Free", location: "Various" },
  { id: "5", name: "Young Creators Art Studio", category: "Drawing & Art", cost: "Subsidised", location: "Jerusalem" },
  { id: "10", name: "e-Sports & Game Design Camp", category: "Gaming", cost: "Paid", location: "Haifa" },
  { id: "8", name: "Dance Fusion Workshop", category: "Dance", cost: "Subsidised", location: "Kibbutz Netiv HaL." },
  { id: "9", name: "Kitchen Explorers Cooking Club", category: "Cooking", cost: "Free", location: "Jaffa" },
];

const COST_COLORS: Record<string, string> = { Free: "#10B981", Subsidised: "#2563EB", Paid: "#8B5CF6" };

// ── Weather ───────────────────────────────────────────────────────────────────

type ForecastDay = {
  date: string;
  maxC: string;
  minC: string;
  desc: string;
};

type WeatherData = {
  tempC: string;
  feelsLikeC: string;
  desc: string;
  humidity: string;
  forecast: ForecastDay[];
};

function weatherIcon(desc: string): any {
  const d = desc.toLowerCase();
  if (d.includes("thunder") || d.includes("storm")) return "thunderstorm-outline";
  if (d.includes("snow") || d.includes("blizzard")) return "snow-outline";
  if (d.includes("rain") || d.includes("drizzle") || d.includes("shower")) return "rainy-outline";
  if (d.includes("fog") || d.includes("mist") || d.includes("haze")) return "partly-sunny-outline";
  if (d.includes("cloud") || d.includes("overcast")) return "cloudy-outline";
  if (d.includes("sunny") || d.includes("clear")) return "sunny-outline";
  return "cloud-outline";
}

function forecastLabel(dateStr: string, index: number): string {
  if (index === 0) return "Today";
  if (index === 1) return "Tomorrow";
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const d = new Date(dateStr + "T00:00:00");
  return days[d.getDay()];
}

function useWeather(city: string) {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!city) return;
    setLoading(true);
    setError(false);
    fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`)
      .then((r) => r.json())
      .then((json) => {
        const cur = json.current_condition?.[0];
        if (!cur) { setError(true); return; }
        const forecast: ForecastDay[] = (json.weather ?? []).map((day: any) => ({
          date: day.date,
          maxC: day.maxtempC,
          minC: day.mintempC,
          // noon slot (index 4 in 3-hour intervals) gives the day's dominant condition
          desc: day.hourly?.[4]?.weatherDesc?.[0]?.value ?? day.hourly?.[0]?.weatherDesc?.[0]?.value ?? "Unknown",
        }));
        setData({
          tempC: cur.temp_C,
          feelsLikeC: cur.FeelsLikeC,
          desc: cur.weatherDesc?.[0]?.value ?? "Unknown",
          humidity: cur.humidity,
          forecast,
        });
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [city]);

  return { data, loading, error };
}

function WeatherCard({ city, colors }: { city: string; colors: any }) {
  const { data, loading, error } = useWeather(city);
  const [expanded, setExpanded] = useState(false);
  if (!city) return null;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => data && setExpanded((v) => !v)}
      style={[styles.weatherCard, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      {loading ? (
        <View style={styles.weatherRow}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.weatherMeta, { color: colors.secondaryText }]}>Fetching weather…</Text>
        </View>
      ) : error || !data ? (
        <View style={styles.weatherRow}>
          <Ionicons name="cloud-offline-outline" size={18} color={colors.secondaryText} />
          <Text style={[styles.weatherMeta, { color: colors.secondaryText }]}>Weather unavailable</Text>
        </View>
      ) : (
        <>
          {/* ── Current conditions ── */}
          <View style={styles.weatherRow}>
            <Ionicons name={weatherIcon(data.desc)} size={40} color={colors.primary} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.weatherCity, { color: colors.secondaryText }]}>{city}</Text>
              <Text style={[styles.weatherDesc, { color: colors.text }]}>{data.desc}</Text>
              <Text style={[styles.weatherMeta, { color: colors.secondaryText }]}>
                Humidity {data.humidity}%
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={[styles.weatherTemp, { color: colors.text }]}>{data.tempC}°C</Text>
              <Text style={[styles.weatherMeta, { color: colors.secondaryText }]}>
                Feels {data.feelsLikeC}°
              </Text>
            </View>
            <Ionicons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={16}
              color={colors.secondaryText}
              style={{ marginLeft: 8, alignSelf: "center" }}
            />
          </View>

          {/* ── 3-day forecast ── */}
          {expanded && data.forecast.length > 0 && (
            <>
              <View style={[styles.weatherDivider, { backgroundColor: colors.border }]} />
              {data.forecast.map((day, i) => (
                <View key={day.date} style={styles.forecastRow}>
                  <Text style={[styles.forecastDay, { color: colors.text }]}>
                    {forecastLabel(day.date, i)}
                  </Text>
                  <Ionicons
                    name={weatherIcon(day.desc)}
                    size={18}
                    color={colors.primary}
                    style={{ marginHorizontal: 8 }}
                  />
                  <Text style={[styles.forecastDesc, { color: colors.secondaryText }]} numberOfLines={1}>
                    {day.desc}
                  </Text>
                  <Text style={[styles.forecastRange, { color: colors.text }]}>
                    {day.maxC}° / {day.minC}°
                  </Text>
                </View>
              ))}
            </>
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StreakCard({ streak, sessions, minutes, freeze, onFreeze, colors }: {
  streak: number; sessions: number; minutes: number;
  freeze: boolean; onFreeze: () => void; colors: any;
}) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return (
    <View style={[styles.streakCard, { backgroundColor: colors.primary }]}>
      <View style={styles.streakLeft}>
        <View style={styles.streakFlameRow}>
          <Ionicons name="flame" size={28} color="#FCD34D" />
          <Text style={styles.streakNum}>{streak}</Text>
        </View>
        <Text style={styles.streakLabel}>day streak</Text>
      </View>
      <View style={styles.streakDivider} />
      <View style={styles.streakStats}>
        <View style={styles.streakStat}>
          <Text style={styles.streakStatNum}>{sessions}</Text>
          <Text style={styles.streakStatLabel}>sessions</Text>
        </View>
        <View style={styles.streakStat}>
          <Text style={styles.streakStatNum}>{hours > 0 ? `${hours}h ${mins}m` : `${mins}m`}</Text>
          <Text style={styles.streakStatLabel}>practiced</Text>
        </View>
      </View>
      {freeze && (
        <TouchableOpacity onPress={onFreeze} style={styles.freezeBtn}>
          <Ionicons name="snow-outline" size={16} color="#93C5FD" />
        </TouchableOpacity>
      )}
    </View>
  );
}

function TodayTaskRow({ title, time, completed, type, colors }: { title: string; time: string; completed: boolean; type: string; colors: any }) {
  return (
    <View style={[styles.todayTask, { backgroundColor: colors.card, borderColor: colors.border, opacity: completed ? 0.55 : 1 }]}>
      <View style={[styles.todayTaskDot, { backgroundColor: type === "hobby" ? colors.primary : colors.accent }]} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.todayTaskTitle, { color: colors.text }, completed && { textDecorationLine: "line-through" }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.todayTaskTime, { color: colors.secondaryText }]}>{formatTime(time)}</Text>
      </View>
      {completed && <Ionicons name="checkmark-circle" size={18} color={colors.success} />}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { colors } = useTheme();
  const { profile } = useProfile();
  const { tasks } = useTime();
  const { currentStreak, totalSessions, totalMinutes, streakFreezeAvailable, useStreakFreeze } = useProgress();
  const [notifVisible, setNotifVisible] = useState(false);

  const today = todayISO();
  const todayTasks = tasks
    .filter((t) => t.date === today)
    .sort((a, b) => a.time.localeCompare(b.time))
    .slice(0, 4);

  const completedToday = todayTasks.filter((t) => t.completed).length;

  // Suggested opportunities matched to hobbies
  const suggested = profile.hobbies.length > 0
    ? QUICK_OPPS.filter((o) => profile.hobbies.some((h) => o.category.toLowerCase().includes(h.toLowerCase()) || h.toLowerCase().includes(o.category.toLowerCase()))).slice(0, 2)
    : QUICK_OPPS.slice(0, 2);

  return (
    <SwipeableTab tabIndex={0} backgroundColor={colors.background}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.greeting, { color: colors.text }]}>{greeting(profile.username)}</Text>
            {profile.city ? (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={13} color={colors.secondaryText} />
                <Text style={[styles.locationText, { color: colors.secondaryText }]}>{profile.city}</Text>
              </View>
            ) : null}
          </View>
          <TouchableOpacity onPress={() => setNotifVisible(true)} style={[styles.notifBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="notifications-outline" size={20} color={colors.text} />
          </TouchableOpacity>
          <Image source={require("../../assets/images/Hobbily_Logo.png")} style={styles.headerLogo} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

          <TipBanner
            storageKey={TIP_KEYS.feedFirstPost}
            text="Share what you've been practicing! Tap the pencil button to create your first post."
            icon="create-outline"
            colors={colors}
          />

          {/* Weather */}
          <WeatherCard city={profile.city} colors={colors} />

          {/* Streak card */}
          <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
            <StreakCard
              streak={currentStreak}
              sessions={totalSessions}
              minutes={totalMinutes}
              freeze={streakFreezeAvailable}
              onFreeze={useStreakFreeze}
              colors={colors}
            />
          </View>

          {/* Today's schedule */}
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's Schedule</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/time-manager")}>
                <Text style={[styles.sectionLink, { color: colors.primary }]}>View all</Text>
              </TouchableOpacity>
            </View>

            {todayTasks.length === 0 ? (
              <View style={[styles.emptyToday, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="checkmark-done-circle-outline" size={32} color={colors.success} />
                <Text style={[styles.emptyTodayText, { color: colors.secondaryText }]}>
                  Nothing scheduled today — {"\n"}
                  <Text style={{ color: colors.primary, fontWeight: "700" }} onPress={() => router.push("/(tabs)/time-manager")}>
                    Add an activity
                  </Text>
                </Text>
              </View>
            ) : (
              <>
                {todayTasks.map((t) => (
                  <TodayTaskRow key={t.id} title={t.title} time={t.time} completed={t.completed} type={t.type} colors={colors} />
                ))}
                {completedToday > 0 && (
                  <View style={[styles.progressMini, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={[styles.progressMiniBar, { backgroundColor: colors.border }]}>
                      <View style={[styles.progressMiniFill, { backgroundColor: colors.success, width: `${(completedToday / todayTasks.length) * 100}%` as any }]} />
                    </View>
                    <Text style={[styles.progressMiniText, { color: colors.secondaryText }]}>
                      {completedToday}/{todayTasks.length} done today
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>

          {/* Quick actions */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
            <View style={styles.quickActions}>
              {[
                { icon: "add-circle-outline" as const, label: "Add Task", action: () => router.push("/(tabs)/time-manager"), color: colors.primary },
                { icon: "compass-outline" as const, label: "Explore", action: () => router.push("/(tabs)/opportunities"), color: "#8B5CF6" },
                { icon: "chatbubbles-outline" as const, label: "Community", action: () => router.push("/(tabs)/community"), color: "#10B981" },
                { icon: "newspaper-outline" as const, label: "Feed", action: () => router.push("/feed" as any), color: "#F59E0B" },
              ].map((a) => (
                <TouchableOpacity key={a.label} onPress={a.action} style={[styles.quickAction, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.quickActionIcon, { backgroundColor: a.color + "18" }]}>
                    <Ionicons name={a.icon} size={22} color={a.color} />
                  </View>
                  <Text style={[styles.quickActionLabel, { color: colors.text }]}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Suggested opportunities */}
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Suggested for You</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/opportunities")}>
                <Text style={[styles.sectionLink, { color: colors.primary }]}>See all</Text>
              </TouchableOpacity>
            </View>
            {suggested.map((opp) => (
              <TouchableOpacity
                key={opp.id}
                onPress={() => router.push("/(tabs)/opportunities")}
                style={[styles.oppCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.oppName, { color: colors.text }]} numberOfLines={1}>{opp.name}</Text>
                  <View style={styles.oppMeta}>
                    <Ionicons name="location-outline" size={12} color={colors.secondaryText} />
                    <Text style={[styles.oppLocation, { color: colors.secondaryText }]}>{opp.location}</Text>
                  </View>
                </View>
                <View style={[styles.costChip, { backgroundColor: COST_COLORS[opp.cost] + "18" }]}>
                  <Text style={[styles.costText, { color: COST_COLORS[opp.cost] }]}>{opp.cost}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Your hobbies */}
          {profile.hobbies.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Hobbies</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {profile.hobbies.map((h) => (
                  <View key={h} style={[styles.hobbyChip, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Ionicons name="star-outline" size={13} color={colors.primary} style={{ marginRight: 4 }} />
                    <Text style={[styles.hobbyChipText, { color: colors.text }]}>{h}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </ScrollView>

        {/* Notification modal (placeholder) */}
        <Modal visible={notifVisible} transparent animationType="fade" onRequestClose={() => setNotifVisible(false)}>
          <TouchableOpacity style={styles.modalOverlay} onPress={() => setNotifVisible(false)}>
            <View style={[styles.notifModal, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="notifications-outline" size={32} color={colors.secondaryText} style={{ marginBottom: 8 }} />
              <Text style={[{ color: colors.text, fontWeight: "700", fontSize: 16, marginBottom: 6 }]}>Push Notifications</Text>
              <Text style={[{ color: colors.secondaryText, textAlign: "center", fontSize: 14 }]}>
                Push notifications are coming in Phase 2!{"\n"}Stay tuned.
              </Text>
              <TouchableOpacity onPress={() => setNotifVisible(false)} style={[styles.notifClose, { backgroundColor: colors.primary }]}>
                <Text style={{ color: "#fff", fontWeight: "700" }}>Got it</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
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
    borderBottomWidth: 1,
    gap: 10,
  },
  greeting: { fontSize: 22, fontWeight: "800", letterSpacing: -0.3 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  locationText: { fontSize: 12 },
  notifBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  headerLogo: { width: 36, height: 36, resizeMode: "contain" },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: "700" },
  sectionLink: { fontSize: 13, fontWeight: "600" },
  // Streak
  streakCard: { borderRadius: 18, padding: 18, flexDirection: "row", alignItems: "center" },
  streakLeft: { alignItems: "center", minWidth: 70 },
  streakFlameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  streakNum: { color: "#fff", fontSize: 36, fontWeight: "900" },
  streakLabel: { color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 2 },
  streakDivider: { width: 1, height: 50, backgroundColor: "rgba(255,255,255,0.3)", marginHorizontal: 16 },
  streakStats: { flex: 1, flexDirection: "row", gap: 16 },
  streakStat: { alignItems: "center" },
  streakStatNum: { color: "#fff", fontSize: 18, fontWeight: "800" },
  streakStatLabel: { color: "rgba(255,255,255,0.7)", fontSize: 11 },
  freezeBtn: { padding: 6 },
  // Today tasks
  todayTask: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8, gap: 10 },
  todayTaskDot: { width: 8, height: 8, borderRadius: 4 },
  todayTaskTitle: { fontSize: 14, fontWeight: "600" },
  todayTaskTime: { fontSize: 12, marginTop: 1 },
  emptyToday: { padding: 20, borderRadius: 14, borderWidth: 1, alignItems: "center", gap: 8 },
  emptyTodayText: { fontSize: 14, textAlign: "center", lineHeight: 22 },
  progressMini: { padding: 10, borderRadius: 10, borderWidth: 1, marginTop: 4, gap: 6 },
  progressMiniBar: { height: 5, borderRadius: 3, overflow: "hidden" },
  progressMiniFill: { height: "100%", borderRadius: 3 },
  progressMiniText: { fontSize: 12, textAlign: "right" },
  // Quick actions
  quickActions: { flexDirection: "row", gap: 10 },
  quickAction: { flex: 1, alignItems: "center", padding: 12, borderRadius: 14, borderWidth: 1, gap: 6 },
  quickActionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  quickActionLabel: { fontSize: 11, fontWeight: "600", textAlign: "center" },
  // Opportunities
  oppCard: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8, gap: 10 },
  oppName: { fontSize: 14, fontWeight: "700", marginBottom: 3 },
  oppMeta: { flexDirection: "row", alignItems: "center", gap: 3 },
  oppLocation: { fontSize: 12 },
  costChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  costText: { fontSize: 11, fontWeight: "700" },
  // Hobbies
  hobbyChip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  hobbyChipText: { fontSize: 13, fontWeight: "600" },
  // Weather
  weatherCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  weatherRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  weatherCity: { fontSize: 12, marginBottom: 1 },
  weatherDesc: { fontSize: 15, fontWeight: "700" },
  weatherMeta: { fontSize: 12, marginTop: 2 },
  weatherTemp: { fontSize: 30, fontWeight: "900" },
  weatherDivider: { height: 1, marginTop: 12, marginBottom: 8 },
  forecastRow: { flexDirection: "row", alignItems: "center", paddingVertical: 6 },
  forecastDay: { width: 76, fontSize: 13, fontWeight: "700" },
  forecastDesc: { flex: 1, fontSize: 12 },
  forecastRange: { fontSize: 13, fontWeight: "700", marginLeft: 8 },
  // Notification modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  notifModal: { width: 280, padding: 24, borderRadius: 20, borderWidth: 1, alignItems: "center" },
  notifClose: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
});
