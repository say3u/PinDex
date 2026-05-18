import React from "react";
import { View, TouchableOpacity, StyleSheet, Text } from "react-native";

// Standard pin layout (1-10), rows back-to-front
const PIN_ROWS = [[7, 8, 9, 10], [4, 5, 6], [2, 3], [1]];

interface Props {
  knocked: Set<number>;
  onToggle: (pin: number) => void;
  disabled?: boolean;
}

export default function PinDeck({ knocked, onToggle, disabled }: Props) {
  return (
    <View style={styles.deck}>
      {PIN_ROWS.map((row, i) => (
        <View key={i} style={styles.row}>
          {row.map((pin) => {
            const down = knocked.has(pin);
            return (
              <TouchableOpacity
                key={pin}
                disabled={disabled}
                onPress={() => onToggle(pin)}
                style={[styles.pin, down && styles.pinDown]}
              >
                <Text style={[styles.pinText, down && styles.pinTextDown]}>
                  {pin}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  deck: { alignItems: "center", gap: 8 },
  row: { flexDirection: "row", gap: 8 },
  pin: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
  },
  pinDown: { backgroundColor: "#ef4444", borderColor: "#ef4444" },
  pinText: { fontWeight: "700", color: "#374151" },
  pinTextDown: { color: "#fff" },
});
