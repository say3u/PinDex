import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, ScrollView, SafeAreaView,
} from "react-native";

const ARROW_BOARDS = [5, 10, 15, 20, 25, 30, 35];
const TOTAL_BOARDS = 39;

// Helpful labels for notable boards
const BOARD_NOTES: Record<number, string> = {
  5:  "1st arrow",
  10: "2nd arrow",
  15: "3rd arrow",
  17: "ideal entry",
  20: "4th arrow (center)",
  25: "5th arrow",
  30: "6th arrow",
  35: "7th arrow",
};

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
  start:  "Start Board",
  target: "Target Board",
  impact: "Impact Board",
};

const TYPE_HINTS = {
  start:  "Where you stand at the approach. Right-handers typically start around boards 15–25.",
  target: "The board you aim at through the arrows (~15 ft down lane). 2nd arrow = board 10.",
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

  const selectedValue = (type: "start" | "target" | "impact") =>
    type === "start" ? startBoard : type === "target" ? targetBoard : impactBoard;

  return (
    <View style={styles.container}>
      <View style={styles.typeRow}>
        {(["start", "target", "impact"] as const).map((type) => {
          const val = selectedValue(type);
          const color = TYPE_COLORS[type];
          return (
            <TouchableOpacity
              key={type}
              style={[styles.typeBtn, { borderColor: color }, val && { backgroundColor: color }]}
              onPress={() => openModal(type)}
            >
              <Text style={[styles.typeBtnLabel, val ? styles.typeLabelSelected : { color }]}>
                {TYPE_LABELS[type].split(" ")[0]}
              </Text>
              <Text style={[styles.typeBtnValue, val ? styles.typeValueSelected : { color }]}>
                {val ? `Bd ${val}` : "Tap to set"}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Compact lane summary */}
      <CompactLane start={startBoard} target={targetBoard} impact={impactBoard} />

      {/* Full-screen board picker modal */}
      {modalType && (
        <BoardPickerModal
          type={modalType}
          currentValue={selectedValue(modalType)}
          onSelect={handleSelect}
          onClose={() => setModalType(null)}
        />
      )}
    </View>
  );
}

function BoardPickerModal({
  type, currentValue, onSelect, onClose,
}: {
  type: "start" | "target" | "impact";
  currentValue: number | null;
  onSelect: (board: number) => void;
  onClose: () => void;
}) {
  const color = TYPE_COLORS[type];

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: "#f9fafb" }]}>
        {/* Header */}
        <View style={[styles.modalHeader, { borderBottomColor: color }]}>
          <View style={styles.modalHeaderLeft} />
          <View style={styles.modalTitleGroup}>
            <Text style={[styles.modalTitle, { color }]}>{TYPE_LABELS[type]}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
            <Text style={styles.modalCloseText}>Done</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.modalHint}>{TYPE_HINTS[type]}</Text>

        {/* Lane orientation diagram */}
        <View style={styles.laneOrientation}>
          <Text style={styles.orientationLabel}>← Left (39)    Right (1) →</Text>
          <Text style={styles.orientationSub}>Right-handed bowlers: board 1 is on your right</Text>
        </View>

        {/* Board list */}
        <ScrollView
          contentContainerStyle={styles.boardList}
          showsVerticalScrollIndicator={false}
        >
          {Array.from({ length: TOTAL_BOARDS }, (_, i) => {
            const board = TOTAL_BOARDS - i; // 39 down to 1
            const isSelected = currentValue === board;
            const isArrow = ARROW_BOARDS.includes(board);
            const note = BOARD_NOTES[board];

            return (
              <TouchableOpacity
                key={board}
                style={[
                  styles.boardRow,
                  isSelected && { backgroundColor: color },
                  isArrow && !isSelected && styles.boardRowArrow,
                ]}
                onPress={() => onSelect(board)}
                activeOpacity={0.7}
              >
                {/* Board number */}
                <View style={styles.boardNumBox}>
                  <Text style={[styles.boardRowNum, isSelected && styles.boardRowNumSelected]}>
                    {board}
                  </Text>
                </View>

                {/* Arrow indicator */}
                <View style={styles.boardIndicatorArea}>
                  {isArrow && (
                    <View style={[styles.arrowIndicator, isSelected && { backgroundColor: "#fff" }]} />
                  )}
                </View>

                {/* Note */}
                <Text style={[styles.boardNote, isSelected && styles.boardNoteSelected]}>
                  {note ?? (isArrow ? "arrow" : "")}
                </Text>

                {/* Checkmark */}
                {isSelected && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// Mini lane diagram showing all 3 boards in context
function CompactLane({
  start, target, impact,
}: { start: number | null; target: number | null; impact: number | null }) {
  if (!start && !target && !impact) return null;

  return (
    <View style={styles.compactLane}>
      <View style={styles.compactTrack}>
        {/* Foul line */}
        <View style={styles.foulLine} />
        {/* Arrow zone */}
        <View style={styles.arrowZone}>
          <Text style={styles.zoneLabel}>Arrows</Text>
        </View>
        {/* Pin zone */}
        <View style={styles.pinZone}>
          <Text style={styles.zoneLabel}>Pins</Text>
        </View>

        {/* Board markers */}
        {start !== null && (
          <BoardMarker board={start} zone="foul" color={TYPE_COLORS.start} label="S" />
        )}
        {target !== null && (
          <BoardMarker board={target} zone="arrow" color={TYPE_COLORS.target} label="T" />
        )}
        {impact !== null && (
          <BoardMarker board={impact} zone="pin" color={TYPE_COLORS.impact} label="I" />
        )}
      </View>

      <View style={styles.compactLegend}>
        {start   !== null && <LegendPill color={TYPE_COLORS.start}  label={`S: Bd ${start}`} />}
        {target  !== null && <LegendPill color={TYPE_COLORS.target} label={`T: Bd ${target}`} />}
        {impact  !== null && <LegendPill color={TYPE_COLORS.impact} label={`I: Bd ${impact}`} />}
      </View>
    </View>
  );
}

function BoardMarker({
  board, zone, color, label,
}: { board: number; zone: "foul" | "arrow" | "pin"; color: string; label: string }) {
  // Convert board 1–39 to a left% (board 39 = left edge, board 1 = right edge)
  const pct = ((39 - board) / 38) * 100;
  const top = zone === "foul" ? 6 : zone === "arrow" ? 30 : 54;
  return (
    <View
      style={[
        styles.boardMarker,
        { left: `${pct}%` as any, top, backgroundColor: color },
      ]}
    >
      <Text style={styles.boardMarkerText}>{label}</Text>
    </View>
  );
}

function LegendPill({ color, label }: { color: string; label: string }) {
  return (
    <View style={[styles.legendPill, { backgroundColor: color }]}>
      <Text style={styles.legendPillText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },

  // Type selector
  typeRow: { flexDirection: "row", gap: 8 },
  typeBtn: {
    flex: 1, borderWidth: 2, borderRadius: 10,
    padding: 8, alignItems: "center",
  },
  typeBtnLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  typeLabelSelected: { color: "#fff" },
  typeBtnValue: { fontSize: 12, fontWeight: "600", marginTop: 2 },
  typeValueSelected: { color: "#fff" },

  // Compact lane
  compactLane: { gap: 6 },
  compactTrack: {
    height: 80,
    backgroundColor: "#fef3c7",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    overflow: "hidden",
    position: "relative",
  },
  foulLine: {
    position: "absolute", top: 18, left: 0, right: 0,
    height: 2, backgroundColor: "#ef4444",
  },
  arrowZone: {
    position: "absolute", top: 28, left: 0, right: 0, height: 24,
    backgroundColor: "rgba(253,230,138,0.4)",
    alignItems: "center", justifyContent: "center",
  },
  pinZone: {
    position: "absolute", top: 52, left: 0, right: 0, height: 28,
    backgroundColor: "rgba(167,243,208,0.4)",
    alignItems: "center", justifyContent: "center",
  },
  zoneLabel: { fontSize: 9, color: "#9ca3af" },
  boardMarker: {
    position: "absolute",
    width: 18, height: 18, borderRadius: 9,
    alignItems: "center", justifyContent: "center",
    marginLeft: -9,
  },
  boardMarkerText: { color: "#fff", fontSize: 9, fontWeight: "800" },
  compactLegend: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  legendPill: {
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },
  legendPillText: { color: "#fff", fontSize: 11, fontWeight: "700" },

  // Modal
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 2,
  },
  modalHeaderLeft: { flex: 1 },
  modalTitleGroup: { flex: 3, alignItems: "center" },
  modalTitle: { fontSize: 18, fontWeight: "900" },
  modalCloseBtn: {
    flex: 1, alignItems: "flex-end",
    paddingVertical: 4, paddingHorizontal: 4,
  },
  modalCloseText: { color: "#6b7280", fontSize: 15, fontWeight: "600" },
  modalHint: {
    textAlign: "center", color: "#6b7280", fontSize: 13,
    paddingHorizontal: 20, paddingVertical: 10, lineHeight: 18,
  },

  // Lane orientation
  laneOrientation: {
    backgroundColor: "#eff6ff", marginHorizontal: 16, borderRadius: 8,
    padding: 8, alignItems: "center", marginBottom: 6,
  },
  orientationLabel: { fontSize: 13, fontWeight: "700", color: "#1e3a8a" },
  orientationSub: { fontSize: 11, color: "#6b7280", marginTop: 2 },

  // Board list
  boardList: { paddingHorizontal: 16, paddingBottom: 32, gap: 4 },
  boardRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 10,
  },
  boardRowArrow: { borderColor: "#fde68a", backgroundColor: "#fffbeb" },
  boardNumBox: { width: 32 },
  boardRowNum: { fontSize: 20, fontWeight: "900", color: "#111827" },
  boardRowNumSelected: { color: "#fff" },
  boardIndicatorArea: { width: 18, alignItems: "center" },
  arrowIndicator: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: "#d97706",
  },
  boardNote: { flex: 1, fontSize: 13, color: "#6b7280" },
  boardNoteSelected: { color: "rgba(255,255,255,0.85)" },
  checkmark: { color: "#fff", fontSize: 18, fontWeight: "900" },
});
