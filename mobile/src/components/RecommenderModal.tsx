import React, { useState } from "react";
import {
  Modal, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
} from "react-native";
import { recommendBall } from "../api/client";
import { BallSpec } from "../screens/BallBagScreen";

interface Props {
  visible: boolean;
  onClose: () => void;
  bag: BallSpec[];
  strikeRate: number;
  recentLeaves: string[];
  oilPattern: string;
  framesPlayed: number;
  avgSpeed?: number;
  avgHook?: number;
}

export default function RecommenderModal({
  visible, onClose, bag, strikeRate, recentLeaves,
  oilPattern, framesPlayed, avgSpeed, avgHook,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [rec, setRec] = useState<{ recommended_ball: string; reason: string; adjustment: string } | null>(null);
  const [error, setError] = useState(false);

  async function getRecommendation() {
    if (bag.length === 0) return;
    setLoading(true);
    setError(false);
    setRec(null);
    try {
      const result = await recommendBall({
        balls: bag,
        strike_rate: strikeRate,
        recent_leaves: recentLeaves,
        oil_pattern: oilPattern,
        frames_played: framesPlayed,
        avg_speed: avgSpeed,
        avg_hook: avgHook,
      });
      setRec(result);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  function handleOpen() {
    if (!rec) getRecommendation();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onShow={handleOpen}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.card}>
          <Text style={styles.title}>AI Ball Recommendation</Text>

          {bag.length === 0 && (
            <Text style={styles.noBag}>
              Add balls to your bag first — go to My Bag from the home screen.
            </Text>
          )}

          {loading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#1e3a8a" />
              <Text style={styles.loadingText}>Analyzing your session...</Text>
            </View>
          )}

          {error && (
            <Text style={styles.errorText}>Could not get recommendation. Check your connection.</Text>
          )}

          {rec && (
            <View style={styles.recContent}>
              <View style={styles.ballChip}>
                <Text style={styles.ballChipLabel}>Recommended</Text>
                <Text style={styles.ballChipName}>{rec.recommended_ball}</Text>
              </View>
              <Text style={styles.reason}>{rec.reason}</Text>
              <View style={styles.adjustmentCard}>
                <Text style={styles.adjustmentLabel}>Adjustment</Text>
                <Text style={styles.adjustmentText}>{rec.adjustment}</Text>
              </View>
              <TouchableOpacity onPress={getRecommendation} style={styles.reaskBtn}>
                <Text style={styles.reaskText}>Re-analyze</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  card: {
    backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, gap: 16,
  },
  title: { fontSize: 18, fontWeight: "900", color: "#111827", textAlign: "center" },
  noBag: { color: "#6b7280", textAlign: "center", fontSize: 14 },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 10, justifyContent: "center" },
  loadingText: { color: "#6b7280", fontSize: 14 },
  errorText: { color: "#ef4444", textAlign: "center", fontSize: 14 },
  recContent: { gap: 12 },
  ballChip: {
    backgroundColor: "#1e3a8a", borderRadius: 14,
    padding: 14, alignItems: "center",
  },
  ballChipLabel: { color: "#93c5fd", fontSize: 11, fontWeight: "600", textTransform: "uppercase" },
  ballChipName: { color: "#fff", fontSize: 20, fontWeight: "900", marginTop: 4 },
  reason: { color: "#374151", fontSize: 14, lineHeight: 22 },
  adjustmentCard: {
    backgroundColor: "#fef3c7", borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: "#fde68a",
  },
  adjustmentLabel: { color: "#92400e", fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  adjustmentText: { color: "#78350f", fontSize: 14, fontWeight: "600", marginTop: 4 },
  reaskBtn: { alignItems: "center" },
  reaskText: { color: "#1e3a8a", fontWeight: "600", fontSize: 14 },
  closeBtn: {
    backgroundColor: "#f3f4f6", borderRadius: 12,
    padding: 14, alignItems: "center",
  },
  closeBtnText: { fontWeight: "700", color: "#374151", fontSize: 15 },
});
