import React from "react";
import { View, TouchableOpacity, StyleSheet, Text } from "react-native";

// Standard pin layout rows back-to-front
const PIN_ROWS = [[7, 8, 9, 10], [4, 5, 6], [2, 3], [1]];

interface Props {
  // pins still STANDING (user taps to toggle standing/down)
  standing: Set<number>;
  // pins that are available to interact with (undefined = all)
  available?: Set<number>;
  onToggle: (pin: number) => void;
  disabled?: boolean;
}

export default function PinDeck({ standing, available, onToggle, disabled }: Props) {
  return (
    <View style={styles.deck}>
      {PIN_ROWS.map((row, i) => (
        <View key={i} style={styles.row}>
          {row.map((pin) => {
            const isStanding = standing.has(pin);
            const isAvailable = available ? available.has(pin) : true;
            return (
              <TouchableOpacity
                key={pin}
                disabled={disabled || !isAvailable}
                onPress={() => onToggle(pin)}
                style={[
                  styles.pin,
                  isStanding && styles.pinStanding,
                  !isAvailable && styles.pinGone,
                ]}
              >
                <Text style={[styles.pinText, isStanding && styles.pinTextStanding]}>
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
  deck: { alignItems: "center", gap: 10 },
  row: { flexDirection: "row", gap: 10 },
  pin: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#e5e7eb",
    borderWidth: 2,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
  },
  pinStanding: {
    backgroundColor: "#fff",
    borderColor: "#1e3a8a",
    shadowColor: "#1e3a8a",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  pinGone: { opacity: 0.2 },
  pinText: { fontWeight: "700", color: "#9ca3af" },
  pinTextStanding: { color: "#1e3a8a" },
});
