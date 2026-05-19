import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
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
    try { setSummary(await getSummary(BOWLER_ID)); } catch { /* no data yet */ }
  }

  function handleStart(gameId: string, style: string, oil: string) {
    setHandStyle(style); setOilPattern(oil);
    setActiveGame(gameId); setShowSetup(false);
  }

  if (showBag) return <BallBagScreen onBack={() => setShowBag(false)} />;
  if (showSetup) return <GameSetupScreen bowlerId={BOWLER_ID} onStart={handleStart} onCancel={() => setShowSetup(false)} />;
  if (activeGame) return <GameScreen gameId={activeGame} bowlerId={BOWLER_ID} handStyle={handStyle} oilPattern={oilPattern} onFinish={() => { setActiveGame(null); loadSummary(); }} />;

  const hasStats = summary && summary.total_frames > 0;
  const strikeRate = hasStats ? summary.strike_rate : 0;
  const spareRate = hasStats ? summary.spare_conversion_rate : 0;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0f1e" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Logo ── */}
        <View style={styles.logo}>
          <View style={styles.logoIcon}>
            <MaterialCommunityIcons name="bowling" size={22} color="#3b82f6" />
          </View>
          <Text style={styles.logoText}>PinDex</Text>
        </View>

        {/* ── Hero CTA ── */}
        <View style={styles.heroBlock}>
          <Text style={styles.heroLabel}>READY TO BOWL?</Text>
          <TouchableOpacity style={styles.ctaBtn} onPress={() => setShowSetup(true)} activeOpacity={0.85}>
            <Ionicons name="play" size={20} color="#fff" />
            <Text style={styles.ctaBtnText}>Start New Game</Text>
          </TouchableOpacity>
        </View>

        {/* ── Stats ── */}
        {hasStats ? (
          <>
            <Text style={styles.sectionLabel}>THIS SEASON</Text>

            {/* Big stat row */}
            <View style={styles.statRow}>
              <BigStat
                value={`${strikeRate}%`}
                label="Strike Rate"
                color="#f59e0b"
                pct={strikeRate}
                icon={<MaterialCommunityIcons name="lightning-bolt" size={16} color="#f59e0b" />}
              />
              <View style={styles.statDivider} />
              <BigStat
                value={`${spareRate}%`}
                label="Spare Conv."
                color="#10b981"
                pct={spareRate}
                icon={<Ionicons name="checkmark-circle" size={16} color="#10b981" />}
              />
            </View>

            {/* Leaves */}
            {summary.top_leaves?.length > 0 && (
              <View style={styles.leavesCard}>
                <View style={styles.leavesHeader}>
                  <Ionicons name="pin" size={14} color="#6b7280" />
                  <Text style={styles.leavesTitle}>COMMON LEAVES</Text>
                </View>
                {summary.top_leaves.slice(0, 3).map((l: any, i: number) => (
                  <View key={i} style={styles.leaveRow}>
                    <Text style={styles.leaveRank}>#{i + 1}</Text>
                    <Text style={styles.leaveName}>{l.label}</Text>
                    <View style={styles.leaveBar}>
                      <View style={[styles.leaveBarFill, { width: `${Math.min(100, l.count * 20)}%` as any }]} />
                    </View>
                    <Text style={styles.leaveCount}>{l.count}×</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="bowling" size={52} color="#1f2937" />
            <Text style={styles.emptyTitle}>No games recorded yet</Text>
            <Text style={styles.emptySub}>Start a game to see your stats here</Text>
          </View>
        )}

        {/* ── Ball Bag ── */}
        <TouchableOpacity style={styles.bagRow} onPress={() => setShowBag(true)} activeOpacity={0.75}>
          <View style={styles.bagIconBox}>
            <FontAwesome5 name="bowling-ball" size={16} color="#3b82f6" />
          </View>
          <Text style={styles.bagText}>My Ball Bag</Text>
          <Ionicons name="chevron-forward" size={18} color="#374151" />
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

function BigStat({ value, label, color, pct, icon }: {
  value: string; label: string; color: string; pct: number; icon: React.ReactNode;
}) {
  return (
    <View style={styles.bigStat}>
      <View style={styles.bigStatIcon}>{icon}</View>
      <Text style={[styles.bigStatValue, { color }]}>{value}</Text>
      <Text style={styles.bigStatLabel}>{label}</Text>
      <View style={styles.bigStatBar}>
        <View style={[styles.bigStatFill, { width: `${Math.min(100, pct)}%` as any, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0f1e" },
  scroll: { padding: 20, gap: 20, paddingBottom: 48 },

  // Logo
  logo: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  logoIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "#0f172a",
    borderWidth: 1, borderColor: "#1e3a8a",
    alignItems: "center", justifyContent: "center",
  },
  logoText: { fontSize: 26, fontWeight: "900", color: "#f8fafc", letterSpacing: -0.5 },

  // Hero CTA
  heroBlock: { gap: 10 },
  heroLabel: { fontSize: 11, fontWeight: "700", color: "#374151", letterSpacing: 1.5 },
  ctaBtn: {
    backgroundColor: "#2563eb",
    borderRadius: 16, padding: 18,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    shadowColor: "#3b82f6", shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  ctaBtnText: { color: "#fff", fontSize: 17, fontWeight: "800" },

  // Section label
  sectionLabel: { fontSize: 11, fontWeight: "700", color: "#374151", letterSpacing: 1.5 },

  // Big stats
  statRow: {
    backgroundColor: "#111827",
    borderRadius: 20, borderWidth: 1, borderColor: "#1f2937",
    flexDirection: "row", padding: 20, gap: 0,
  },
  bigStat: { flex: 1, gap: 4 },
  bigStatIcon: { marginBottom: 4 },
  bigStatValue: { fontSize: 36, fontWeight: "900", letterSpacing: -1 },
  bigStatLabel: { fontSize: 11, color: "#6b7280", fontWeight: "600", textTransform: "uppercase" },
  bigStatBar: { height: 3, backgroundColor: "#1f2937", borderRadius: 2, marginTop: 8 },
  bigStatFill: { height: 3, borderRadius: 2 },
  statDivider: { width: 1, backgroundColor: "#1f2937", marginHorizontal: 16, alignSelf: "stretch" },

  // Leaves card
  leavesCard: {
    backgroundColor: "#111827",
    borderRadius: 20, borderWidth: 1, borderColor: "#1f2937",
    padding: 18, gap: 12,
  },
  leavesHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  leavesTitle: { fontSize: 11, fontWeight: "700", color: "#6b7280", letterSpacing: 1.2 },
  leaveRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  leaveRank: { fontSize: 11, color: "#374151", fontWeight: "700", width: 20 },
  leaveName: { fontSize: 14, color: "#d1d5db", fontWeight: "600", width: 110 },
  leaveBar: { flex: 1, height: 4, backgroundColor: "#1f2937", borderRadius: 2 },
  leaveBarFill: { height: 4, backgroundColor: "#f59e0b", borderRadius: 2 },
  leaveCount: { fontSize: 12, color: "#6b7280", fontWeight: "700", width: 24, textAlign: "right" },

  // Empty state
  emptyState: { alignItems: "center", gap: 8, paddingVertical: 32 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#374151" },
  emptySub: { fontSize: 13, color: "#1f2937" },

  // Ball bag
  bagRow: {
    backgroundColor: "#111827", borderRadius: 16,
    borderWidth: 1, borderColor: "#1f2937",
    flexDirection: "row", alignItems: "center",
    padding: 16, gap: 12,
  },
  bagIconBox: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: "#0f172a", borderWidth: 1, borderColor: "#1e3a8a",
    alignItems: "center", justifyContent: "center",
  },
  bagText: { flex: 1, fontSize: 15, fontWeight: "700", color: "#d1d5db" },
});
