import React, { useEffect, useState } from "react";
import {
  Modal, View, Text, StyleSheet,
  TouchableOpacity, ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { getCoaching } from "../api/client";

interface Props {
  visible: boolean;
  onClose: () => void;
  framesPlayed: number;
  strikes: number;
  spares: number;
  opens: number;
  recentLeaves: string[];
  lastFrames: string[];
  oilPattern: string;
  ballName?: string;
  handStyle?: string;
  avgSpeed?: number;
  avgHook?: number;
}

interface Coaching {
  headline: string;
  advice: string;
  adjustment: string;
  is_doing_well: boolean;
}

export default function CoachModal({
  visible, onClose,
  framesPlayed, strikes, spares, opens,
  recentLeaves, lastFrames,
  oilPattern, ballName, handStyle,
  avgSpeed, avgHook,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [coaching, setCoaching] = useState<Coaching | null>(null);
  const [error, setError] = useState(false);

  const spareConv = (spares + opens) > 0
    ? Math.round(spares / (spares + opens) * 100)
    : 0;

  async function fetch() {
    setLoading(true);
    setError(false);
    setCoaching(null);
    try {
      const result = await getCoaching({
        frames_played: framesPlayed,
        strikes,
        spares,
        opens,
        recent_leaves: recentLeaves,
        spare_conversion_rate: spareConv,
        avg_speed: avgSpeed,
        avg_hook: avgHook,
        oil_pattern: oilPattern,
        ball_name: ballName,
        hand_style: handStyle,
        last_frames: lastFrames,
      });
      setCoaching(result);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (visible && framesPlayed > 0) fetch();
  }, [visible]);

  const accentColor = coaching?.is_doing_well ? "#059669" : "#f59e0b";

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.sheet}>

          {/* Handle bar */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.headerRow}>
            <MaterialCommunityIcons name="target" size={26} color="#1e3a8a" />
            <Text style={styles.headerTitle}>Coach</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          {/* Session snapshot */}
          <View style={styles.snapshotRow}>
            <SnapStat label="Strikes" value={strikes} color="#1e3a8a" />
            <SnapStat label="Spares" value={spares} color="#059669" />
            <SnapStat label="Opens" value={opens} color="#dc2626" />
            <SnapStat label="Spare%" value={`${spareConv}%`} color="#7c3aed" />
          </View>

          {loading && (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#1e3a8a" size="large" />
              <Text style={styles.loadingText}>Analyzing your session…</Text>
            </View>
          )}

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>Couldn't connect. Check your internet.</Text>
              <TouchableOpacity onPress={fetch} style={styles.retryBtn}>
                <Text style={styles.retryText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}

          {!loading && framesPlayed === 0 && (
            <Text style={styles.noDataText}>Bowl a frame first — then ask for coaching.</Text>
          )}

          {coaching && (
            <View style={styles.coachContent}>
              {/* Headline */}
              <View style={[styles.headlineCard, { borderLeftColor: accentColor }]}>
                <Text style={[styles.headlineText, { color: accentColor }]}>
                  {coaching.headline}
                </Text>
              </View>

              {/* Advice */}
              <Text style={styles.adviceText}>{coaching.advice}</Text>

              {/* Adjustment tip */}
              <View style={styles.adjustmentCard}>
                <Text style={styles.adjustmentLabel}>TRY NEXT SHOT</Text>
                <Text style={styles.adjustmentText}>{coaching.adjustment}</Text>
              </View>

              {/* Re-analyze */}
              <TouchableOpacity onPress={fetch} style={styles.reanalyzeBtn}>
                <Ionicons name="refresh" size={16} color="#6b7280" />
                <Text style={styles.reanalyzeText}>Re-analyze</Text>
              </TouchableOpacity>
            </View>
          )}

        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

function SnapStat({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <View style={styles.snapStat}>
      <Text style={[styles.snapValue, { color }]}>{value}</Text>
      <Text style={styles.snapLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 40, gap: 16,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: "#e5e7eb", alignSelf: "center", marginBottom: 4,
  },
  headerRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
  },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: "900", color: "#0f172a" },
  closeBtn: { padding: 4 },
  closeBtnText: { fontSize: 18, color: "#9ca3af" },

  snapshotRow: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderRadius: 16, padding: 16, gap: 4,
  },
  snapStat: { flex: 1, alignItems: "center", gap: 2 },
  snapValue: { fontSize: 22, fontWeight: "900" },
  snapLabel: { fontSize: 10, color: "#9ca3af", fontWeight: "600", textTransform: "uppercase" },

  loadingBox: { alignItems: "center", gap: 10, paddingVertical: 24 },
  loadingText: { color: "#6b7280", fontSize: 14 },

  errorBox: { alignItems: "center", gap: 12, paddingVertical: 12 },
  errorText: { color: "#dc2626", fontSize: 14, textAlign: "center" },
  retryBtn: { backgroundColor: "#f3f4f6", borderRadius: 10, paddingHorizontal: 20, paddingVertical: 8 },
  retryText: { color: "#374151", fontWeight: "600" },

  noDataText: { color: "#9ca3af", textAlign: "center", fontSize: 14, paddingVertical: 16 },

  coachContent: { gap: 14 },
  headlineCard: {
    borderLeftWidth: 4, paddingLeft: 12, paddingVertical: 6,
  },
  headlineText: { fontSize: 17, fontWeight: "800" },
  adviceText: { color: "#374151", fontSize: 15, lineHeight: 24 },
  adjustmentCard: {
    backgroundColor: "#eff6ff", borderRadius: 14,
    padding: 14, gap: 4,
    borderWidth: 1, borderColor: "#bfdbfe",
  },
  adjustmentLabel: {
    fontSize: 10, fontWeight: "800", color: "#3b82f6",
    letterSpacing: 0.8, textTransform: "uppercase",
  },
  adjustmentText: { color: "#1e3a8a", fontSize: 15, fontWeight: "700", lineHeight: 22 },
  reanalyzeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 4 },
  reanalyzeText: { color: "#6b7280", fontSize: 14, fontWeight: "600" },
});
