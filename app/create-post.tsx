/**
 * Create Post screen — mockup-aligned
 * "Create a post" title with underline, Title input, multiline body with
 * "Add image +" corner button, tag chips, and a coral "Post" button.
 */
import { ScrollView, Text, TextInput, StyleSheet, View, TouchableOpacity, Pressable } from "react-native";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTheme } from "../context/ThemeContext";
import { usePosts } from "../context/PostsContext";
import TagChip from "../components/TagChip";

export default function CreatePost() {
  const { colors } = useTheme();
  const { createPost } = usePosts();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [pendingTag, setPendingTag] = useState<string | null>(null);

  function addTag() {
    const tag = newTag.trim();
    if (!tag || tags.includes(tag)) return;
    setTags([...tags, tag]);
    setNewTag("");
    setPendingTag(null);
  }

  function handleTagPress(tag: string) {
    if (pendingTag === tag) {
      setTags(tags.filter((t) => t !== tag));
      setPendingTag(null);
    } else {
      setPendingTag(tag);
    }
  }

  async function handleSubmit() {
    if (!title.trim() || !body.trim()) return;
    await createPost(title.trim(), body.trim(), tags);
    router.back();
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { borderColor: colors.border }]}>
          <Text style={[styles.backBtnText, { color: colors.primary }]}>Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingBottom: 40 }}>
        <Pressable onPress={() => setPendingTag(null)}>
          {/* Screen title with underline */}
          <View style={styles.titleSection}>
            <Text style={[styles.screenTitle, { color: colors.primary }]}>Create a post</Text>
            <View style={[styles.titleUnderline, { backgroundColor: colors.accent }]} />
          </View>

          {/* Title input */}
          <Text style={[styles.fieldLabel, { color: colors.primary }]}>Title</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            value={title}
            onChangeText={setTitle}
            placeholder="Post title"
            placeholderTextColor={colors.secondaryText}
          />

          {/* Body input with Add image button */}
          <Text style={[styles.fieldLabel, { color: colors.primary }]}>Content</Text>
          <View style={[styles.bodyWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.bodyInput, { color: colors.text }]}
              multiline
              value={body}
              onChangeText={setBody}
              placeholder="Write your question or thought..."
              placeholderTextColor={colors.secondaryText}
              textAlignVertical="top"
            />
            <TouchableOpacity style={[styles.addImageBtn, { backgroundColor: colors.secondary }]}>
              <Ionicons name="image-outline" size={14} color={colors.primary} />
              <Text style={[styles.addImageText, { color: colors.primary }]}>Add image +</Text>
            </TouchableOpacity>
          </View>

          {/* Hobbies / Tags */}
          <Text style={[styles.fieldLabel, { color: colors.primary }]}>Hobbies</Text>
          <View style={styles.tagInputRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0, backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              value={newTag}
              onChangeText={setNewTag}
              placeholder="Add a hobby tag"
              placeholderTextColor={colors.secondaryText}
              onSubmitEditing={addTag}
            />
            <TouchableOpacity onPress={addTag} style={[styles.addTagBtn, { backgroundColor: colors.primary }]}>
              <Text style={styles.addTagBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.hint, { color: colors.secondaryText }]}>
            Tap a hobby once to select for deletion, tap again to confirm.
          </Text>
          <View style={styles.tagsRow}>
            {tags.map((tag) => (
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

          {/* Post button */}
          <TouchableOpacity
            onPress={handleSubmit}
            style={[styles.postBtn, { backgroundColor: colors.accent, opacity: (!title.trim() || !body.trim()) ? 0.5 : 1 }]}
          >
            <Text style={styles.postBtnText}>Post</Text>
          </TouchableOpacity>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  backBtnText: { fontSize: 14, fontWeight: "600" },

  titleSection: { marginTop: 8, marginBottom: 24 },
  screenTitle: { fontSize: 26, fontWeight: "800" },
  titleUnderline: { height: 3, width: 120, borderRadius: 2, marginTop: 6 },

  fieldLabel: { fontSize: 14, fontWeight: "700", marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 16 },

  bodyWrap: { borderWidth: 1, borderRadius: 12, marginBottom: 16, overflow: "hidden" },
  bodyInput: { minHeight: 140, padding: 14, fontSize: 15 },
  addImageBtn: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-end", margin: 8, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  addImageText: { fontSize: 12, fontWeight: "600" },

  tagInputRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  addTagBtn: { paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, justifyContent: "center" },
  addTagBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  hint: { fontSize: 12, fontStyle: "italic", marginBottom: 10 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 },

  postBtn: { borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  postBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
