/**
 * Time Manager screen
 * Lets users schedule tasks and hobby sessions, view them by day,
 * mark them complete, and toggle the daily hobby reminder.
 */
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  Switch,
  TouchableOpacity,
} from "react-native";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useTime } from "../../context/TimeContext";
import { useProfile } from "../../context/ProfileContext";
import SwipeableTab from "../../components/SwipeableTab";
import { Task } from "../../types/Task";

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function tomorrowISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function formatDate(iso: string): string {
  const today = todayISO();
  const tomorrow = tomorrowISO();
  if (iso === today) return "Today";
  if (iso === tomorrow) return "Tomorrow";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

type TaskRowProps = {
  task: Task;
  colors: ReturnType<typeof useTheme>["colors"];
  onToggle: () => void;
  onDelete: () => void;
};

function TaskRow({ task, colors, onToggle, onDelete }: TaskRowProps) {
  return (
    <View
      style={[
        styles.taskRow,
        { backgroundColor: colors.card, borderColor: colors.border },
        task.completed && { opacity: 0.55 },
      ]}
    >
      <TouchableOpacity onPress={onToggle} style={styles.checkbox}>
        <Ionicons
          name={task.completed ? "checkmark-circle" : "ellipse-outline"}
          size={24}
          color={task.completed ? colors.primary : colors.tabBarInactive}
        />
      </TouchableOpacity>

      <View style={styles.taskInfo}>
        <Text
          style={[
            styles.taskTitle,
            { color: colors.text },
            task.completed && styles.strikethrough,
          ]}
        >
          {task.title}
        </Text>
        <View style={styles.taskMeta}>
          <View
            style={[
              styles.typeBadge,
              { backgroundColor: task.type === "hobby" ? "#fc727322" : colors.secondary + "40" },
            ]}
          >
            <Text
              style={[
                styles.typeBadgeText,
                { color: task.type === "hobby" ? colors.primary : colors.accent },
              ]}
            >
              {task.type === "hobby" ? "Hobby" : "Task"}
            </Text>
          </View>
          <Text style={[styles.taskTime, { color: colors.secondaryText }]}>
            {formatTime(task.time)}
          </Text>
          <Text style={[styles.taskDuration, { color: colors.secondaryText }]}>
            {task.duration} min
          </Text>
        </View>
      </View>

      <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
        <Ionicons name="trash-outline" size={18} color={colors.danger} />
      </TouchableOpacity>
    </View>
  );
}

// ── Day selector strip ────────────────────────────────────────────────────────

function buildWeekDays(): string[] {
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

type DayStripProps = {
  selected: string;
  onSelect: (iso: string) => void;
  colors: ReturnType<typeof useTheme>["colors"];
  taskCounts: Record<string, number>;
};

function DayStrip({ selected, onSelect, colors, taskCounts }: DayStripProps) {
  const days = buildWeekDays();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.dayStrip}
    >
      {days.map((iso) => {
        const d = new Date(iso + "T00:00:00");
        const isSelected = iso === selected;
        const count = taskCounts[iso] ?? 0;
        return (
          <TouchableOpacity
            key={iso}
            onPress={() => onSelect(iso)}
            style={[
              styles.dayItem,
              isSelected && { backgroundColor: colors.primary },
              !isSelected && { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
            ]}
          >
            <Text style={[styles.dayName, { color: isSelected ? "#fff" : colors.secondaryText }]}>
              {d.toLocaleDateString(undefined, { weekday: "short" })}
            </Text>
            <Text style={[styles.dayNum, { color: isSelected ? "#fff" : colors.text }]}>
              {d.getDate()}
            </Text>
            {count > 0 && (
              <View
                style={[
                  styles.dayDot,
                  { backgroundColor: isSelected ? "#fff" : colors.primary },
                ]}
              />
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// ── Add Task Modal ────────────────────────────────────────────────────────────

type AddTaskModalProps = {
  visible: boolean;
  onClose: () => void;
  onAdd: (task: Omit<Task, "id" | "createdAt">) => void;
  defaultDate: string;
  colors: ReturnType<typeof useTheme>["colors"];
  hobbies: string[];
};

function AddTaskModal({ visible, onClose, onAdd, defaultDate, colors, hobbies }: AddTaskModalProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"task" | "hobby">("task");
  const [time, setTime] = useState("09:00");
  const [duration, setDuration] = useState("30");

  function handleAdd() {
    if (!title.trim()) return;
    onAdd({
      title: title.trim(),
      type,
      date: defaultDate,
      time,
      duration: parseInt(duration, 10) || 30,
      completed: false,
    });
    setTitle("");
    setType("task");
    setTime("09:00");
    setDuration("30");
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
          <View style={styles.modalHandle} />
          <Text style={[styles.modalTitle, { color: colors.text }]}>Add to Schedule</Text>

          <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>Title</Text>
          <TextInput
            style={[styles.modalInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
            placeholder="e.g. Practice guitar, Finish homework"
            placeholderTextColor={colors.secondaryText}
            value={title}
            onChangeText={setTitle}
          />

          <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>Type</Text>
          <View style={styles.typeRow}>
            {(["task", "hobby"] as const).map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setType(t)}
                style={[
                  styles.typeBtn,
                  { borderColor: colors.border },
                  type === t && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
              >
                <Ionicons
                  name={t === "hobby" ? "star-outline" : "checkbox-outline"}
                  size={16}
                  color={type === t ? "#fff" : colors.secondaryText}
                  style={{ marginRight: 4 }}
                />
                <Text style={{ color: type === t ? "#fff" : colors.text, fontWeight: "600", textTransform: "capitalize" }}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {hobbies.length > 0 && type === "hobby" && (
            <>
              <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>Quick-fill from your hobbies</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {hobbies.map((h) => (
                  <TouchableOpacity
                    key={h}
                    onPress={() => setTitle(h)}
                    style={[styles.hobbyChip, { backgroundColor: colors.secondary + "50", borderColor: colors.border }]}
                  >
                    <Text style={{ color: colors.text, fontSize: 13 }}>{h}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          <View style={styles.timeRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>Time (HH:MM)</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
                placeholder="09:00"
                placeholderTextColor={colors.secondaryText}
                value={time}
                onChangeText={setTime}
                keyboardType="numbers-and-punctuation"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>Duration (min)</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
                placeholder="30"
                placeholderTextColor={colors.secondaryText}
                value={duration}
                onChangeText={setDuration}
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.modalCancelBtn, { borderColor: colors.border }]}
            >
              <Text style={{ color: colors.secondaryText, fontWeight: "600" }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleAdd}
              style={[styles.modalAddBtn, { backgroundColor: colors.primary }, !title.trim() && { opacity: 0.4 }]}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function TimeManagerScreen() {
  const { colors } = useTheme();
  const { tasks, addTask, deleteTask, toggleComplete, dailyReminderEnabled, setDailyReminderEnabled, showDailyBanner, dismissDailyBanner } = useTime();
  const { profile } = useProfile();

  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [modalVisible, setModalVisible] = useState(false);

  const dayTasks = tasks
    .filter((t) => t.date === selectedDate)
    .sort((a, b) => a.time.localeCompare(b.time));

  const taskCounts: Record<string, number> = {};
  tasks.forEach((t) => {
    taskCounts[t.date] = (taskCounts[t.date] ?? 0) + 1;
  });

  const completedToday = dayTasks.filter((t) => t.completed).length;
  const totalToday = dayTasks.length;

  return (
    <SwipeableTab tabIndex={1} backgroundColor={colors.background}>
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>My Schedule</Text>
          <Text style={[styles.headerSub, { color: colors.secondaryText }]}>
            {formatDate(todayISO())} · {new Date().toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Daily Reminder Banner */}
        {showDailyBanner && (
          <View style={[styles.reminderBanner, { backgroundColor: colors.primary + "18", borderColor: colors.primary }]}>
            <Ionicons name="alarm-outline" size={22} color={colors.primary} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.bannerTitle, { color: colors.primary }]}>Daily Hobby Reminder!</Text>
              <Text style={[styles.bannerBody, { color: colors.text }]}>
                Take 5–10 minutes today to do something you love. Small steps build great habits!
              </Text>
            </View>
            <TouchableOpacity onPress={dismissDailyBanner}>
              <Ionicons name="close" size={18} color={colors.secondaryText} />
            </TouchableOpacity>
          </View>
        )}

        {/* Reminder Toggle */}
        <View style={[styles.reminderToggleRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.reminderToggleLeft}>
            <Ionicons name="notifications-outline" size={20} color={colors.primary} style={{ marginRight: 10 }} />
            <View>
              <Text style={[styles.reminderToggleLabel, { color: colors.text }]}>Daily Hobby Reminder</Text>
              <Text style={[styles.reminderToggleSub, { color: colors.secondaryText }]}>
                Get a nudge each day to practice your hobby
              </Text>
            </View>
          </View>
          <Switch
            value={dailyReminderEnabled}
            onValueChange={setDailyReminderEnabled}
            trackColor={{ false: colors.border, true: colors.primary + "80" }}
            thumbColor={dailyReminderEnabled ? colors.primary : colors.secondaryText}
          />
        </View>

        {/* Day Strip */}
        <View style={styles.sectionPad}>
          <DayStrip
            selected={selectedDate}
            onSelect={setSelectedDate}
            colors={colors}
            taskCounts={taskCounts}
          />
        </View>

        {/* Progress for selected day */}
        {totalToday > 0 && (
          <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.progressTop}>
              <Text style={[styles.progressLabel, { color: colors.text }]}>
                {formatDate(selectedDate)} — {completedToday}/{totalToday} done
              </Text>
              <Text style={[styles.progressPct, { color: colors.primary }]}>
                {Math.round((completedToday / totalToday) * 100)}%
              </Text>
            </View>
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressFill,
                  { backgroundColor: colors.primary, width: `${(completedToday / totalToday) * 100}%` as any },
                ]}
              />
            </View>
          </View>
        )}

        {/* Task list */}
        <View style={styles.sectionPad}>
          {dayTasks.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="calendar-outline" size={40} color={colors.secondaryText} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Nothing scheduled</Text>
              <Text style={[styles.emptyBody, { color: colors.secondaryText }]}>
                Tap + to add a task or hobby session for {formatDate(selectedDate).toLowerCase()}.
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(true)}
                style={[styles.emptyAddBtn, { backgroundColor: colors.primary }]}
              >
                <Ionicons name="add" size={16} color="#fff" style={{ marginRight: 4 }} />
                <Text style={{ color: "#fff", fontWeight: "600" }}>Add Activity</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {dayTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  colors={colors}
                  onToggle={() => toggleComplete(task.id)}
                  onDelete={() => deleteTask(task.id)}
                />
              ))}
            </>
          )}
        </View>

        {/* Upcoming hobbies from profile */}
        {profile.hobbies.length > 0 && (
          <View style={styles.sectionPad}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Hobbies</Text>
            <Text style={[styles.sectionSub, { color: colors.secondaryText }]}>
              Tap any hobby to quickly add a 30-min session today.
            </Text>
            <View style={styles.hobbyChips}>
              {profile.hobbies.map((h) => (
                <TouchableOpacity
                  key={h}
                  onPress={() =>
                    addTask({
                      title: h,
                      type: "hobby",
                      date: selectedDate,
                      time: "16:00",
                      duration: 30,
                      completed: false,
                    })
                  }
                  style={[styles.quickHobbyChip, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "40" }]}
                >
                  <Ionicons name="star-outline" size={14} color={colors.primary} style={{ marginRight: 4 }} />
                  <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 13 }}>{h}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <AddTaskModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAdd={addTask}
        defaultDate={selectedDate}
        colors={colors}
        hobbies={profile.hobbies}
      />
    </SafeAreaView>
    </SwipeableTab>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  headerSub: { fontSize: 13, marginTop: 2 },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  reminderBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    margin: 16,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  bannerTitle: { fontWeight: "700", fontSize: 14, marginBottom: 2 },
  bannerBody: { fontSize: 13, lineHeight: 18 },
  reminderToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginBottom: 4,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  reminderToggleLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  reminderToggleLabel: { fontWeight: "600", fontSize: 14 },
  reminderToggleSub: { fontSize: 12, marginTop: 1 },
  sectionPad: { paddingHorizontal: 16, marginTop: 16 },
  sectionTitle: { fontSize: 17, fontWeight: "700", marginBottom: 4 },
  sectionSub: { fontSize: 13, marginBottom: 10 },
  dayStrip: { paddingBottom: 4 },
  dayItem: {
    width: 56,
    height: 72,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  dayName: { fontSize: 11, fontWeight: "500", marginBottom: 2 },
  dayNum: { fontSize: 20, fontWeight: "700" },
  dayDot: { width: 5, height: 5, borderRadius: 3, marginTop: 3 },
  progressCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  progressTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  progressLabel: { fontSize: 14, fontWeight: "600" },
  progressPct: { fontSize: 14, fontWeight: "700" },
  progressBar: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  checkbox: { marginRight: 12 },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: 15, fontWeight: "600", marginBottom: 4 },
  strikethrough: { textDecorationLine: "line-through" },
  taskMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  typeBadgeText: { fontSize: 11, fontWeight: "700" },
  taskTime: { fontSize: 12 },
  taskDuration: { fontSize: 12 },
  deleteBtn: { padding: 6 },
  emptyCard: {
    alignItems: "center",
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  emptyTitle: { fontSize: 17, fontWeight: "700", marginTop: 12, marginBottom: 6 },
  emptyBody: { textAlign: "center", fontSize: 14, lineHeight: 20, marginBottom: 20 },
  emptyAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  hobbyChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  quickHobbyChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ccc",
    alignSelf: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: "800", marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: "600", marginBottom: 6, marginTop: 4 },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    marginBottom: 8,
  },
  typeRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
  typeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  hobbyChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 8,
  },
  timeRow: { flexDirection: "row" },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 8 },
  modalCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  modalAddBtn: {
    flex: 2,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
});
