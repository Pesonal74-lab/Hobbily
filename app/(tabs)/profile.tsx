/**
 * Profile screen
 * Users can edit their username, age, bio, and hobby tags.
 * Changes are saved to AsyncStorage via ProfileContext.
 * The dark/light mode toggle is also here.
 *
 * Two-press tag deletion:
 *   First tap  → chip turns red (pending delete)
 *   Second tap → chip is removed
 *   Tapping a different chip → resets the pending state
 */
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  Image,
  TouchableOpacity,
} from "react-native";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useProfile } from "../../context/ProfileContext";
import InputField from "../../components/InputField";
import TagChip from "../../components/TagChip";
import ConfirmModal from "../../components/ConfirmModal";
import SwipeableTab from "../../components/SwipeableTab";

export default function ProfileScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { profile, saveProfile } = useProfile();

  const [draft, setDraft] = useState({ ...profile });
  const [newTag, setNewTag] = useState("");
  const [pendingTag, setPendingTag] = useState<string | null>(null);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [saveError, setSaveError] = useState("");

  function addHobby() {
    const tag = newTag.trim();
    if (!tag) return;
    if (draft.hobbies.includes(tag)) {
      setSaveError(`"${tag}" is already in your hobbies.`);
      setSaveModalVisible(true);
      return;
    }
    setDraft({ ...draft, hobbies: [...draft.hobbies, tag] });
    setNewTag("");
    setPendingTag(null);
  }

  function handleTagPress(tag: string) {
    if (pendingTag === tag) {
      setDraft({ ...draft, hobbies: draft.hobbies.filter((t) => t !== tag) });
      setPendingTag(null);
    } else {
      setPendingTag(tag);
    }
  }

  function requestSave() {
    const ageNum = parseInt(draft.age, 10);
    if (isNaN(ageNum) || ageNum < 13 || ageNum > 150) {
      setSaveError("Age must be between 13 and 150.");
      setSaveModalVisible(true);
      return;
    }
    setSaveError("");
    setSaveModalVisible(true);
  }

  async function handleConfirmSave() {
    setSaveModalVisible(false);
    if (saveError) return;
    await saveProfile(draft);
  }

  return (
    <SwipeableTab tabIndex={4} backgroundColor={colors.background}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={toggleTheme}
              style={[styles.themeBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Ionicons name={isDark ? "sunny-outline" : "moon-outline"} size={20} color={colors.text} />
            </TouchableOpacity>
            <Image
              source={require("../../assets/images/Hobbily_Logo.png")}
              style={styles.headerLogo}
            />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Outer Pressable clears any pending-delete tag when tapping blank space */}
          <Pressable onPress={() => setPendingTag(null)}>

            {/* Avatar card */}
            <View style={[styles.avatarCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarInitial}>
                  {(draft.username || "?")[0].toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.displayName, { color: colors.text }]}>
                  {draft.username || "Your name"}
                </Text>
                {draft.age ? (
                  <Text style={[styles.displayAge, { color: colors.secondaryText }]}>
                    Age {draft.age}
                  </Text>
                ) : null}
                {draft.bio ? (
                  <Text style={[styles.displayBio, { color: colors.secondaryText }]} numberOfLines={1}>
                    {draft.bio}
                  </Text>
                ) : null}
              </View>
            </View>

            <InputField
              label="Username"
              value={draft.username}
              onChangeText={(username) => setDraft({ ...draft, username })}
              containerStyle={{ backgroundColor: "transparent" }}
              labelStyle={{ color: colors.text }}
              inputStyle={{ color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBackground }}
            />

            <InputField
              label="Age"
              value={draft.age}
              onChangeText={(age) => setDraft({ ...draft, age })}
              containerStyle={{ backgroundColor: "transparent" }}
              labelStyle={{ color: colors.text }}
              inputStyle={{ color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBackground }}
              keyboardType="number-pad"
            />

            <InputField
              label="About Me"
              value={draft.bio}
              onChangeText={(bio) => setDraft({ ...draft, bio })}
              containerStyle={{ backgroundColor: "transparent" }}
              labelStyle={{ color: colors.text }}
              inputStyle={{ color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBackground }}
              multiline
            />

            <Text style={[styles.label, { color: colors.text, marginTop: 4 }]}>My Hobbies</Text>

            <View style={[styles.hobbyInputRow, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
              <TextInput
                style={[styles.hobbyInput, { color: colors.text }]}
                placeholder="Add a hobby..."
                placeholderTextColor={colors.secondaryText}
                value={newTag}
                onChangeText={setNewTag}
                onSubmitEditing={addHobby}
              />
              <TouchableOpacity
                onPress={addHobby}
                style={[styles.addHobbyBtn, { backgroundColor: colors.primary }]}
              >
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {draft.hobbies.length > 0 ? (
              <>
                <Text style={[styles.hint, { color: colors.secondaryText }]}>
                  Tap once to select for removal, tap again to delete.
                </Text>
                <View style={styles.tagWrap}>
                  {draft.hobbies.map((tag) => (
                    <TagChip
                      key={tag}
                      label={tag}
                      textColor={colors.text}
                      isPendingDelete={pendingTag === tag}
                      onPress={() => handleTagPress(tag)}
                    />
                  ))}
                </View>
              </>
            ) : (
              <Text style={[styles.hint, { color: colors.secondaryText }]}>
                No hobbies added yet — add some above!
              </Text>
            )}

            <TouchableOpacity
              onPress={requestSave}
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="checkmark" size={18} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>

          </Pressable>
        </ScrollView>
      </SafeAreaView>

      <ConfirmModal
        visible={saveModalVisible}
        title={saveError ? "Cannot Save" : "Save Changes?"}
        message={saveError || "Your profile will be updated."}
        confirmLabel={saveError ? "OK" : "Save"}
        cancelLabel={saveError ? undefined : "Cancel"}
        dangerous={false}
        onConfirm={handleConfirmSave}
        onCancel={() => setSaveModalVisible(false)}
      />
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
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerLogo: { width: 36, height: 36, resizeMode: "contain" },
  themeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  avatarCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    gap: 14,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: { color: "#fff", fontSize: 26, fontWeight: "800" },
  displayName: { fontSize: 18, fontWeight: "700", marginBottom: 2 },
  displayAge: { fontSize: 13 },
  displayBio: { fontSize: 13, marginTop: 2 },
  label: { fontWeight: "700", fontSize: 15, marginBottom: 8 },
  hobbyInputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingLeft: 12,
    paddingRight: 4,
    paddingVertical: 4,
    marginBottom: 8,
  },
  hobbyInput: { flex: 1, fontSize: 15, paddingVertical: 8 },
  addHobbyBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  hint: { fontSize: 12, marginBottom: 8, fontStyle: "italic" },
  tagWrap: { flexDirection: "row", flexWrap: "wrap", marginBottom: 16 },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
