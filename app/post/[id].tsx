import { View, Text, ScrollView, StyleSheet, TextInput } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useState } from "react";
import PrimaryButton from "../../components/PrimaryButton";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PostComments() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [comments, setComments] = useState([{ username: "alex", content: "Nice post!" }]);
  const [newComment, setNewComment] = useState("");

  const postTitle = `Post #${id}`;

  function addComment() {
    if (!newComment.trim()) return;
    setComments([...comments, { username: "you", content: newComment }]);
    setNewComment("");
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16 }}>
        <Text style={[styles.title, { color: colors.text }]}>{postTitle}</Text>

        {comments.map((c, i) => (
          <View
            key={i}
            style={[
              styles.commentBubble,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={{ color: colors.text, fontWeight: "bold" }}>@{c.username}</Text>
            <Text style={{ color: colors.secondaryText }}>{c.content}</Text>
          </View>
        ))}

        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
          ]}
          placeholder="Add a comment..."
          placeholderTextColor={colors.secondaryText}
          value={newComment}
          onChangeText={setNewComment}
        />

        <PrimaryButton
          label="Post Comment"
          onPress={addComment}
          buttonStyle={{ backgroundColor: colors.primary }}
          textStyle={{ color: colors.text }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: "700", marginBottom: 12, marginTop: 12 },
  commentBubble: { padding: 12, borderRadius: 10, borderWidth: 1, marginVertical: 6 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginVertical: 12, fontSize: 16 },
});
