import { ScrollView, Text, TextInput, StyleSheet } from "react-native";
import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import PrimaryButton from "../components/PrimaryButton";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CreatePost() {
  const { colors } = useTheme();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  function handleSubmit() {
    if (!title.trim() || !body.trim()) return;
    console.log("New Post:", { title, body });
    setTitle("");
    setBody("");
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16 }}>
        <Text style={[styles.label, { color: colors.text }]}>Title</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
          value={title}
          onChangeText={setTitle}
          placeholder="Post title"
          placeholderTextColor={colors.secondaryText}
        />

        <Text style={[styles.label, { color: colors.text }]}>Body</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border, height: 120 }]}
          multiline
          value={body}
          onChangeText={setBody}
          placeholder="Write your post..."
          placeholderTextColor={colors.secondaryText}
        />

        <PrimaryButton
          label="Create Post"
          onPress={handleSubmit}
          buttonStyle={{ backgroundColor: colors.primary }}
          textStyle={{ color: colors.text }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  label: { fontWeight: "600", fontSize: 16, marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12 },
});
