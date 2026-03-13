import { Text, Pressable, StyleSheet } from "react-native";

type Props = {
  label: string;
  textColor: string;
  onPress?: () => void; // ✅ allow optional onPress
};

export default function TagChip({ label, textColor, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: pressed ? "#ff6961" : "#ddd" }, // optional press color
      ]}
    >
      <Text style={{ color: textColor }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    margin: 4,
    borderWidth: 1,
    borderColor: "#999",
  },
});
