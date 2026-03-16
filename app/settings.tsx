/**
 * Settings screen — dark mode, daily reminder, reset tips, account info, logout, delete.
 */
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch,
  TextInput, Modal, ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../context/ThemeContext";
import { useTime } from "../context/TimeContext";
import { useAuth } from "../context/AuthContext";
import { useProfile } from "../context/ProfileContext";
import { TIP_KEYS, useTipsReset } from "../components/TipBanner";
import ConfirmModal from "../components/ConfirmModal";

// ── Delete Account Modal ───────────────────────────────────────────────────────
function DeleteAccountModal({
  visible, onCancel, onConfirm, colors,
}: {
  visible: boolean; onCancel: () => void;
  onConfirm: (password: string) => Promise<void>; colors: any;
}) {
  const [checked, setChecked] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canDelete = checked && confirmText.trim() === "DELETE" && password.length > 0;

  async function handleDelete() {
    setLoading(true);
    setError("");
    try {
      await onConfirm(password);
    } catch (e: any) {
      setLoading(false);
      if (e.code === "auth/wrong-password" || e.code === "auth/invalid-credential") {
        setError("Incorrect password. Please try again.");
      } else if (e.code === "auth/too-many-requests") {
        setError("Too many attempts. Please wait a moment.");
      } else {
        setError("Failed to delete account. Please try again.");
      }
    }
  }

  function handleCancel() {
    setChecked(false); setConfirmText(""); setPassword(""); setError("");
    onCancel();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
      <View style={s.modalOverlay}>
        <View style={[s.deleteModal, { backgroundColor: colors.card, borderColor: "#ef4444" }]}>
          <Ionicons name="warning-outline" size={36} color="#ef4444" style={{ alignSelf: "center" }} />
          <Text style={[s.deleteTitle, { color: colors.text }]}>Delete Account</Text>
          <Text style={[s.deleteBody, { color: colors.secondaryText }]}>
            This permanently removes your profile, posts, and all data. Cannot be undone.
          </Text>
          <TouchableOpacity style={s.checkRow} onPress={() => setChecked(!checked)}>
            <View style={[s.checkbox, { borderColor: "#ef4444", backgroundColor: checked ? "#ef4444" : "transparent" }]}>
              {checked && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={[s.checkLabel, { color: colors.text }]}>
              I understand this is permanent and cannot be undone.
            </Text>
          </TouchableOpacity>
          <Text style={[s.deleteHint, { color: colors.secondaryText }]}>
            Type <Text style={{ color: "#ef4444", fontWeight: "700" }}>DELETE</Text> to confirm:
          </Text>
          <TextInput
            style={[s.deleteInput, { color: colors.text, borderColor: confirmText === "DELETE" ? "#ef4444" : colors.border, backgroundColor: colors.inputBackground }]}
            value={confirmText} onChangeText={setConfirmText}
            autoCapitalize="characters" placeholder="DELETE" placeholderTextColor={colors.secondaryText}
          />
          <Text style={[s.deleteHint, { color: colors.secondaryText }]}>Enter your password:</Text>
          <TextInput
            style={[s.deleteInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBackground, letterSpacing: 0 }]}
            value={password} onChangeText={setPassword}
            secureTextEntry autoCapitalize="none" placeholder="Your password" placeholderTextColor={colors.secondaryText}
          />
          {error ? <Text style={{ color: "#ef4444", fontSize: 13, textAlign: "center" }}>{error}</Text> : null}
          <View style={s.deleteActions}>
            <TouchableOpacity style={[s.deleteCancelBtn, { borderColor: colors.border }]} onPress={handleCancel} disabled={loading}>
              <Text style={[s.deleteCancelText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.deleteConfirmBtn, { backgroundColor: canDelete ? "#ef4444" : colors.border }]} onPress={handleDelete} disabled={!canDelete || loading}>
              {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.deleteConfirmText}>Delete</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Row components ─────────────────────────────────────────────────────────────
function ToggleRow({ label, sublabel, value, onToggle, colors }: {
  label: string; sublabel?: string; value: boolean; onToggle: () => void; colors: any;
}) {
  return (
    <View style={[s.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={{ flex: 1 }}>
        <Text style={[s.rowLabel, { color: colors.text }]}>{label}</Text>
        {sublabel ? <Text style={[s.rowSub, { color: colors.secondaryText }]}>{sublabel}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: colors.primary + "80" }}
        thumbColor={value ? colors.primary : colors.secondaryText}
      />
    </View>
  );
}

function ActionRow({ icon, label, sublabel, onPress, colors, danger = false }: {
  icon: any; label: string; sublabel?: string; onPress: () => void; colors: any; danger?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[s.row, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={20} color={danger ? "#ef4444" : colors.primary} style={{ marginRight: 12 }} />
      <View style={{ flex: 1 }}>
        <Text style={[s.rowLabel, { color: danger ? "#ef4444" : colors.text }]}>{label}</Text>
        {sublabel ? <Text style={[s.rowSub, { color: colors.secondaryText }]}>{sublabel}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.secondaryText} />
    </TouchableOpacity>
  );
}

function SectionTitle({ title, colors }: { title: string; colors: any }) {
  return <Text style={[s.sectionTitle, { color: colors.secondaryText }]}>{title.toUpperCase()}</Text>;
}

// ── Main Screen ────────────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { dailyReminderEnabled, setDailyReminderEnabled, resetDailyBanner } = useTime();
  const { signOut, deleteAccount } = useAuth();
  const { profile } = useProfile();
  const { bump: bumpTips } = useTipsReset();

  const [logoutVisible, setLogoutVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [tipsResetDone, setTipsResetDone] = useState(false);

  async function handleResetTips() {
    await AsyncStorage.multiRemove([...Object.values(TIP_KEYS), "@hobbily_reminder_shown_date"]);
    bumpTips();
    resetDailyBanner();
    setTipsResetDone(true);
    setTimeout(() => setTipsResetDone(false), 2500);
  }

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={[s.backBtn, { borderColor: colors.border }]}>
          <Text style={[s.backBtnText, { color: colors.primary }]}>Back</Text>
        </TouchableOpacity>
        <Text style={[s.title, { color: colors.primary }]}>SETTINGS</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 6 }}>
        {/* App */}
        <SectionTitle title="App" colors={colors} />
        <ToggleRow
          label="Dark Mode"
          sublabel={isDark ? "Currently dark" : "Currently light"}
          value={isDark}
          onToggle={toggleTheme}
          colors={colors}
        />
        <ToggleRow
          label="Daily Practice Reminder"
          sublabel="Reminds you to practice each day"
          value={dailyReminderEnabled}
          onToggle={() => setDailyReminderEnabled(!dailyReminderEnabled)}
          colors={colors}
        />

        {/* Tips */}
        <SectionTitle title="Tips & Hints" colors={colors} />
        <TouchableOpacity
          style={[s.row, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleResetTips}
        >
          <Ionicons name="refresh-outline" size={20} color={colors.primary} style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={[s.rowLabel, { color: colors.text }]}>Reset dismissed tips</Text>
            <Text style={[s.rowSub, { color: colors.secondaryText }]}>Restore all info banners</Text>
          </View>
          {tipsResetDone
            ? <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            : <Ionicons name="chevron-forward" size={16} color={colors.secondaryText} />
          }
        </TouchableOpacity>

        {/* Account info */}
        <SectionTitle title="Account" colors={colors} />
        <View style={[s.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.infoRow}>
            <Ionicons name="mail-outline" size={16} color={colors.secondaryText} />
            <Text style={[s.infoLabel, { color: colors.secondaryText }]}>Email</Text>
            <Text style={[s.infoValue, { color: colors.text }]} numberOfLines={1}>{profile.email || "Not set"}</Text>
          </View>
          <View style={[s.infoDivider, { backgroundColor: colors.border }]} />
          <View style={s.infoRow}>
            <Ionicons name="information-circle-outline" size={16} color={colors.secondaryText} />
            <Text style={[s.infoLabel, { color: colors.secondaryText }]}>Version</Text>
            <Text style={[s.infoValue, { color: colors.text }]}>1.1.0</Text>
          </View>
        </View>

        {/* Danger zone */}
        <SectionTitle title="Account actions" colors={colors} />
        <TouchableOpacity
          style={[s.logoutBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setLogoutVisible(true)}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.text} />
          <Text style={[s.logoutText, { color: colors.text }]}>Log Out</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.deleteBtn} onPress={() => setDeleteVisible(true)}>
          <Ionicons name="trash-outline" size={16} color="#ef4444" />
          <Text style={s.deleteBtnText}>Delete Account</Text>
        </TouchableOpacity>
      </ScrollView>

      <ConfirmModal
        visible={logoutVisible}
        title="Log Out?"
        message="You'll need to sign in again to access your account."
        confirmLabel="Log Out"
        cancelLabel="Cancel"
        dangerous={false}
        onConfirm={async () => { setLogoutVisible(false); await signOut(); }}
        onCancel={() => setLogoutVisible(false)}
      />

      <DeleteAccountModal
        visible={deleteVisible}
        onCancel={() => setDeleteVisible(false)}
        onConfirm={async (password) => { await deleteAccount(password); }}
        colors={colors}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  backBtnText: { fontSize: 14, fontWeight: "600" },
  title: { fontSize: 20, fontWeight: "800", letterSpacing: 1 },
  sectionTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginTop: 16, marginBottom: 4, marginLeft: 4 },
  row: {
    flexDirection: "row", alignItems: "center",
    padding: 14, borderRadius: 14, borderWidth: 1,
  },
  rowLabel: { fontSize: 15, fontWeight: "600" },
  rowSub: { fontSize: 12, marginTop: 2 },
  infoCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  infoRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  infoLabel: { fontSize: 14, width: 70 },
  infoValue: { fontSize: 14, fontWeight: "600", flex: 1, textAlign: "right" },
  infoDivider: { height: 1, marginLeft: 14 },
  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1, marginTop: 4,
  },
  logoutText: { fontSize: 16, fontWeight: "700" },
  deleteBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, marginTop: 4 },
  deleteBtnText: { color: "#ef4444", fontSize: 14, fontWeight: "600" },
  // Delete modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", alignItems: "center", padding: 24 },
  deleteModal: { width: "100%", borderRadius: 20, borderWidth: 1.5, padding: 24, gap: 12 },
  deleteTitle: { fontSize: 20, fontWeight: "800", textAlign: "center", marginTop: 4 },
  deleteBody: { fontSize: 14, lineHeight: 20, textAlign: "center" },
  checkRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: "center", justifyContent: "center", marginTop: 1 },
  checkLabel: { flex: 1, fontSize: 14, lineHeight: 20 },
  deleteHint: { fontSize: 13, marginTop: 4 },
  deleteInput: { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, fontWeight: "700", letterSpacing: 2 },
  deleteActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  deleteCancelBtn: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  deleteCancelText: { fontSize: 15, fontWeight: "600" },
  deleteConfirmBtn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  deleteConfirmText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
