import { Pressable, Text, StyleSheet } from "react-native";

type Props = {
  label: string;
  onPress: () => void;
  buttonStyle?: object;
  textStyle?: object;
};

export default function PrimaryButton({ label, onPress, buttonStyle, textStyle }: Props) {
  return (
    <Pressable onPress={onPress} style={[styles.button, buttonStyle]}>
      <Text style={[styles.text, textStyle]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginVertical: 6,
    alignItems: "center",
  },
  text: { fontWeight: "600", fontSize: 16 },
});
