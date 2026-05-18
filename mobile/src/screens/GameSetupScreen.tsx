import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createGame } from "../api/client";

const OIL_PATTERNS = [
  { key: "house", label: "House Shot", desc: "Standard 40ft, forgiving" },
  { key: "transition", label: "Transition", desc: "Broken down house shot" },
  { key: "sport", label: "Sport Pattern", desc: "Longer, flatter, tougher" },
];

const HAND_STYLES = [
  { key: "1hand", label: "1-Hand" },
  { key: "2hand", label: "2-Hand" },
  { key: "cranker", label: "Cranker" },
];

interface Props {
  bowlerId: string;
  onStart: (gameId: string, handStyle: string) => void;
  onCancel: () => void;
}

export default function GameSetupScreen({ bowlerId, onStart, onCancel }: Props) {
  const insets = useSafeAreaInsets();
  const [lane, setLane] = useState("");
  const [ball, setBall] = useState("");
  const [oilPattern, setOilPattern] = useState("house");
  const [handStyle, setHandStyle] = useState("1hand");
  const [loading, setLoading] = useState(false);

  async function start() {
    setLoading(true);
    try {
      const game = await createGame(bowlerId, lane ? parseInt(lane) : undefined, undefined, oilPattern, ball || undefined);
      onStart(game.id, handStyle);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.title}>New Game</Text>

      {/* Lane */}
      <Section label="Lane #">
        <TextInput
          style={styles.input}
          placeholder="e.g. 14"
          keyboardType="number-pad"
          value={lane}
          onChangeText={setLane}
          placeholderTextColor="#9ca3af"
        />
      </Section>

      {/* Ball */}
      <Section label="Ball Used">
        <TextInput
          style={styles.input}
          placeholder="e.g. Storm Phaze II"
          value={ball}
          onChangeText={setBall}
          placeholderTextColor="#9ca3af"
        />
      </Section>

      {/* Hand style */}
      <Section label="Style">
        <View style={styles.row}>
          {HAND_STYLES.map((s) => (
            <TouchableOpacity
              key={s.key}
              style={[styles.chip, handStyle === s.key && styles.chipActive]}
              onPress={() => setHandStyle(s.key)}
            >
              <Text style={[styles.chipText, handStyle === s.key && styles.chipTextActive]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Section>

      {/* Oil pattern */}
      <Section label="Lane Condition">
        {OIL_PATTERNS.map((p) => (
          <TouchableOpacity
            key={p.key}
            style={[styles.patternCard, oilPattern === p.key && styles.patternCardActive]}
            onPress={() => setOilPattern(p.key)}
          >
            <Text style={[styles.patternLabel, oilPattern === p.key && styles.patternLabelActive]}>
              {p.label}
            </Text>
            <Text style={styles.patternDesc}>{p.desc}</Text>
          </TouchableOpacity>
        ))}
      </Section>

      {/* Lane condition advice */}
      <View style={styles.adviceCard}>
        <Text style={styles.adviceTitle}>How to read the lane</Text>
        {oilPattern === "house" && (
          <Text style={styles.adviceText}>
            House shot: oil is heaviest in the middle, lighter outside. If you're missing right, move right. Ball tracking dry = move target left. Classic 10-board target with 15-board break point.
          </Text>
        )}
        {oilPattern === "transition" && (
          <Text style={styles.adviceText}>
            Transition: oil has been pushed down the lane and burned in the track. Strikes drifting Brooklyn? Move left and open your angle. Track area feels grabby? Move target right 1-2 boards and slow down.
          </Text>
        )}
        {oilPattern === "sport" && (
          <Text style={styles.adviceText}>
            Sport pattern: much less forgiveness outside. Tighter window — missing 1-2 boards matters. Play straighter, focus on entry angle over hook. Watch where the ball skids vs grabs.
          </Text>
        )}
      </View>

      <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={start} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Start Game</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={onCancel} style={styles.cancel}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: "#f9fafb", gap: 8 },
  title: { fontSize: 28, fontWeight: "900", color: "#1e3a8a", marginBottom: 8 },
  section: { gap: 8, marginBottom: 12 },
  sectionLabel: { fontSize: 13, fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    color: "#111827",
  },
  row: { flexDirection: "row", gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
  },
  chipActive: { borderColor: "#1e3a8a", backgroundColor: "#eff6ff" },
  chipText: { color: "#6b7280", fontWeight: "600" },
  chipTextActive: { color: "#1e3a8a" },
  patternCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    marginBottom: 6,
  },
  patternCardActive: { borderColor: "#1e3a8a", backgroundColor: "#eff6ff" },
  patternLabel: { fontWeight: "700", color: "#374151", fontSize: 15 },
  patternLabelActive: { color: "#1e3a8a" },
  patternDesc: { color: "#9ca3af", fontSize: 13, marginTop: 2 },
  adviceCard: {
    backgroundColor: "#fefce8",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#fde68a",
    marginBottom: 8,
  },
  adviceTitle: { fontWeight: "700", color: "#92400e", marginBottom: 6, fontSize: 14 },
  adviceText: { color: "#78350f", fontSize: 13, lineHeight: 20 },
  btn: {
    backgroundColor: "#1e3a8a",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  cancel: { alignItems: "center", padding: 16 },
  cancelText: { color: "#6b7280", fontSize: 16 },
});
