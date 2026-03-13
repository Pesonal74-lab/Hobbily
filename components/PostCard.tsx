import { View, Text, StyleSheet, Pressable } from "react-native";
import TagChip from "./TagChip";
import { router } from "expo-router";

type Props = {
  username: string;
  content: string;
  tags: string[];
  colors: any;
  postId: number;
};

export default function PostCard({ username, content, tags, colors, postId }: Props) {
  return (
    <Pressable onPress={() => router.push(`/post/${postId}`)}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.username, { color: colors.text }]}>@{username}</Text>
        <Text style={[styles.content, { color: colors.secondaryText }]}>{content}</Text>
        <View style={styles.tagRow}>
          {tags.map((tag) => (
            <TagChip key={tag} label={tag} textColor={colors.text} />
          ))}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12, borderRadius: 10, borderWidth: 1, marginVertical: 8 },
  username: { fontWeight: "bold" },
  content: { marginVertical: 6 },
  tagRow: { flexDirection: "row", flexWrap: "wrap" },
});
