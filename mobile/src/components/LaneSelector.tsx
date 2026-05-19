import React, { useRef, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, SafeAreaView, Pressable,
} from "react-native";

const ARROW_BOARDS = new Set([5, 10, 15, 20, 25, 30, 35]);
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
  start:  "#1e3a8a",
  target: "#059669",
  impact: "#dc2626",
};

const TYPE_LABELS = {
  start:  "Start",
  target: "Target",
  impact: "Impact",
};

const TYPE_HINTS = {
  start:  "Where you stand at the approach. Right-handers typically start around boards 15–25.",
  target: "Board you aim at through the arrows (~15 ft down lane). 2nd arrow = board 10.",
  impact: "Where your ball enters the pocket. Ideal right-hand entry is around board 17.",
};

export default function LaneSelector({
  startBoard, targetBoard, impactBoard,
  onSelect, activeType, onSetActive,
}: Props) {
  const [modalType, setModalType] = useState<"start" | "target" | "impact" | null>(null);

  function openModal(type: "start" | "target" | "impact") {
    onSetActive(type);
    setModalType(type);
  }

  function handleSelect(board: number) {
    if (!modalType) return;
    onSelect(modalType, board);
    setModalType(null);
  }

  const getValue = (type: "start" | "target" | "impact") =>
    type === "start" ? startBoard : type === "target" ? targetBoard : impactBoard;

  return (
    <View style={styles.container}>
      {/* Three type buttons */}
      <View style={styles.typeRow}>
        {(["start", "target", "impact"] as const).map((type) => {
          const val = getValue(type);
          const color = TYPE_COLORS[type];
          const active = val !== null;
          return (
            <TouchableOpacity
              key={type}
              style={[styles.typeBtn, { borderColor: color }, active && { backgroundColor: color }]}
              onPress={() => openModal(type)}
            >
              <Text style={[styles.typeBtnLabel, active ? styles.textWhite : { color }]}>
                {TYPE_LABELS[type]}
              </Text>
              <Text style={[styles.typeBtnValue, active ? styles.textWhiteFaint : { color }]}>
                {val !== null ? `Board ${val}` : "Tap to set"}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Full-screen visual lane picker */}
      {modalType !== null && (
        <LanePickerModal
          type={modalType}
          current={getValue(modalType)}
          onSelect={handleSelect}
          onClose={() => setModalType(null)}
        />
      )}
    </View>
  );
}

// ─── Visual lane picker modal ──────────────────────────────────────────────

function LanePickerModal({
  type, current, onSelect, onClose,
}: {
  type: "start" | "target" | "impact";
  current: number | null;
  onSelect: (b: number) => void;
  onClose: () => void;
}) {
  const color = TYPE_COLORS[type];
  const [selected, setSelected] = useState<number | null>(current);
  const laneWidthRef = useRef(0);

  function boardFromX(x: number): number {
    const w = laneWidthRef.current;
    if (!w) return 20;
    // Left side = board 39, right side = board 1 (right-handed convention)
    const raw = Math.round(TOTAL_BOARDS - (x / w) * (TOTAL_BOARDS - 1));
    return Math.max(1, Math.min(TOTAL_BOARDS, raw));
  }

  function handleLanePress(e: any) {
    const board = boardFromX(e.nativeEvent.locationX);
    setSelected(board);
  }

  function handleConfirm() {
    if (selected !== null) onSelect(selected);
    else onClose();
  }

  // Build board columns
  const columns = Array.from({ length: TOTAL_BOARDS }, (_, i) => {
    const board = TOTAL_BOARDS - i; // 39 → 1, left to right
    return { board, isArrow: ARROW_BOARDS.has(board), isSelected: selected === board };
  });

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalRoot}>

        {/* Header */}
        <View style={[styles.modalHeader, { borderBottomColor: color }]}>
          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color }]}>
            {TYPE_LABELS[type]} Board
          </Text>
          <TouchableOpacity
            onPress={handleConfirm}
            style={[styles.doneBtn, { backgroundColor: color }]}
          >
            <Text style={styles.doneText}>
              {selected !== null ? `Set  ${selected}` : "Skip"}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.hintText}>{TYPE_HINTS[type]}</Text>

        {/* Selected board callout */}
        <View style={[styles.boardCallout, { borderColor: color }]}>
          {selected !== null ? (
            <>
              <Text style={[styles.boardCalloutNum, { color }]}>{selected}</Text>
              <Text style={styles.boardCalloutLabel}>
                {ARROW_BOARDS.has(selected)
                  ? `Arrow ${[...ARROW_BOARDS].sort((a, b) => a - b).indexOf(selected) + 1}`
                  : selected === 17 ? "ideal entry" : `board ${selected}`}
              </Text>
            </>
          ) : (
            <Text style={styles.boardCalloutPrompt}>Tap the lane to select a board</Text>
          )}
        </View>

        {/* Visual lane — tappable */}
        <View style={styles.laneWrapper}>
          {/* Left/right labels */}
          <View style={styles.boardEdgeLabels}>
            <Text style={styles.edgeLabel}>39 ←</Text>
            <Text style={styles.edgeLabel}>→ 1</Text>
          </View>

          {/* Gutter + Lane + Gutter */}
          <View style={styles.laneRow}>
            <View style={styles.gutter} />

            {/* Lane surface — full height pressable */}
            <Pressable
              style={styles.laneSurface}
              onLayout={(e) => { laneWidthRef.current = e.nativeEvent.layout.width; }}
              onPress={handleLanePress}
            >
              {/* Pin deck zone (top) */}
              <View style={styles.pinDeck} pointerEvents="none">
                <Text style={styles.zoneText}>Pin Deck</Text>
              </View>

              {/* Mid lane */}
              <View style={styles.midLane} pointerEvents="none" />

              {/* Arrow zone */}
              <View style={styles.arrowZone} pointerEvents="none">
                <Text style={styles.zoneText}>Arrows</Text>
              </View>

              {/* Foul line */}
              <View style={styles.foulLine} pointerEvents="none">
                <Text style={styles.foulLineText}>Foul Line</Text>
              </View>

              {/* Board columns overlaid */}
              <View style={styles.boardColumns} pointerEvents="none">
                {columns.map(({ board, isArrow, isSelected }) => (
                  <View
                    key={board}
                    style={[
                      styles.boardColumn,
                      isArrow && styles.arrowColumn,
                      isSelected && { backgroundColor: color + "cc" },
                    ]}
                  >
                    {isArrow && !isSelected && (
                      <View style={styles.arrowDot} />
                    )}
                  </View>
                ))}
              </View>

              {/* Selected board indicator line */}
              {selected !== null && (
                <View
                  pointerEvents="none"
                  style={[
                    styles.selectedLine,
                    {
                      left: `${((TOTAL_BOARDS - selected) / (TOTAL_BOARDS - 1)) * 100}%` as any,
                      backgroundColor: color,
                    },
                  ]}
                />
              )}
            </Pressable>

            <View style={styles.gutter} />
          </View>

          {/* Board number tick marks */}
          <View style={styles.tickRow}>
            {[39, 35, 30, 25, 20, 15, 10, 5, 1].map((n) => {
              const pct = ((TOTAL_BOARDS - n) / (TOTAL_BOARDS - 1)) * 100;
              return (
                <Text
                  key={n}
                  style={[styles.tickLabel, { left: `${pct}%` as any }]}
                >
                  {n}
                </Text>
              );
            })}
          </View>
        </View>

        {/* Quick-tap arrow boards */}
        <View style={styles.quickSection}>
          <Text style={styles.quickLabel}>QUICK SELECT — ARROWS</Text>
          <View style={styles.quickRow}>
            {[...ARROW_BOARDS].sort((a, b) => a - b).map((b, i) => (
              <TouchableOpacity
                key={b}
                style={[
                  styles.quickBtn,
                  { borderColor: color },
                  selected === b && { backgroundColor: color },
                ]}
                onPress={() => setSelected(b)}
              >
                <Text style={[styles.quickBtnNum, selected === b && styles.textWhite]}>{b}</Text>
                <Text style={[styles.quickBtnSub, selected === b && styles.textWhiteFaint]}>
                  {i + 1}{i === 0 ? "st" : i === 1 ? "nd" : i === 2 ? "rd" : "th"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </SafeAreaView>
    </Modal>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Inline component
  container: { gap: 8 },
  typeRow: { flexDirection: "row", gap: 8 },
  typeBtn: {
    flex: 1, borderWidth: 2, borderRadius: 10,
    padding: 8, alignItems: "center",
  },
  typeBtnLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  typeBtnValue: { fontSize: 12, fontWeight: "600", marginTop: 2 },
  textWhite: { color: "#fff" },
  textWhiteFaint: { color: "rgba(255,255,255,0.8)" },

  // Modal shell
  modalRoot: { flex: 1, backgroundColor: "#0a0f1e" },
  modalHeader: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 2, gap: 8,
    backgroundColor: "#0a0f1e",
  },
  cancelBtn: { flex: 1 },
  cancelText: { color: "#64748b", fontSize: 15 },
  modalTitle: { flex: 2, textAlign: "center", fontSize: 17, fontWeight: "800" },
  doneBtn: { flex: 1, borderRadius: 8, paddingVertical: 6, alignItems: "center" },
  doneText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  hintText: {
    textAlign: "center", color: "#64748b", fontSize: 13,
    paddingHorizontal: 24, paddingVertical: 10, lineHeight: 18,
  },

  // Board callout
  boardCallout: {
    marginHorizontal: 24, borderRadius: 12, borderWidth: 2,
    padding: 12, alignItems: "center", backgroundColor: "#111827",
    marginBottom: 12, minHeight: 56, justifyContent: "center",
  },
  boardCalloutNum: { fontSize: 32, fontWeight: "900", lineHeight: 36 },
  boardCalloutLabel: { color: "#64748b", fontSize: 13, marginTop: 2 },
  boardCalloutPrompt: { color: "#475569", fontSize: 14 },

  // Lane wrapper
  laneWrapper: { paddingHorizontal: 8, gap: 0 },
  boardEdgeLabels: {
    flexDirection: "row", justifyContent: "space-between",
    paddingHorizontal: 28, marginBottom: 2,
  },
  edgeLabel: { fontSize: 11, color: "#475569", fontWeight: "600" },
  laneRow: { flexDirection: "row", alignItems: "stretch" },
  gutter: { width: 20, backgroundColor: "#1f2937", borderRadius: 2 },

  // The main lane pressable
  laneSurface: {
    flex: 1, height: 260, position: "relative", overflow: "hidden",
    backgroundColor: "#c8a96e",
    borderLeftWidth: 2, borderRightWidth: 2, borderColor: "#a0785a",
  },

  // Zones (absolutely positioned, stacked)
  pinDeck: {
    position: "absolute", top: 0, left: 0, right: 0, height: 48,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center", justifyContent: "center",
    borderBottomWidth: 1, borderColor: "rgba(0,0,0,0.15)",
  },
  midLane: {
    position: "absolute", top: 48, left: 0, right: 0, height: 110,
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  arrowZone: {
    position: "absolute", top: 158, left: 0, right: 0, height: 52,
    backgroundColor: "rgba(253,230,138,0.35)",
    alignItems: "center", justifyContent: "center",
  },
  foulLine: {
    position: "absolute", bottom: 0, left: 0, right: 0, height: 50,
    backgroundColor: "rgba(0,0,0,0.08)",
    borderTopWidth: 3, borderColor: "#ef4444",
    alignItems: "center", justifyContent: "center",
  },
  zoneText: { fontSize: 10, color: "rgba(0,0,0,0.35)", fontWeight: "600", letterSpacing: 0.5 },
  foulLineText: { fontSize: 10, color: "#ef4444", fontWeight: "600", marginTop: 8 },

  // Board columns overlay (non-interactive)
  boardColumns: {
    position: "absolute", top: 0, bottom: 0, left: 0, right: 0,
    flexDirection: "row",
  },
  boardColumn: {
    flex: 1, borderRightWidth: 0.5,
    borderColor: "rgba(0,0,0,0.08)",
    alignItems: "center",
  },
  arrowColumn: { backgroundColor: "rgba(253,230,138,0.2)" },
  arrowDot: {
    position: "absolute", top: 166,
    width: 5, height: 5, borderRadius: 2.5,
    backgroundColor: "#b45309",
  },

  // Selected board vertical highlight line
  selectedLine: {
    position: "absolute", top: 0, bottom: 0, width: 3,
    marginLeft: -1.5,
  },

  // Tick labels row
  tickRow: {
    height: 20, position: "relative", marginTop: 4,
    paddingHorizontal: 20,
  },
  tickLabel: {
    position: "absolute", fontSize: 10, color: "#475569",
    transform: [{ translateX: -8 }],
  },

  // Quick-tap arrow section
  quickSection: { marginTop: 16, paddingHorizontal: 16, gap: 8 },
  quickLabel: { fontSize: 10, fontWeight: "700", color: "#475569", letterSpacing: 0.8 },
  quickRow: { flexDirection: "row", gap: 6 },
  quickBtn: {
    flex: 1, borderWidth: 2, borderRadius: 8,
    paddingVertical: 8, alignItems: "center",
    backgroundColor: "#111827",
  },
  quickBtnNum: { fontSize: 15, fontWeight: "800", color: "#f1f5f9" },
  quickBtnSub: { fontSize: 10, color: "#475569", marginTop: 1 },
});
