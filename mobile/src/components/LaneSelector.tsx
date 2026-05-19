import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";

// Arrow positions (boards 5,10,15,20,25,30,35 from right)
const ARROW_BOARDS = [5, 10, 15, 20, 25, 30, 35];
const TOTAL_BOARDS = 39;

interface Props {
  startBoard: number | null;
  targetBoard: number | null;
  impactBoard: number | null;
  onSelect: (type: "start" | "target" | "impact", board: number) => void;
  activeType: "start" | "target" | "impact" | null;
  onSetActive: (type: "start" | "target" | "impact") => void;
}

const TYPE_COLORS = {
  start: "#1e3a8a",
  target: "#059669",
  impact: "#dc2626",
};

const TYPE_LABELS = {
  start: "Start",
  target: "Target",
  impact: "Impact",
};

export default function LaneSelector({
  startBoard, targetBoard, impactBoard,
  onSelect, activeType, onSetActive,
}: Props) {

  function getBoardColor(board: number) {
    if (startBoard === board) return TYPE_COLORS.start;
    if (targetBoard === board) return TYPE_COLORS.target;
    if (impactBoard === board) return TYPE_COLORS.impact;
    return null;
  }

  function handleBoardPress(board: number) {
    if (!activeType) return;
    onSelect(activeType, board);
  }

  return (
    <View style={styles.container}>
      {/* Type selector buttons */}
      <View style={styles.typeRow}>
        {(["start", "target", "impact"] as const).map((type) => {
          const value = type === "start" ? startBoard : type === "target" ? targetBoard : impactBoard;
          const isActive = activeType === type;
          return (
            <TouchableOpacity
              key={type}
              style={[styles.typeBtn, { borderColor: TYPE_COLORS[type] }, isActive && { backgroundColor: TYPE_COLORS[type] }]}
              onPress={() => onSetActive(type)}
            >
              <Text style={[styles.typeBtnLabel, isActive && styles.typeBtnLabelActive]}>
                {TYPE_LABELS[type]}
              </Text>
              <Text style={[styles.typeBtnValue, { color: TYPE_COLORS[type] }, isActive && { color: "#fff" }]}>
                {value ? `Board ${value}` : "Tap lane"}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {activeType && (
        <Text style={styles.hint}>
          Tap a board to set your <Text style={{ color: TYPE_COLORS[activeType], fontWeight: "700" }}>{TYPE_LABELS[activeType]}</Text> position
        </Text>
      )}

      {/* Lane diagram */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.lane}>
          {/* Board numbers top */}
          <View style={styles.boardNumbers}>
            {[39, 35, 30, 25, 20, 15, 10, 5, 1].map((n) => (
              <Text key={n} style={[styles.boardNum, { left: boardToX(n) - 6 }]}>{n}</Text>
            ))}
          </View>

          {/* Lane surface */}
          <View style={styles.laneSurface}>
            {Array.from({ length: TOTAL_BOARDS }, (_, i) => {
              const board = TOTAL_BOARDS - i; // 39 → 1 left to right
              const color = getBoardColor(board);
              const isArrow = ARROW_BOARDS.includes(board);
              return (
                <TouchableOpacity
                  key={board}
                  onPress={() => handleBoardPress(board)}
                  style={[
                    styles.board,
                    isArrow && styles.arrowBoard,
                    color ? { backgroundColor: color } : null,
                  ]}
                  activeOpacity={activeType ? 0.6 : 1}
                >
                  {isArrow && !color && <View style={styles.arrowMark} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <LegendItem color={TYPE_COLORS.start} label="Start" />
            <LegendItem color={TYPE_COLORS.target} label="Target (arrows)" />
            <LegendItem color={TYPE_COLORS.impact} label="Impact" />
            <LegendItem color="#d97706" label="Arrow board" />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function boardToX(board: number): number {
  return (TOTAL_BOARDS - board) * 10;
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  typeRow: { flexDirection: "row", gap: 8 },
  typeBtn: {
    flex: 1, borderWidth: 2, borderRadius: 10,
    padding: 8, alignItems: "center",
  },
  typeBtnLabel: { fontSize: 11, fontWeight: "700", color: "#374151", textTransform: "uppercase" },
  typeBtnLabelActive: { color: "#fff" },
  typeBtnValue: { fontSize: 12, fontWeight: "600", marginTop: 2 },
  hint: { textAlign: "center", color: "#6b7280", fontSize: 12 },
  lane: { gap: 6 },
  boardNumbers: { height: 16, width: TOTAL_BOARDS * 10, position: "relative" },
  boardNum: { position: "absolute", fontSize: 9, color: "#9ca3af" },
  laneSurface: {
    flexDirection: "row",
    height: 80,
    width: TOTAL_BOARDS * 10,
    backgroundColor: "#fef3c7",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 4,
    overflow: "hidden",
  },
  board: {
    width: 10,
    height: "100%",
    borderRightWidth: 0.5,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  arrowBoard: { backgroundColor: "#fde68a" },
  arrowMark: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: "#d97706",
  },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, color: "#6b7280" },
});
