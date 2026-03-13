import { View, Text, StyleSheet } from "react-native";

/**
 * Props for a single comment bubble
 */
type Props = {
  user: string; // Comment author
  text: string; // Comment content
};

/**
 * Reusable comment bubble component
 */
export default function CommentBubble({ user, text }: Props) {
  return (
    <View style={styles.bubble}>
      {/* Comment author */}
      <Text style={styles.user}>@{user}</Text>

      {/* Comment text */}
      <Text>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    backgroundColor: "#f1f1f1",
    padding: 10,
    borderRadius: 12,
    marginVertical: 6,
  },
  user: {
    fontWeight: "600",
    marginBottom: 2,
  },
});
