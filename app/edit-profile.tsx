/**
 * Edit Profile screen — username, age, city, bio.
 */
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert,
} from "react-native";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useTheme } from "../context/ThemeContext";
import { useProfile } from "../context/ProfileContext";
import ConfirmModal from "../components/ConfirmModal";

function Field({
  label, value, onChangeText, placeholder, keyboardType, multiline, colors,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; keyboardType?: any; multiline?: boolean; colors: any;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.primary }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
          multiline && { height: 90, textAlignVertical: "top" },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.secondaryText}
        keyboardType={keyboardType}
        multiline={multiline}
        autoCapitalize={keyboardType === "email-address" ? "none" : "sentences"}
      />
    </View>
  );
}

export default function EditProfileScreen() {
  const { colors } = useTheme();
  const { profile, saveProfile } = useProfile();

  const [draft, setDraft] = useState({ ...profile });
  const [errorModal, setErrorModal] = useState("");

  async function handleSave() {
    const ageNum = parseInt(draft.age, 10);
    if (draft.age && (isNaN(ageNum) || ageNum < 13 || ageNum > 150)) {
      setErrorModal("Age must be between 13 and 150.");
      return;
    }
    await saveProfile(draft);
    router.back();
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.headerBtn, { borderColor: colors.border }]}
        >
          <Text style={[styles.headerBtnText, { color: colors.primary }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.primary }]}>Edit Profile</Text>
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.headerBtn, { backgroundColor: colors.accent, borderColor: colors.accent }]}
        >
          <Text style={[styles.headerBtnText, { color: "#fff" }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
        <Field
          label="Username"
          value={draft.username}
          onChangeText={(username) => setDraft({ ...draft, username })}
          placeholder="Your display name"
          colors={colors}
        />
        <Field
          label="Age"
          value={draft.age}
          onChangeText={(age) => setDraft({ ...draft, age })}
          placeholder="e.g. 16"
          keyboardType="number-pad"
          colors={colors}
        />
        <Field
          label="City"
          value={draft.city}
          onChangeText={(city) => setDraft({ ...draft, city })}
          placeholder="Your city"
          colors={colors}
        />
        <Field
          label="About Me"
          value={draft.bio}
          onChangeText={(bio) => setDraft({ ...draft, bio })}
          placeholder="Tell others a bit about yourself..."
          multiline
          colors={colors}
        />
      </ScrollView>

      <ConfirmModal
        visible={!!errorModal}
        title="Cannot Save"
        message={errorModal}
        confirmLabel="OK"
        dangerous={false}
        onConfirm={() => setErrorModal("")}
        onCancel={() => setErrorModal("")}
      />
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
  headerBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  headerBtnText: { fontSize: 14, fontWeight: "700" },
  title: { fontSize: 18, fontWeight: "800" },
  fieldWrap: { marginBottom: 18 },
  fieldLabel: { fontSize: 14, fontWeight: "700", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
});
