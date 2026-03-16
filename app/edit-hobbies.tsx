/**
 * Edit Hobbies screen — standalone screen for managing your hobby list.
 * Shows current hobbies as deletable chips, an add input, and quick-add suggestions.
 */
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
} from "react-native";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTheme } from "../context/ThemeContext";
import { useProfile } from "../context/ProfileContext";
import TagChip from "../components/TagChip";

const SUGGESTIONS = [
  "Music", "Gaming", "Art", "Sports", "Coding", "Dance",
  "Cooking", "Photography", "Reading", "Film", "Chess", "Hiking",
];

export default function EditHobbiesScreen() {
  const { colors } = useTheme();
  const { profile, saveProfile } = useProfile();

  const [hobbies, setHobbies] = useState([...profile.hobbies]);
  const [newTag, setNewTag] = useState("");
  const [pendingTag, setPendingTag] = useState<string | null>(null);

  function addHobby(tag = newTag.trim()) {
    if (!tag || hobbies.includes(tag)) return;
    setHobbies((prev) => [...prev, tag]);
    setNewTag("");
    setPendingTag(null);
  }

  function handleTagPress(tag: string) {
    if (pendingTag === tag) {
      setHobbies((prev) => prev.filter((t) => t !== tag));
      setPendingTag(null);
    } else {
      setPendingTag(tag);
    }
  }

  async function handleSave() {
    await saveProfile({ ...profile, hobbies });
    router.back();
  }

  const suggestions = SUGGESTIONS.filter((s) => !hobbies.includes(s));

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
        <Text style={[styles.title, { color: colors.primary }]}>My Interests</Text>
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.headerBtn, { backgroundColor: colors.accent, borderColor: colors.accent }]}
        >
          <Text style={[styles.headerBtnText, { color: "#fff" }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Current hobbies */}
        <Text style={[styles.sectionLabel, { color: colors.primary }]}>Your hobbies</Text>
        {hobbies.length === 0 ? (
          <Text style={[styles.emptyHint, { color: colors.secondaryText }]}>
            No hobbies yet — add some below.
          </Text>
        ) : (
          <View style={styles.chipsWrap}>
            {hobbies.map((tag) => (
              <TagChip
                key={tag}
                label={tag}
                textColor="#fff"
                backgroundColor={colors.primary}
                isPendingDelete={pendingTag === tag}
                onPress={() => handleTagPress(tag)}
              />
            ))}
          </View>
        )}
        <Text style={[styles.hint, { color: colors.secondaryText }]}>
          Tap once to select · tap again to remove
        </Text>

        {/* Add hobby input */}
        <Text style={[styles.sectionLabel, { color: colors.primary, marginTop: 28 }]}>
          Add a hobby
        </Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[
              styles.input,
              { flex: 1, backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
            ]}
            value={newTag}
            onChangeText={setNewTag}
            placeholder="e.g. Photography, Chess, Yoga..."
            placeholderTextColor={colors.secondaryText}
            onSubmitEditing={() => addHobby()}
            returnKeyType="done"
          />
          <TouchableOpacity
            onPress={() => addHobby()}
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.primary, marginTop: 28 }]}>
              Quick add
            </Text>
            <View style={styles.chipsWrap}>
              {suggestions.map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => addHobby(s)}
                  style={[styles.suggestionChip, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                >
                  <Ionicons name="add" size={13} color={colors.primary} />
                  <Text style={[styles.suggestionText, { color: colors.primary }]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
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
  headerBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  headerBtnText: { fontSize: 14, fontWeight: "700" },
  title: { fontSize: 18, fontWeight: "800" },
  sectionLabel: { fontSize: 14, fontWeight: "700", marginBottom: 10 },
  emptyHint: { fontSize: 14, fontStyle: "italic", marginBottom: 8 },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 6 },
  hint: { fontSize: 12, fontStyle: "italic", marginTop: 4 },
  inputRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  suggestionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  suggestionText: { fontSize: 13, fontWeight: "600" },
});
