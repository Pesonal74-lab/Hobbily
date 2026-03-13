import { Pressable, Text, StyleSheet } from "react-native";

type Props = {
  title: string;
  onPress: () => void;
};

/**
 * Reusable button component used across the app
 */
export default function AppButton({ title, onPress }: Props) {
  return (
    <Pressable style={styles.button} onPress={onPress}>
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#4A90E2",
    padding: 12,
    borderRadius: 8,
    marginVertical: 5,
  },
  text: {
    color: "white",
    textAlign: "center",
    fontWeight: "600",
  },
});
