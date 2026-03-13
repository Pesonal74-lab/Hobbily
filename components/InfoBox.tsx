import { View, Text, StyleSheet } from "react-native";

type Props = {
  title: string;
  value: string;
  colors: any;
};

/**
 * Generic info display box
 * Used for time, weather, future stats
 */
export default function InfoBox({ title, value, colors }: Props) {
  return (
    <View
      style={[
        styles.box,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <Text style={[styles.title, { color: colors.secondaryText }]}>
        {title}
      </Text>
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 12,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
  },
});
