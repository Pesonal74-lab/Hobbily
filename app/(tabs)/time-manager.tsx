/**
 * Time Manager screen
 * Lets users schedule tasks and hobby sessions, view them by day,
 * mark them complete, edit, and toggle the daily hobby reminder.
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
  Animated,
  PanResponder,
  TouchableWithoutFeedback,
} from "react-native";
import { useState, useEffect, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTheme } from "../../context/ThemeContext";
import { useTime } from "../../context/TimeContext";
import { useProfile } from "../../context/ProfileContext";
import { useProgress } from "../../context/ProgressContext";
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

// ── Task Row ──────────────────────────────────────────────────────────────────

type TaskRowProps = {
  task: Task;
  colors: ReturnType<typeof useTheme>["colors"];
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

function TaskRow({ task, colors, onToggle, onEdit, onDelete }: TaskRowProps) {
  const isHobby = task.type === "hobby";
  return (
    <View
      style={[
        styles.taskRow,
        { backgroundColor: colors.card, borderColor: colors.border },
        task.completed && { opacity: 0.55 },
      ]}
    >
      {/* Colour accent bar */}
      <View
        style={[
          styles.taskAccent,
          { backgroundColor: isHobby ? "#fc7273" : "#cacef2" },
        ]}
      />

      <TouchableOpacity onPress={onToggle} style={styles.checkbox}>
        <Ionicons
          name={task.completed ? "checkmark-circle" : "ellipse-outline"}
          size={26}
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
          numberOfLines={1}
        >
          {task.title}
        </Text>
        <View style={styles.taskMeta}>
          <View
            style={[
              styles.typeBadge,
              { backgroundColor: isHobby ? "#fc727322" : colors.secondary + "40" },
            ]}
          >
            <Ionicons
              name={isHobby ? "star" : "checkbox"}
              size={10}
              color={isHobby ? colors.primary : colors.accent}
              style={{ marginRight: 3 }}
            />
            <Text
              style={[
                styles.typeBadgeText,
                { color: isHobby ? colors.primary : colors.accent },
              ]}
            >
              {isHobby ? "Hobby" : "Task"}
            </Text>
          </View>
          <Ionicons name="time-outline" size={12} color={colors.secondaryText} style={{ marginRight: 2 }} />
          <Text style={[styles.taskTime, { color: colors.secondaryText }]}>
            {formatTime(task.time)}
          </Text>
          <Text style={[styles.taskDot, { color: colors.secondaryText }]}>·</Text>
          <Text style={[styles.taskDuration, { color: colors.secondaryText }]}>
            {task.duration} min
          </Text>
        </View>
      </View>

      {/* Edit / Delete */}
      <View style={styles.taskActions}>
        <TouchableOpacity onPress={onEdit} style={styles.actionBtn}>
          <Ionicons name="pencil-outline" size={17} color={colors.accent} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} style={styles.actionBtn}>
          <Ionicons name="trash-outline" size={17} color={colors.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Practice Timer Modal ──────────────────────────────────────────────────────

type TimerModalProps = {
  visible: boolean;
  onClose: () => void;
  onComplete: (minutes: number) => void;
  defaultTitle?: string;
  defaultMinutes?: number;
  colors: ReturnType<typeof useTheme>["colors"];
};

const TIMER_PRESETS = [5, 10, 15, 30, 45, 60];

function PracticeTimerModal({ visible, onClose, onComplete, defaultTitle = "Practice Session", defaultMinutes = 15, colors }: TimerModalProps) {
  const [sessionTitle, setSessionTitle] = useState(defaultTitle);
  const [selectedMinutes, setSelectedMinutes] = useState(defaultMinutes);
  const [secondsLeft, setSecondsLeft] = useState(-1);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!visible) {
      reset();
    } else {
      // Sync props → state each time the modal freshly opens so that a
      // different hobby's title/duration is reflected (useState initial values
      // are only used on mount, not on subsequent renders).
      setSessionTitle(defaultTitle);
      setSelectedMinutes(defaultMinutes);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]); // defaultTitle/defaultMinutes intentionally omitted — sync only on open

  useEffect(() => {
    if (running && secondsLeft > 0) {
      intervalRef.current = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    } else if (running && secondsLeft === 0) {
      clearInterval(intervalRef.current!);
      setRunning(false);
      setDone(true);
    }
    return () => clearInterval(intervalRef.current!);
  }, [running, secondsLeft]);

  function start() { setSecondsLeft(selectedMinutes * 60); setRunning(true); setDone(false); }
  function pause() { setRunning(false); clearInterval(intervalRef.current!); }
  function resume() { setRunning(true); }
  function skip() { clearInterval(intervalRef.current!); setSecondsLeft(0); setRunning(false); setDone(true); }
  function reset() { clearInterval(intervalRef.current!); setSecondsLeft(-1); setRunning(false); setDone(false); }

  const notStarted = secondsLeft === -1;
  const displayMin = notStarted ? selectedMinutes : Math.floor(secondsLeft / 60);
  const displaySec = notStarted ? 0 : secondsLeft % 60;
  const progress = notStarted ? 0 : 1 - secondsLeft / (selectedMinutes * 60);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={tStyles.overlay}>
        <View style={[tStyles.sheet, { backgroundColor: colors.card }]}>
          <View style={tStyles.handle} />

          {done ? (
            <View style={tStyles.doneView}>
              <Ionicons name="checkmark-circle" size={72} color={colors.success} />
              <Text style={[tStyles.doneTitle, { color: colors.text }]}>Session Complete!</Text>
              <Text style={[tStyles.doneSub, { color: colors.secondaryText }]}>
                {selectedMinutes} min of {sessionTitle}
              </Text>
              <TouchableOpacity
                onPress={() => { onComplete(selectedMinutes); onClose(); }}
                style={[tStyles.btn, { backgroundColor: colors.success }]}
              >
                <Ionicons name="trophy-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                <Text style={tStyles.btnText}>Save Progress</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={tStyles.skipBtn}>
                <Text style={[tStyles.skipText, { color: colors.secondaryText }]}>Discard</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={[tStyles.timerTitle, { color: colors.text }]} numberOfLines={1}>{sessionTitle}</Text>

              {notStarted && (
                <>
                  <TextInput
                    style={[tStyles.titleInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                    value={sessionTitle}
                    onChangeText={setSessionTitle}
                    placeholder="Session title"
                    placeholderTextColor={colors.secondaryText}
                  />
                  <Text style={[tStyles.presetLabel, { color: colors.secondaryText }]}>Duration</Text>
                  <View style={tStyles.presets}>
                    {TIMER_PRESETS.map((m) => (
                      <TouchableOpacity
                        key={m}
                        onPress={() => setSelectedMinutes(m)}
                        style={[tStyles.preset, { backgroundColor: selectedMinutes === m ? colors.primary : colors.inputBackground, borderColor: selectedMinutes === m ? colors.primary : colors.border }]}
                      >
                        <Text style={{ color: selectedMinutes === m ? "#fff" : colors.secondaryText, fontWeight: "700", fontSize: 13 }}>{m}m</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* Timer display */}
              <View style={tStyles.timerCircle}>
                <View style={[tStyles.timerCircleInner, { borderColor: notStarted ? colors.border : colors.primary }]}>
                  <Text style={[tStyles.timerTime, { color: colors.text }]}>
                    {String(displayMin).padStart(2, "0")}:{String(displaySec).padStart(2, "0")}
                  </Text>
                  {!notStarted && (
                    <Text style={[tStyles.timerPct, { color: colors.secondaryText }]}>
                      {Math.round(progress * 100)}%
                    </Text>
                  )}
                </View>
              </View>

              {/* Controls */}
              <View style={tStyles.controls}>
                {notStarted && (
                  <TouchableOpacity onPress={start} style={[tStyles.btn, { backgroundColor: colors.primary }]}>
                    <Ionicons name="play" size={18} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={tStyles.btnText}>Start</Text>
                  </TouchableOpacity>
                )}
                {running && (
                  <>
                    <TouchableOpacity onPress={pause} style={[tStyles.btn, { backgroundColor: colors.accent, flex: 1 }]}>
                      <Ionicons name="pause" size={18} color="#fff" style={{ marginRight: 6 }} />
                      <Text style={tStyles.btnText}>Pause</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={skip} style={[tStyles.skipBtn2, { borderColor: colors.border }]}>
                      <Text style={[tStyles.skipText, { color: colors.secondaryText }]}>Skip</Text>
                    </TouchableOpacity>
                  </>
                )}
                {!running && !notStarted && !done && (
                  <>
                    <TouchableOpacity onPress={resume} style={[tStyles.btn, { backgroundColor: colors.primary, flex: 1 }]}>
                      <Ionicons name="play" size={18} color="#fff" style={{ marginRight: 6 }} />
                      <Text style={tStyles.btnText}>Resume</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={skip} style={[tStyles.skipBtn2, { borderColor: colors.border }]}>
                      <Text style={[tStyles.skipText, { color: colors.secondaryText }]}>Done</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>

              <TouchableOpacity onPress={onClose} style={{ alignItems: "center", paddingVertical: 8 }}>
                <Text style={[tStyles.skipText, { color: colors.secondaryText }]}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const tStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 44 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#ccc", alignSelf: "center", marginBottom: 20 },
  timerTitle: { fontSize: 18, fontWeight: "700", textAlign: "center", marginBottom: 12 },
  titleInput: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 12 },
  presetLabel: { fontSize: 13, fontWeight: "600", marginBottom: 8 },
  presets: { flexDirection: "row", gap: 8, marginBottom: 16 },
  preset: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, alignItems: "center" },
  timerCircle: { alignItems: "center", marginVertical: 16 },
  timerCircleInner: { width: 160, height: 160, borderRadius: 80, borderWidth: 4, alignItems: "center", justifyContent: "center" },
  timerTime: { fontSize: 40, fontWeight: "900", letterSpacing: 2 },
  timerPct: { fontSize: 14, marginTop: 4 },
  controls: { flexDirection: "row", gap: 10, marginBottom: 12 },
  btn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, borderRadius: 14 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  skipBtn: { alignItems: "center", paddingVertical: 10 },
  skipBtn2: { paddingHorizontal: 20, paddingVertical: 14, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  skipText: { fontSize: 14, fontWeight: "600" },
  doneView: { alignItems: "center", paddingVertical: 8, gap: 8 },
  doneTitle: { fontSize: 24, fontWeight: "800" },
  doneSub: { fontSize: 14, marginBottom: 8 },
});

// ── Day selector strip ────────────────────────────────────────────────────────

/** Returns the 7 days of the week (Mon–Sun) containing today + weekOffset weeks */
function buildWeekDays(weekOffset = 0): string[] {
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1) + weekOffset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

type DayStripProps = {
  selected: string;
  onSelect: (iso: string) => void;
  colors: ReturnType<typeof useTheme>["colors"];
  taskCounts: Record<string, number>;
  weekOffset: number;
  onWeekChange: (delta: number) => void;
};

function DayStrip({ selected, onSelect, colors, taskCounts, weekOffset, onWeekChange }: DayStripProps) {
  const days = buildWeekDays(weekOffset);
  const monthLabel = new Date(days[0] + "T00:00:00").toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <View>
      {/* Week navigation */}
      <View style={styles.weekNav}>
        <TouchableOpacity onPress={() => onWeekChange(-1)} style={styles.weekNavBtn}>
          <Ionicons name="chevron-back" size={18} color={colors.secondaryText} />
        </TouchableOpacity>
        <Text style={[styles.weekLabel, { color: colors.text }]}>
          {weekOffset === 0 ? "This Week" : weekOffset === 1 ? "Next Week" : weekOffset === -1 ? "Last Week" : monthLabel}
        </Text>
        <TouchableOpacity onPress={() => onWeekChange(1)} style={styles.weekNavBtn}>
          <Ionicons name="chevron-forward" size={18} color={colors.secondaryText} />
        </TouchableOpacity>
      </View>

      {/* Day tiles — non-scrolling 7-column grid */}
      <View style={styles.dayStripGrid}>
        {days.map((iso) => {
          const d = new Date(iso + "T00:00:00");
          const isSelected = iso === selected;
          const isToday = iso === new Date().toISOString().slice(0, 10);
          const count = taskCounts[iso] ?? 0;
          return (
            <TouchableOpacity
              key={iso}
              onPress={() => onSelect(iso)}
              style={[
                styles.dayItem,
                isSelected
                  ? { backgroundColor: colors.primary }
                  : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
                isToday && !isSelected && { borderColor: colors.primary, borderWidth: 2 },
              ]}
            >
              <Text style={[styles.dayName, { color: isSelected ? "#fff" : colors.secondaryText }]}>
                {d.toLocaleDateString(undefined, { weekday: "short" })}
              </Text>
              <Text style={[styles.dayNum, { color: isSelected ? "#fff" : colors.text }]}>
                {d.getDate()}
              </Text>
              <View style={styles.dayDotRow}>
                {count > 0 ? (
                  <View style={[styles.dayDot, { backgroundColor: isSelected ? "#fff" : colors.primary }]} />
                ) : (
                  <View style={styles.dayDotEmpty} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ── Add / Edit Task Modal ─────────────────────────────────────────────────────

type TaskModalProps = {
  visible: boolean;
  onClose: () => void;
  /** Called with full field values; id is present when editing */
  onSave: (fields: Omit<Task, "id" | "createdAt">, editId?: string) => void;
  defaultDate: string;
  colors: ReturnType<typeof useTheme>["colors"];
  hobbies: string[];
  /** Pass a task to open in edit mode, undefined for add mode */
  editingTask?: Task | null;
};

function TaskModal({ visible, onClose, onSave, defaultDate, colors, hobbies, editingTask }: TaskModalProps) {
  const isEdit = !!editingTask;

  const [title, setTitle] = useState(editingTask?.title ?? "");
  const [type, setType] = useState<"task" | "hobby">(editingTask?.type ?? "task");
  const [time, setTime] = useState(editingTask?.time ?? "09:00");
  const [duration, setDuration] = useState(String(editingTask?.duration ?? 30));

  // Swipe-down-to-close: track sheet position with an Animated value
  const panY = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      // Activate on clear downward swipes (dy dominant over dx)
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 5 && Math.abs(gs.dy) > Math.abs(gs.dx),
      onPanResponderMove: (_, gs) => { if (gs.dy > 0) panY.setValue(gs.dy); },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 80) {
          // Swipe past threshold — animate out then close
          Animated.timing(panY, { toValue: 500, duration: 150, useNativeDriver: true }).start(() => {
            panY.setValue(0);
            onClose();
          });
        } else {
          // Not far enough — snap back
          Animated.spring(panY, { toValue: 0, useNativeDriver: true }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(panY, { toValue: 0, useNativeDriver: true }).start();
      },
    })
  ).current;

  // Reset sheet position whenever the modal closes
  useEffect(() => { if (!visible) panY.setValue(0); }, [visible]);

  // Reset fields when modal opens (handles switching between add and edit)
  function handleOpen() {
    setTitle(editingTask?.title ?? "");
    setType(editingTask?.type ?? "task");
    setTime(editingTask?.time ?? "09:00");
    setDuration(String(editingTask?.duration ?? 30));
  }

  function handleSave() {
    if (!title.trim()) return;
    onSave(
      {
        title: title.trim(),
        type,
        date: editingTask?.date ?? defaultDate,
        time,
        duration: parseInt(duration, 10) || 30,
        completed: editingTask?.completed ?? false,
      },
      editingTask?.id
    );
    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      onShow={handleOpen}
    >
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}>
        {/* Transparent area above the sheet — tap to cancel */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={{ flex: 1 }} />
        </TouchableWithoutFeedback>
        <Animated.View
          style={[styles.modalSheet, { backgroundColor: colors.card, transform: [{ translateY: panY }] }]}
          {...panResponder.panHandlers}
        >
          <View style={styles.modalHandle} />

          {/* Modal header */}
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {isEdit ? "Edit Activity" : "Add to Schedule"}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={22} color={colors.secondaryText} />
            </TouchableOpacity>
          </View>

          {/* Type toggle — pill-style */}
          <View style={[styles.typePill, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
            {(["task", "hobby"] as const).map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setType(t)}
                style={[
                  styles.typePillOption,
                  type === t && { backgroundColor: colors.primary },
                ]}
              >
                <Ionicons
                  name={t === "hobby" ? "star-outline" : "checkbox-outline"}
                  size={15}
                  color={type === t ? "#fff" : colors.secondaryText}
                  style={{ marginRight: 5 }}
                />
                <Text
                  style={{
                    color: type === t ? "#fff" : colors.secondaryText,
                    fontWeight: "700",
                    fontSize: 14,
                    textTransform: "capitalize",
                  }}
                >
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Title */}
          <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>Title</Text>
          <TextInput
            style={[styles.modalInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
            placeholder={type === "hobby" ? "e.g. Practice guitar" : "e.g. Finish homework"}
            placeholderTextColor={colors.secondaryText}
            value={title}
            onChangeText={setTitle}
            autoFocus={!isEdit}
          />

          {/* Hobby quick-fill chips */}
          {hobbies.length > 0 && type === "hobby" && (
            <>
              <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>Quick-fill</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {hobbies.map((h) => (
                  <TouchableOpacity
                    key={h}
                    onPress={() => setTitle(h)}
                    style={[
                      styles.hobbyChip,
                      { backgroundColor: title === h ? colors.primary + "22" : colors.inputBackground, borderColor: title === h ? colors.primary : colors.border },
                    ]}
                  >
                    <Text style={{ color: title === h ? colors.primary : colors.text, fontSize: 13, fontWeight: "600" }}>{h}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          {/* Time + Duration row */}
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

          {/* Duration presets */}
          <View style={styles.durationPresets}>
            {["15", "30", "45", "60", "90"].map((d) => (
              <TouchableOpacity
                key={d}
                onPress={() => setDuration(d)}
                style={[
                  styles.durationPreset,
                  {
                    backgroundColor: duration === d ? colors.primary : colors.inputBackground,
                    borderColor: duration === d ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={{ color: duration === d ? "#fff" : colors.secondaryText, fontSize: 12, fontWeight: "600" }}>
                  {d}m
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Actions */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.modalCancelBtn, { borderColor: colors.border }]}
            >
              <Text style={{ color: colors.secondaryText, fontWeight: "600" }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.modalSaveBtn, { backgroundColor: colors.primary }, !title.trim() && { opacity: 0.4 }]}
              disabled={!title.trim()}
            >
              <Ionicons name={isEdit ? "checkmark" : "add"} size={18} color="#fff" style={{ marginRight: 4 }} />
              <Text style={{ color: "#fff", fontWeight: "700" }}>{isEdit ? "Save Changes" : "Add"}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function TimeManagerScreen() {
  const { colors } = useTheme();
  const {
    tasks, addTask, updateTask, deleteTask, toggleComplete,
    dailyReminderEnabled, setDailyReminderEnabled,
    showDailyBanner, dismissDailyBanner,
  } = useTime();
  const { profile } = useProfile();
  const { currentStreak, totalSessions, recordSession } = useProgress();

  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [weekOffset, setWeekOffset] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [timerVisible, setTimerVisible] = useState(false);
  const [timerTask, setTimerTask] = useState<{ title: string; duration: number } | null>(null);

  const dayTasks = tasks
    .filter((t) => t.date === selectedDate)
    .sort((a, b) => a.time.localeCompare(b.time));

  const taskCounts: Record<string, number> = {};
  tasks.forEach((t) => { taskCounts[t.date] = (taskCounts[t.date] ?? 0) + 1; });

  const completedToday = dayTasks.filter((t) => t.completed).length;
  const totalToday = dayTasks.length;

  function openAdd() {
    setEditingTask(null);
    setModalVisible(true);
  }

  function openEdit(task: Task) {
    setEditingTask(task);
    setModalVisible(true);
  }

  function handleSave(fields: Omit<Task, "id" | "createdAt">, editId?: string) {
    if (editId) { updateTask(editId, fields); } else { addTask(fields); }
  }

  async function handleToggle(task: Task) {
    await toggleComplete(task.id);
    // Record a session when completing a hobby/task for the first time
    if (!task.completed) {
      await recordSession(task.duration);
    }
  }

  // Build 7-day weekly grid for the current week
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const todayDow = new Date().getDay(); // 0=Sun
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - ((todayDow === 0 ? 7 : todayDow) - 1) + weekOffset * 7);

  const weekGrid = weekDays.map((label, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const count = taskCounts[iso] ?? 0;
    const isToday = iso === todayISO();
    const isSelected = iso === selectedDate;
    return { label, iso, count, isToday, isSelected };
  });

  const todayName = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();

  const freeTimeMinutes = 45; // placeholder
  const hasHobbyTasks = dayTasks.some((t) => t.type === "hobby");

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header: Back + PLANNER + bell */}
      <View style={styles.plannerHeader}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { borderColor: colors.border }]}
        >
          <Text style={[styles.backBtnText, { color: colors.primary }]}>Back</Text>
        </TouchableOpacity>
        <Text style={[styles.plannerTitle, { color: colors.primary }]}>PLANNER</Text>
        <TouchableOpacity style={styles.bellBtn}>
          <Ionicons name="notifications-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Daily Reminder Banner */}
        {showDailyBanner && (
          <View style={[styles.reminderBanner, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Ionicons name="alarm-outline" size={22} color={colors.primary} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.bannerTitle, { color: colors.primary }]}>Daily Hobby Reminder!</Text>
              <Text style={[styles.bannerBody, { color: colors.text }]}>
                Take 5–10 minutes today to do something you love.
              </Text>
            </View>
            <TouchableOpacity onPress={dismissDailyBanner} style={{ padding: 4 }}>
              <Ionicons name="close" size={18} color={colors.secondaryText} />
            </TouchableOpacity>
          </View>
        )}

        {/* Reminder Toggle */}
        <View style={[styles.reminderToggleRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.reminderToggleLeft}>
            <Ionicons name="notifications-outline" size={20} color={colors.primary} style={{ marginRight: 10 }} />
            <Text style={[styles.reminderToggleLabel, { color: colors.text }]}>Daily Hobby Reminder</Text>
          </View>
          <Switch
            value={dailyReminderEnabled}
            onValueChange={setDailyReminderEnabled}
            trackColor={{ false: colors.border, true: colors.primary + "80" }}
            thumbColor={dailyReminderEnabled ? colors.primary : colors.secondaryText}
          />
        </View>

        {/* WEEKLY SCHEDULE grid */}
        <View style={styles.weeklySection}>
          <Text style={[styles.weeklySectionLabel, { color: colors.primary }]}>WEEKLY SCHEDULE :</Text>

          {/* Day navigation */}
          <View style={styles.weekNavRow}>
            <TouchableOpacity onPress={() => setWeekOffset((w) => w - 1)} style={styles.weekNavBtn}>
              <Ionicons name="chevron-back" size={18} color={colors.primary} />
            </TouchableOpacity>
            <View style={styles.weekGrid}>
              {weekGrid.map((d) => (
                <TouchableOpacity
                  key={d.iso}
                  onPress={() => setSelectedDate(d.iso)}
                  style={[
                    styles.weekDayCell,
                    {
                      backgroundColor: d.isSelected ? colors.accent :
                        d.isToday ? colors.accent + "60" : colors.secondary,
                    },
                  ]}
                >
                  <Text style={[styles.weekDayLabel, { color: d.isSelected ? "#fff" : colors.primary }]}>
                    {d.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={() => setWeekOffset((w) => w + 1)} style={styles.weekNavBtn}>
              <Ionicons name="chevron-forward" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Task count row */}
          <View style={styles.weekGrid}>
            {weekGrid.map((d) => (
              <View
                key={d.iso + "_count"}
                style={[
                  styles.weekCountCell,
                  {
                    backgroundColor: d.count > 0
                      ? (d.isSelected ? colors.accent : colors.primary + "40")
                      : colors.secondary + "80",
                  },
                ]}
              >
                {d.count > 0 && (
                  <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>{d.count}</Text>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Add buttons */}
        <View style={styles.addButtonsRow}>
          <TouchableOpacity
            style={[styles.addTaskBtn, { backgroundColor: colors.primary }]}
            onPress={() => { openAdd(); }}
          >
            <Text style={styles.addTaskBtnText}>Add hobby{"\n"}session</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addTaskBtn, { backgroundColor: colors.primary }]}
            onPress={openAdd}
          >
            <Text style={styles.addTaskBtnText}>Add task</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Schedule card */}
        <View style={[styles.todayCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.todayCardTitle, { color: colors.accent }]}>
            Today's Schedule:{" "}
            <Text style={[styles.todayCardDay, { color: colors.primary }]}>{todayName}</Text>
          </Text>

          {dayTasks.length === 0 ? (
            <TouchableOpacity onPress={openAdd} style={[styles.emptyRow, { backgroundColor: colors.secondary }]}>
              <Text style={[{ color: colors.accent, fontWeight: "600" }]}>Nothing scheduled — add activity</Text>
            </TouchableOpacity>
          ) : (
            dayTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                colors={colors}
                onToggle={() => handleToggle(task)}
                onEdit={() => openEdit(task)}
                onDelete={() => deleteTask(task.id)}
              />
            ))
          )}

          {/* Free time badge */}
          <View style={[styles.freeTimeBadge, { backgroundColor: colors.accent }]}>
            <Text style={styles.freeTimeBadgeText}>
              You have {freeTimeMinutes} min of free time
            </Text>
          </View>
        </View>

        {/* Hobby time section */}
        <View style={[styles.hobbyTimeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.hobbyTimeTitle, { color: colors.primary }]}>Hobby time !!!</Text>
          <View style={styles.hobbyTimeRow}>
            <View style={styles.hobbyTimePlaceholders}>
              {(profile.hobbies.slice(0, 2).length > 0 ? profile.hobbies.slice(0, 2) : ["Hobby 1", "Hobby 2"]).map((h, i) => (
                <View key={i} style={[styles.hobbyTimePill, { backgroundColor: colors.accent }]}>
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>{h}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              onPress={() => {
                const firstHobby = dayTasks.find((t) => t.type === "hobby");
                setTimerTask({
                  title: firstHobby?.title ?? (profile.hobbies[0] ?? "Practice"),
                  duration: firstHobby?.duration ?? 15
                });
                setTimerVisible(true);
              }}
              style={[styles.startBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.startBtnText}>START !</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <TaskModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
        defaultDate={selectedDate}
        colors={colors}
        hobbies={profile.hobbies}
        editingTask={editingTask}
      />

      <PracticeTimerModal
        visible={timerVisible}
        onClose={() => setTimerVisible(false)}
        onComplete={async (minutes) => { await recordSession(minutes); }}
        defaultTitle={timerTask?.title}
        defaultMinutes={timerTask?.duration ?? 15}
        colors={colors}
      />
    </SafeAreaView>
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
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
  },
  reminderBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 16,
    marginHorizontal: 16,
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
    marginTop: 16,
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
  dayStripGrid: { flexDirection: "row", gap: 4, marginTop: 8 },
  weekNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  weekNavBtn: { padding: 6 },
  weekLabel: { fontSize: 13, fontWeight: "700" },
  streakMini: { flexDirection: "row", alignItems: "center", gap: 6, marginHorizontal: 16, marginTop: 12, padding: 10, borderRadius: 10, borderWidth: 1 },
  streakMiniText: { fontSize: 13, fontWeight: "600" },
  practiceFloatBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", margin: 16, marginTop: 8, padding: 14, borderRadius: 14 },
  dayItem: {
    flex: 1,
    height: 76,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dayName: { fontSize: 11, fontWeight: "600", marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.5 },
  dayNum: { fontSize: 22, fontWeight: "800" },
  dayDotRow: { height: 8, justifyContent: "center", alignItems: "center", marginTop: 2 },
  dayDot: { width: 5, height: 5, borderRadius: 3 },
  dayDotEmpty: { width: 5, height: 5 },
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
  progressBar: { height: 7, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    overflow: "hidden",
  },
  taskAccent: { width: 4, alignSelf: "stretch" },
  checkbox: { marginHorizontal: 12 },
  taskInfo: { flex: 1, paddingVertical: 12 },
  taskTitle: { fontSize: 15, fontWeight: "600", marginBottom: 5 },
  strikethrough: { textDecorationLine: "line-through" },
  taskMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  typeBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  typeBadgeText: { fontSize: 11, fontWeight: "700" },
  taskTime: { fontSize: 12 },
  taskDot: { fontSize: 12 },
  taskDuration: { fontSize: 12 },
  taskActions: { flexDirection: "row", alignItems: "center", paddingRight: 8 },
  actionBtn: { padding: 8 },
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
    paddingBottom: 44,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ccc",
    alignSelf: "center",
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  modalTitle: { fontSize: 20, fontWeight: "800" },
  modalCloseBtn: { padding: 4 },
  typePill: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 16,
  },
  typePillOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 11,
    margin: 3,
  },
  fieldLabel: { fontSize: 13, fontWeight: "600", marginBottom: 6, marginTop: 4 },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    marginBottom: 4,
  },
  hobbyChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 8,
  },
  timeRow: { flexDirection: "row", marginTop: 4 },
  durationPresets: { flexDirection: "row", gap: 8, marginTop: 8, marginBottom: 8 },
  durationPreset: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 16 },
  modalCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  modalSaveBtn: {
    flex: 2,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },

  // ── Mockup-aligned planner styles ─────────────────────────────────────────
  plannerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  backBtnText: { fontSize: 14, fontWeight: "600" },
  plannerTitle: { fontSize: 20, fontWeight: "800", letterSpacing: 1 },
  bellBtn: { width: 40, alignItems: "flex-end" },

  weeklySection: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  weeklySectionLabel: { fontSize: 14, fontWeight: "700", marginBottom: 8, letterSpacing: 0.5 },
  weekNavRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 },
  weekGrid: { flex: 1, flexDirection: "row", gap: 4 },
  weekDayCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 10,
  },
  weekDayLabel: { fontSize: 11, fontWeight: "700" },
  weekCountCell: {
    flex: 1,
    height: 14,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },

  addButtonsRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 14,
    gap: 12,
  },
  addTaskBtn: {
    flex: 1,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  addTaskBtnText: { color: "#fff", fontWeight: "700", fontSize: 14, textAlign: "center" },

  todayCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  todayCardTitle: { fontSize: 16, fontWeight: "700" },
  todayCardDay: { fontWeight: "400" },
  emptyRow: {
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  freeTimeBadge: {
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    marginTop: 4,
  },
  freeTimeBadgeText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  hobbyTimeCard: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  hobbyTimeTitle: { fontSize: 18, fontWeight: "800", marginBottom: 12 },
  hobbyTimeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  hobbyTimePlaceholders: { flexDirection: "row", gap: 8 },
  hobbyTimePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  startBtn: {
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  startBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
});
