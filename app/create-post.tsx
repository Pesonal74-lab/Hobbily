/**
 * Create Post screen
 * Lets the user write a new post with a title, body, and optional tags.
 * On submit the post is persisted via PostsContext (Firestore) and the
 * screen navigates back to the feed.
 *
 * Two-press tag deletion:
 *   First tap  → chip turns red (pending delete)
 *   Second tap → chip is removed
 *   Tapping a different chip → resets the pending state of the previous one
 */
import { ScrollView, Text, TextInput, StyleSheet, View, Pressable } from "react-native";
import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { usePosts } from "../context/PostsContext";
import PrimaryButton from "../components/PrimaryButton";
import TagChip from "../components/TagChip";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

export default function CreatePost() {
  const { colors } = useTheme();
  const { createPost } = usePosts();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  // Tracks which tag chip is in the "pending delete" state
  const [pendingTag, setPendingTag] = useState<string | null>(null);

  /** Adds a non-duplicate tag to the list */
  function addTag() {
    const tag = newTag.trim();
    if (!tag || tags.includes(tag)) return;
    setTags([...tags, tag]);
    setNewTag("");
    setPendingTag(null);
  }

  /**
   * Two-press delete: first press marks the chip red, second press removes it.
   * Pressing a different chip resets the previously marked one.
   */
  function handleTagPress(tag: string) {
    if (pendingTag === tag) {
      setTags(tags.filter((t) => t !== tag));
      setPendingTag(null);
    } else {
      setPendingTag(tag);
    }
  }

  /** Validates inputs, persists the post, then returns to the feed */
  async function handleSubmit() {
    if (!title.trim() || !body.trim()) return;
    await createPost(title.trim(), body.trim(), tags);
    router.back();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16 }}>
        {/* Clears any pending-delete tag when tapping blank space or labels */}
        <Pressable onPress={() => setPendingTag(null)}>
        <Text style={[styles.heading, { color: colors.text }]}>New Post</Text>

        {/* ── Post content ─────────────────────────────────── */}
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

        {/* ── Tags ─────────────────────────────────────────── */}
        <Text style={[styles.label, { color: colors.text }]}>Tags</Text>

        {/* Tag input row — pressing Enter/Done also triggers addTag */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0, backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            value={newTag}
            onChangeText={setNewTag}
            placeholder="Add a tag"
            placeholderTextColor={colors.secondaryText}
            onSubmitEditing={addTag}
          />
          <PrimaryButton
            label="Add"
            onPress={addTag}
            buttonStyle={{ backgroundColor: colors.primary, marginLeft: 8, paddingHorizontal: 12 }}
            textStyle={{ color: colors.text }}
          />
        </View>

        {/* Hint for the two-press delete interaction */}
        <Text style={[styles.hint, { color: colors.secondaryText }]}>
          Tap a tag once to select it for deletion, tap again to confirm.
        </Text>

        {/* Active tag chips — red = pending delete */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 16 }}>
          {tags.map((tag) => (
            <TagChip
              key={tag}
              label={tag}
              textColor={colors.text}
              isPendingDelete={pendingTag === tag}
              onPress={() => handleTagPress(tag)}
            />
          ))}
        </View>

        {/* ── Submit / Cancel ──────────────────────────────── */}
        <View style={styles.actionRow}>
          <PrimaryButton
            label="Cancel"
            onPress={() => router.back()}
            buttonStyle={{ flex: 1, backgroundColor: colors.border }}
            textStyle={{ color: colors.text }}
          />
          <PrimaryButton
            label="Create Post"
            onPress={handleSubmit}
            buttonStyle={{ flex: 1, backgroundColor: colors.primary }}
            textStyle={{ color: colors.text }}
          />
        </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 24, fontWeight: "700", marginBottom: 16 },
  label: { fontWeight: "600", fontSize: 16, marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12 },
  hint: { fontSize: 12, marginBottom: 8, fontStyle: "italic" },
  actionRow: { flexDirection: "row", gap: 12 },
});
