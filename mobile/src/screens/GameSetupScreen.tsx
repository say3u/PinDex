import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, ActivityIndicator, StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { createGame } from "../api/client";

const OIL_PATTERNS = [
  { key: "house",      label: "House Shot",    desc: "Standard 40ft, forgiving",          advice: "Oil is heaviest in the middle. If you miss right, move right. Classic 10-board target with 15-board break point." },
  { key: "transition", label: "Transition",    desc: "Broken down house shot",             advice: "Oil pushed down lane, track area is burned in. Drifting Brooklyn? Move left and open your angle." },
  { key: "sport",      label: "Sport Pattern", desc: "Longer, flatter, less forgiving",   advice: "Very little margin outside. Missing 1–2 boards matters. Play straighter, focus on entry angle." },
];

const HAND_STYLES = [
  { key: "1hand",   label: "1-Hand"  },
  { key: "2hand",   label: "2-Hand"  },
  { key: "cranker", label: "Cranker" },
];

interface Props {
  bowlerId: string;
  onStart: (gameId: string, handStyle: string, oilPattern: string) => void;
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
      onStart(game.id, handStyle, oilPattern);
    } finally {
      setLoading(false);
    }
  }

  const selectedPattern = OIL_PATTERNS.find((p) => p.key === oilPattern)!;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0f1e" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.backBtn}>
          <Ionicons name="close" size={22} color="#475569" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Game</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Lane + Ball row */}
        <View style={styles.row}>
          <View style={[styles.card, { flex: 1 }]}>
            <Text style={styles.cardLabel}>LANE #</Text>
            <TextInput
              style={styles.input}
              placeholder="14"
              keyboardType="number-pad"
              value={lane}
              onChangeText={setLane}
              placeholderTextColor="#374151"
            />
          </View>
          <View style={[styles.card, { flex: 2 }]}>
            <Text style={styles.cardLabel}>BALL</Text>
            <TextInput
              style={styles.input}
              placeholder="Storm Phaze II"
              value={ball}
              onChangeText={setBall}
              placeholderTextColor="#374151"
            />
          </View>
        </View>

        {/* Style */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>STYLE</Text>
          <View style={styles.chipRow}>
            {HAND_STYLES.map((s) => (
              <TouchableOpacity
                key={s.key}
                style={[styles.chip, handStyle === s.key && styles.chipActive]}
                onPress={() => setHandStyle(s.key)}
              >
                <Text style={[styles.chipText, handStyle === s.key && styles.chipTextActive]}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Oil pattern */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>LANE CONDITION</Text>
          <View style={styles.patternList}>
            {OIL_PATTERNS.map((p) => {
              const active = oilPattern === p.key;
              return (
                <TouchableOpacity
                  key={p.key}
                  style={[styles.patternRow, active && styles.patternRowActive]}
                  onPress={() => setOilPattern(p.key)}
                >
                  <View style={[styles.patternRadio, active && styles.patternRadioActive]}>
                    {active && <View style={styles.patternRadioDot} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.patternLabel, active && styles.patternLabelActive]}>{p.label}</Text>
                    <Text style={styles.patternDesc}>{p.desc}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Advice for selected pattern */}
        <View style={styles.adviceCard}>
          <View style={styles.adviceHeader}>
            <Ionicons name="information-circle" size={16} color="#3b82f6" />
            <Text style={styles.adviceTitle}>Lane Read — {selectedPattern.label}</Text>
          </View>
          <Text style={styles.adviceText}>{selectedPattern.advice}</Text>
        </View>

        {/* Start button */}
        <TouchableOpacity
          style={[styles.startBtn, loading && styles.btnDisabled]}
          onPress={start}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : (
            <>
              <Ionicons name="play" size={18} color="#fff" />
              <Text style={styles.startBtnText}>Start Game</Text>
            </>
          )}
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0f1e" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderColor: "#1f2937",
  },
  backBtn: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "800", color: "#f1f5f9" },
  scroll: { padding: 16, gap: 12, paddingBottom: 48 },
  row: { flexDirection: "row", gap: 12 },

  card: {
    backgroundColor: "#111827", borderRadius: 16,
    borderWidth: 1, borderColor: "#1f2937", padding: 14, gap: 10,
  },
  cardLabel: { fontSize: 10, fontWeight: "700", color: "#374151", letterSpacing: 1.2 },
  input: {
    backgroundColor: "#0f172a", borderRadius: 10, padding: 12,
    fontSize: 15, borderWidth: 1, borderColor: "#1f2937", color: "#f1f5f9",
  },

  chipRow: { flexDirection: "row", gap: 8 },
  chip: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1.5, borderColor: "#1f2937",
    backgroundColor: "#0f172a", alignItems: "center",
  },
  chipActive: { borderColor: "#3b82f6", backgroundColor: "#1e3a8a22" },
  chipText: { color: "#475569", fontWeight: "700", fontSize: 13 },
  chipTextActive: { color: "#60a5fa" },

  patternList: { gap: 6 },
  patternRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#0f172a", borderRadius: 12,
    borderWidth: 1, borderColor: "#1f2937", padding: 12,
  },
  patternRowActive: { borderColor: "#3b82f6", backgroundColor: "#1e3a8a22" },
  patternRadio: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2, borderColor: "#374151",
    alignItems: "center", justifyContent: "center",
  },
  patternRadioActive: { borderColor: "#3b82f6" },
  patternRadioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#3b82f6" },
  patternLabel: { fontSize: 14, fontWeight: "700", color: "#94a3b8" },
  patternLabelActive: { color: "#60a5fa" },
  patternDesc: { fontSize: 12, color: "#374151", marginTop: 2 },

  adviceCard: {
    backgroundColor: "#0f172a", borderRadius: 14,
    borderWidth: 1, borderColor: "#1e3a8a",
    padding: 14, gap: 8,
  },
  adviceHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  adviceTitle: { fontSize: 13, fontWeight: "700", color: "#3b82f6" },
  adviceText: { fontSize: 13, color: "#64748b", lineHeight: 20 },

  startBtn: {
    backgroundColor: "#2563eb", borderRadius: 16, padding: 18,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    shadowColor: "#3b82f6", shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  btnDisabled: { opacity: 0.4 },
  startBtnText: { color: "#fff", fontSize: 17, fontWeight: "800" },
});
