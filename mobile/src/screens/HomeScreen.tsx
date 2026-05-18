import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { createGame, getSummary } from "../api/client";
import GameScreen from "./GameScreen";

// Hardcoded for MVP — replace with auth later
const BOWLER_ID = "00000000-0000-0000-0000-000000000001";

export default function HomeScreen() {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSummary();
  }, []);

  async function loadSummary() {
    try {
      const data = await getSummary(BOWLER_ID);
      setSummary(data);
    } catch {
      // No data yet, ignore
    }
  }

  async function startGame() {
    setLoading(true);
    try {
      const game = await createGame(BOWLER_ID);
      setActiveGame(game.id);
    } catch {
      Alert.alert("Error", "Could not start game. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  function handleFinish() {
    setActiveGame(null);
    loadSummary();
  }

  if (activeGame) {
    return (
      <GameScreen gameId={activeGame} bowlerId={BOWLER_ID} onFinish={handleFinish} />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PinDex</Text>
      <Text style={styles.sub}>Track every shot. Own your game.</Text>

      {summary && summary.total_frames > 0 && (
        <View style={styles.statsCard}>
          <StatRow label="Strike Rate" value={`${summary.strike_rate}%`} />
          <StatRow label="Spare Conv." value={`${summary.spare_conversion_rate}%`} />
          {summary.top_leaves?.[0] && (
            <StatRow
              label="Most Common Leave"
              value={summary.top_leaves[0].label}
            />
          )}
        </View>
      )}

      <TouchableOpacity
        style={[styles.btn, loading && styles.btnDisabled]}
        onPress={startGame}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Start New Game</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#f9fafb" },
  title: { fontSize: 36, fontWeight: "900", color: "#1e3a8a" },
  sub: { color: "#6b7280", marginBottom: 32, fontSize: 15 },
  statsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    marginBottom: 32,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  statRow: { flexDirection: "row", justifyContent: "space-between" },
  statLabel: { color: "#6b7280", fontSize: 14 },
  statValue: { fontWeight: "700", color: "#111827", fontSize: 14 },
  btn: {
    backgroundColor: "#1e3a8a",
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 14,
    width: "100%",
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
