import { ScrollView, StyleSheet, View, Text, TextInput } from "react-native";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import InputField from "../../components/InputField";
import PrimaryButton from "../../components/PrimaryButton";
import TagChip from "../../components/TagChip";

export default function ProfileScreen() {
  const { colors, isDark, toggleTheme } = useTheme();

  const [draftProfile, setDraftProfile] = useState({
    username: "alex",
    age: "",
    bio: "",
    hobbies: ["Photography"],
  });

  const [newTag, setNewTag] = useState("");

  // Add a new hobby tag
  function addHobby() {
    const tag = newTag.trim();
    if (!tag) return;
    if (draftProfile.hobbies.includes(tag)) {
      alert("Hobby already exists!");
      return;
    }
    setDraftProfile({ ...draftProfile, hobbies: [...draftProfile.hobbies, tag] });
    setNewTag("");
  }

  // Remove a hobby tag
  function removeHobby(tag: string) {
    setDraftProfile({
      ...draftProfile,
      hobbies: draftProfile.hobbies.filter((t) => t !== tag),
    });
  }

  // Save profile changes with age validation
  function saveChanges() {
    const ageNum = parseInt(draftProfile.age, 10);
    if (isNaN(ageNum) || ageNum < 13 || ageNum > 150) {
      alert("Age must be between 13 and 150");
      return;
    }
    alert("Profile saved!");
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16 }}>
        <Text style={[styles.title, { color: colors.text }]}>Profile</Text>

        {/* Username input */}
        <InputField
          label="Username"
          value={draftProfile.username}
          onChangeText={(username) => setDraftProfile({ ...draftProfile, username })}
          containerStyle={{ backgroundColor: colors.card }}
          labelStyle={{ color: colors.text }}
          inputStyle={{ color: colors.text, borderColor: colors.border }}
        />

        {/* Age input */}
        <InputField
          label="Age"
          value={draftProfile.age}
          onChangeText={(age) => setDraftProfile({ ...draftProfile, age })}
          containerStyle={{ backgroundColor: colors.card }}
          labelStyle={{ color: colors.text }}
          inputStyle={{ color: colors.text, borderColor: colors.border }}
          keyboardType="number-pad"
        />

        {/* About me input */}
        <InputField
          label="About Me"
          value={draftProfile.bio}
          onChangeText={(bio) => setDraftProfile({ ...draftProfile, bio })}
          containerStyle={{ backgroundColor: colors.card }}
          labelStyle={{ color: colors.text }}
          inputStyle={{ color: colors.text, borderColor: colors.border }}
          multiline
        />

        {/* Add Hobby input + button */}
        <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>Add Hobby</Text>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
          <TextInput
            style={[
              styles.input,
              { flex: 1, backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
            ]}
            placeholder="Enter hobby name"
            placeholderTextColor={colors.secondaryText}
            value={newTag}
            onChangeText={setNewTag}
          />
          <PrimaryButton
            label="Add"
            onPress={addHobby}
            buttonStyle={{ backgroundColor: colors.primary, marginLeft: 8, paddingHorizontal: 12 }}
            textStyle={{ color: colors.text }}
          />
        </View>

        {/* Display existing hobbies */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginVertical: 8 }}>
          {draftProfile.hobbies.map((tag) => (
            <TagChip
              key={tag}
              label={tag}
              textColor={colors.text}
              onPress={() => removeHobby(tag)} // Press to remove hobby
            />
          ))}
        </View>

        {/* Save Changes button */}
        <PrimaryButton
          label="Save Changes"
          onPress={saveChanges}
          buttonStyle={{ backgroundColor: colors.primary }}
          textStyle={{ color: colors.text }}
        />

        {/* Toggle dark/light mode */}
        <PrimaryButton
          label={`Toggle ${isDark ? "Light" : "Dark"} Mode`}
          onPress={toggleTheme}
          buttonStyle={{ backgroundColor: colors.primary }}
          textStyle={{ color: colors.text }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: "700", marginBottom: 16 },
  label: { fontWeight: "600", fontSize: 16, marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12 },
});
