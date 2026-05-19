import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getSummary } from "../api/client";
import GameScreen from "./GameScreen";
import GameSetupScreen from "./GameSetupScreen";
import BallBagScreen from "./BallBagScreen";

const BOWLER_ID = "00000000-0000-0000-0000-000000000001";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [showBag, setShowBag] = useState(false);
  const [handStyle, setHandStyle] = useState("1hand");
  const [oilPattern, setOilPattern] = useState("house");
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => { loadSummary(); }, []);

  async function loadSummary() {
    try {
      const data = await getSummary(BOWLER_ID);
      setSummary(data);
    } catch { /* no data yet */ }
  }

  function handleStart(gameId: string, style: string, oil: string) {
    setHandStyle(style);
    setOilPattern(oil);
    setActiveGame(gameId);
    setShowSetup(false);
  }

  function handleFinish() {
    setActiveGame(null);
    loadSummary();
  }

  if (showBag) return <BallBagScreen onBack={() => setShowBag(false)} />;
  if (showSetup) return (
    <GameSetupScreen bowlerId={BOWLER_ID} onStart={handleStart} onCancel={() => setShowSetup(false)} />
  );
  if (activeGame) return (
    <GameScreen gameId={activeGame} bowlerId={BOWLER_ID} handStyle={handStyle} oilPattern={oilPattern} onFinish={handleFinish} />
  );

  const hasStats = summary && summary.total_frames > 0;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.container, { paddingTop: insets.top }]}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle="light-content" />

      {/* Hero header */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>PinDex</Text>
        <Text style={styles.heroSub}>Track every shot. Own your game.</Text>

        {/* Start button inside hero */}
        <TouchableOpacity style={styles.heroBtn} onPress={() => setShowSetup(true)}>
          <Text style={styles.heroBtnText}>Start New Game</Text>
        </TouchableOpacity>
      </View>

      {/* Stats section */}
      {hasStats ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          <View style={styles.statsGrid}>
            <StatCard
              label="Strike Rate"
              value={`${summary.strike_rate}%`}
              icon="🎳"
              color="#1e3a8a"
              bg="#eff6ff"
            />
            <StatCard
              label="Spare Conv."
              value={`${summary.spare_conversion_rate}%`}
              icon="✅"
              color="#059669"
              bg="#f0fdf4"
            />
          </View>
          {summary.top_leaves?.[0] && (
            <View style={styles.leaveCard}>
              <Text style={styles.leaveIcon}>📌</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.leaveTitle}>Most Common Leave</Text>
                <Text style={styles.leaveValue}>{summary.top_leaves[0].label}</Text>
              </View>
              <Text style={styles.leaveCount}>{summary.top_leaves[0].count}×</Text>
            </View>
          )}
          {summary.top_leaves?.length > 1 && (
            <View style={styles.moreLeaves}>
              {summary.top_leaves.slice(1, 4).map((l: any, i: number) => (
                <View key={i} style={styles.leavePill}>
                  <Text style={styles.leavePillText}>{l.label} ({l.count}×)</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🎳</Text>
          <Text style={styles.emptyText}>No games yet. Start one to track your stats.</Text>
        </View>
      )}

      {/* Ball bag button */}
      <TouchableOpacity style={styles.bagBtn} onPress={() => setShowBag(true)}>
        <Text style={styles.bagBtnIcon}>🎱</Text>
        <Text style={styles.bagBtnText}>My Ball Bag</Text>
        <Text style={styles.bagBtnChevron}>›</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function StatCard({
  label, value, icon, color, bg,
}: { label: string; value: string; icon: string; color: string; bg: string }) {
  return (
    <View style={[styles.statCard, { backgroundColor: bg }]}>
      <View style={[styles.statIconBox, { backgroundColor: color + "22" }]}>
        <Text style={styles.statIcon}>{icon}</Text>
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f1f5f9" },
  container: { gap: 20, paddingBottom: 40 },

  // Hero
  hero: {
    backgroundColor: "#0f172a",
    paddingHorizontal: 24, paddingTop: 28, paddingBottom: 32,
    gap: 6,
  },
  heroTitle: { fontSize: 38, fontWeight: "900", color: "#fff", letterSpacing: -1 },
  heroSub: { fontSize: 15, color: "#94a3b8", marginBottom: 20 },
  heroBtn: {
    backgroundColor: "#3b82f6",
    borderRadius: 16, padding: 18,
    alignItems: "center",
  },
  heroBtnText: { color: "#fff", fontSize: 17, fontWeight: "800" },

  // Stats
  section: { paddingHorizontal: 20, gap: 12 },
  sectionTitle: { fontSize: 13, fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: 0.8 },
  statsGrid: { flexDirection: "row", gap: 12 },
  statCard: {
    flex: 1, borderRadius: 20, padding: 16, gap: 6,
  },
  statIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  statIcon: { fontSize: 18 },
  statValue: { fontSize: 28, fontWeight: "900" },
  statLabel: { fontSize: 12, color: "#64748b", fontWeight: "600" },

  // Leave cards
  leaveCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16,
    flexDirection: "row", alignItems: "center", gap: 12,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  leaveIcon: { fontSize: 22 },
  leaveTitle: { fontSize: 12, color: "#64748b", fontWeight: "600" },
  leaveValue: { fontSize: 17, fontWeight: "800", color: "#0f172a", marginTop: 2 },
  leaveCount: { fontSize: 20, fontWeight: "900", color: "#94a3b8" },
  moreLeaves: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  leavePill: {
    backgroundColor: "#e2e8f0", borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  leavePillText: { fontSize: 12, color: "#475569", fontWeight: "600" },

  // Empty state
  emptyState: {
    marginHorizontal: 20, backgroundColor: "#fff",
    borderRadius: 20, padding: 32, alignItems: "center", gap: 10,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  emptyIcon: { fontSize: 36 },
  emptyText: { color: "#94a3b8", fontSize: 15, textAlign: "center" },

  // Ball bag
  bagBtn: {
    marginHorizontal: 20, backgroundColor: "#fff",
    borderRadius: 16, padding: 18,
    flexDirection: "row", alignItems: "center", gap: 12,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  bagBtnIcon: { fontSize: 22 },
  bagBtnText: { flex: 1, fontSize: 16, fontWeight: "700", color: "#0f172a" },
  bagBtnChevron: { fontSize: 22, color: "#cbd5e1" },
});
