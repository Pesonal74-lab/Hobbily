/**
 * Profile screen
 * Users can edit their username, age, bio, and hobby tags.
 * Changes are saved to AsyncStorage via ProfileContext.
 * The dark/light mode toggle is also here for easy access.
 *
 * Two-press tag deletion:
 *   First tap  → chip turns red (pending delete)
 *   Second tap → chip is removed
 *   Tapping a different chip → resets the pending state of the previous one
 *
 * Swipe right to navigate to the Feed tab with a slide animation:
 *   - The screen slides right with the finger in real time.
 *   - Release past SWIPE_THRESHOLD → flies off-screen, then navigates.
 *   - Release short of threshold → springs back to centre.
 *
 * Animation notes:
 *   - Outer View has overflow:'hidden' so content clips cleanly at the screen edge.
 *   - Animated.View has backgroundColor so it's fully opaque while sliding.
 *   - SafeAreaView is INSIDE Animated.View so safe-area insets slide with the content.
 *   - onMoveShouldSetPanResponderCapture intercepts horizontal gestures before
 *     ScrollView children can claim them, so the slide always works.
 *   - useFocusEffect resets translateX to 0 whenever this tab gains focus,
 *     ensuring the screen is always at the correct position when it appears.
 */
import {
  View,
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  PanResponder,
  Image,
} from "react-native";
import { useState, useRef, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { useTheme } from "../../context/ThemeContext";
import { useProfile } from "../../context/ProfileContext";
import InputField from "../../components/InputField";
import PrimaryButton from "../../components/PrimaryButton";
import TagChip from "../../components/TagChip";
import ConfirmModal from "../../components/ConfirmModal";
import { router } from "expo-router";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = 80;

export default function ProfileScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { profile, saveProfile } = useProfile();

  const [draft, setDraft] = useState({ ...profile });
  const [newTag, setNewTag] = useState("");
  const [pendingTag, setPendingTag] = useState<string | null>(null);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [saveError, setSaveError] = useState("");

  const translateX = useRef(new Animated.Value(0)).current;

  /**
   * Safety net: reset the slide position every time this tab comes into focus.
   * This guarantees the screen is at translateX=0 even if a previous navigation
   * left the native transform in a bad state.
   */
  useFocusEffect(
    useCallback(() => {
      translateX.setValue(0);
    }, [translateX])
  );

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

  function snapBack() {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 8,
    }).start();
  }

  const swipePan = useRef(
    PanResponder.create({
      // Capture phase so we get horizontal gestures before ScrollView can claim them
      onMoveShouldSetPanResponderCapture: (_, g) =>
        Math.abs(g.dx) > 20 && Math.abs(g.dy) < Math.abs(g.dx) * 0.5,

      // Track rightward drag only
      onPanResponderMove: (_, g) => {
        if (g.dx > 0) translateX.setValue(g.dx);
      },

      onPanResponderRelease: (_, g) => {
        if (g.dx > SWIPE_THRESHOLD && Math.abs(g.dy) < 120) {
          Animated.timing(translateX, {
            toValue: SCREEN_WIDTH,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            // Navigate FIRST (this screen goes to background), THEN reset.
            // Resetting before navigation can leave the native transform in a
            // bad state when the tab comes back into view.
            router.navigate("/(tabs)/");
            translateX.setValue(0);
          });
        } else {
          snapBack();
        }
      },

      onPanResponderTerminate: () => snapBack(),
    })
  ).current;

  return (
    <>
      <View style={{ flex: 1, backgroundColor: colors.background, overflow: "hidden" }}>
        <Animated.View
          style={{ flex: 1, backgroundColor: colors.background, transform: [{ translateX }] }}
          {...swipePan.panHandlers}
        >
          <SafeAreaView style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16 }}>
              {/* Outer Pressable clears any pending-delete tag when the user taps
                  blank space, a label, or any non-interactive element. */}
              <Pressable onPress={() => setPendingTag(null)}>
              <View style={styles.profileHeader}>
                <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
                <Image
                  source={require("../../assets/images/Hobbily_Logo.png")}
                  style={styles.headerLogo}
                />
              </View>

              <InputField
                label="Username"
                value={draft.username}
                onChangeText={(username) => setDraft({ ...draft, username })}
                containerStyle={{ backgroundColor: colors.card }}
                labelStyle={{ color: colors.text }}
                inputStyle={{ color: colors.text, borderColor: colors.border }}
              />

              <InputField
                label="Age"
                value={draft.age}
                onChangeText={(age) => setDraft({ ...draft, age })}
                containerStyle={{ backgroundColor: colors.card }}
                labelStyle={{ color: colors.text }}
                inputStyle={{ color: colors.text, borderColor: colors.border }}
                keyboardType="number-pad"
              />

              <InputField
                label="About Me"
                value={draft.bio}
                onChangeText={(bio) => setDraft({ ...draft, bio })}
                containerStyle={{ backgroundColor: colors.card }}
                labelStyle={{ color: colors.text }}
                inputStyle={{ color: colors.text, borderColor: colors.border }}
                multiline
              />

              <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>Add Hobby</Text>

              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                <TextInput
                  style={[styles.input, { flex: 1, backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  placeholder="Enter hobby name"
                  placeholderTextColor={colors.secondaryText}
                  value={newTag}
                  onChangeText={setNewTag}
                  onSubmitEditing={addHobby}
                />
                <PrimaryButton
                  label="Add"
                  onPress={addHobby}
                  buttonStyle={{ backgroundColor: colors.primary, marginLeft: 8, paddingHorizontal: 12 }}
                  textStyle={{ color: colors.text }}
                />
              </View>

              <Text style={[styles.hint, { color: colors.secondaryText }]}>
                Tap a tag once to select it for deletion, tap again to confirm.
              </Text>

              <View style={{ flexDirection: "row", flexWrap: "wrap", marginVertical: 8 }}>
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

              <PrimaryButton
                label="Save Changes"
                onPress={requestSave}
                buttonStyle={{ backgroundColor: colors.primary }}
                textStyle={{ color: colors.text }}
              />

              <PrimaryButton
                label={`Toggle ${isDark ? "Light" : "Dark"} Mode`}
                onPress={toggleTheme}
                buttonStyle={{ backgroundColor: colors.primary }}
                textStyle={{ color: colors.text }}
              />
              </Pressable>
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </View>

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
    </>
  );
}

const styles = StyleSheet.create({
  profileHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: { fontSize: 28, fontWeight: "700" },
  headerLogo: { width: 32, height: 32, resizeMode: "contain" },
  label: { fontWeight: "600", fontSize: 16, marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12 },
  hint: { fontSize: 12, marginBottom: 4, fontStyle: "italic" },
});
