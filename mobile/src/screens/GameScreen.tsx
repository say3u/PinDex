import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ScrollView, ActivityIndicator, TextInput, StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import PinDeck from "../components/PinDeck";
import InfoButton from "../components/InfoModal";
import LaneSelector from "../components/LaneSelector";
import RecommenderModal from "../components/RecommenderModal";
import CoachModal from "../components/CoachModal";
import { loadBag, BallSpec } from "./BallBagScreen";
import { logFrame, deleteFrame } from "../api/client";

const INFO = {
  startBoard: "The board you stand on at the approach. Boards are numbered 1–39, right to left for right-handers. Most house shot players start around board 15–25.",
  targetBoard: "The board you're targeting at the arrows (~15 ft down lane). The arrows are at boards 5, 10, 15, 20, 25, 30, 35. Most players target the 2nd arrow (board 10).",
  impactBoard: "The board where your ball contacts the pins. Ideal entry for a right-hander is around board 17 (between the 1 and 3 pins).",
  speed: "Ball speed at the pins in mph. League average is 15–18 mph. Faster = less hook.",
  hook: "How much your ball curved. 1 = nearly straight, 10 = aggressive snap at the breakpoint.",
  standing: "Tap the pins still STANDING. Leave all untapped for a strike.",
};

const ALL_PINS = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

const knockedToBitmask = (standing: Set<number>, available: Set<number>): number =>
  [...available].filter((p) => !standing.has(p))
    .reduce((acc, p) => acc | (1 << (p - 1)), 0);

interface Frame { frame: number; isStrike: boolean; isSpare: boolean; pinsLeft: number; }
interface Snapshot {
  frame: number;
  strikes: number;
  spares: number;
  opens: number;
  speeds: number[];
  hooks: number[];
  leaves: string[];
  lastFrames: string[];
  frames: Frame[];
}
interface Props { gameId: string; bowlerId: string; handStyle: string; oilPattern: string; onFinish: () => void; }

export default function GameScreen({ gameId, bowlerId, handStyle, oilPattern, onFinish }: Props) {
  const insets = useSafeAreaInsets();

  const [currentFrame, setCurrentFrame] = useState(1);
  const [ball, setBall] = useState<1 | 2 | 3>(1);
  const [showRecommender, setShowRecommender] = useState(false);
  const [showCoach, setShowCoach] = useState(false);
  const [bag, setBag] = useState<BallSpec[]>([]);
  React.useEffect(() => { loadBag().then(setBag); }, []);

  const [strikes, setStrikes] = useState(0);
  const [spares, setSpares] = useState(0);
  const [opens, setOpens] = useState(0);
  const [speeds, setSpeeds] = useState<number[]>([]);
  const [hooks, setHooks] = useState<number[]>([]);
  const [leaves, setLeaves] = useState<string[]>([]);
  const [lastFrames, setLastFrames] = useState<string[]>([]);

  const [standingBall1, setStandingBall1] = useState<Set<number>>(new Set());
  const [standingBall2, setStandingBall2] = useState<Set<number>>(new Set());
  const [standingBall3, setStandingBall3] = useState<Set<number>>(new Set());
  const [frames, setFrames] = useState<Frame[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastSnapshot, setLastSnapshot] = useState<Snapshot | null>(null);

  const [speed, setSpeed] = useState("");
  const [hook, setHook] = useState(5);
  const [startBoard, setStartBoard] = useState<number | null>(null);
  const [targetBoard, setTargetBoard] = useState<number | null>(null);
  const [impactBoard, setImpactBoard] = useState<number | null>(null);
  const [activeBoardType, setActiveBoardType] = useState<"start" | "target" | "impact" | null>("start");

  const ball2Available = currentFrame === 10 && standingBall1.size === 0 ? ALL_PINS : standingBall1;
  const ball3Available = standingBall2.size === 0 ? ALL_PINS : standingBall2;
  const currentStanding = ball === 1 ? standingBall1 : ball === 2 ? standingBall2 : standingBall3;
  const currentAvailable = ball === 1 ? ALL_PINS : ball === 2 ? ball2Available : ball3Available;
  const setCurrentStanding = ball === 1 ? setStandingBall1 : ball === 2 ? setStandingBall2 : setStandingBall3;

  function togglePin(pin: number) {
    setCurrentStanding((prev) => { const n = new Set(prev); n.has(pin) ? n.delete(pin) : n.add(pin); return n; });
  }

  function markStrike() {
    if (ball === 1) setStandingBall1(new Set());
    else if (ball === 2) setStandingBall2(new Set());
    else setStandingBall3(new Set());
    handleConfirm(ball === 1);
  }

  function markSpare() { setStandingBall2(new Set()); handleConfirm(false, true); }

  async function handleConfirm(forceStrike = false, forceSpare = false) {
    const b1Standing = forceStrike ? new Set<number>() : standingBall1;
    const isStrike = b1Standing.size === 0;

    if (ball === 1) {
      if (isStrike && currentFrame < 10) {
        const snap: Snapshot = { frame: currentFrame, strikes, spares, opens, speeds: [...speeds], hooks: [...hooks], leaves: [...leaves], lastFrames: [...lastFrames], frames: [...frames] };
        await submit(b1Standing, undefined, undefined, true, false);
        advance();
        setLastSnapshot(snap);
        return;
      }
      setStandingBall2(new Set(b1Standing)); setBall(2); return;
    }
    if (ball === 2) {
      const b2Standing = forceSpare ? new Set<number>() : standingBall2;
      const isSpare = !isStrike && b2Standing.size === 0;
      if (currentFrame < 10) {
        const snap: Snapshot = { frame: currentFrame, strikes, spares, opens, speeds: [...speeds], hooks: [...hooks], leaves: [...leaves], lastFrames: [...lastFrames], frames: [...frames] };
        await submit(b1Standing, b2Standing, undefined, false, isSpare);
        advance();
        setLastSnapshot(snap);
        return;
      }
      if (isStrike || b2Standing.size === 0) { setStandingBall3(new Set()); setBall(3); return; }
      await submit(b1Standing, b2Standing, undefined, false, false); onFinish(); return;
    }
    if (ball === 3) {
      await submit(b1Standing, standingBall2, standingBall3, isStrike, !isStrike && standingBall2.size === 0);
      onFinish();
    }
  }

  async function submit(b1: Set<number>, b2: Set<number> | undefined, b3: Set<number> | undefined, strike: boolean, spare: boolean) {
    setLoading(true);
    try {
      await logFrame({
        game_id: gameId, frame_number: currentFrame,
        ball1_pins: knockedToBitmask(b1, ALL_PINS),
        ball2_pins: b2 !== undefined ? knockedToBitmask(b2, ball2Available) : undefined,
        ball3_pins: b3 !== undefined ? knockedToBitmask(b3, ball3Available) : undefined,
        ball1_speed: speed ? parseFloat(speed) : undefined,
        ball1_arrow: targetBoard ?? undefined,
        ball1_hook: hook, hand_style: handStyle,
      });
      const label = strike ? "strike" : spare ? "spare" : "open";
      setFrames((p) => [...p, { frame: currentFrame, isStrike: strike, isSpare: spare, pinsLeft: b1.size }]);
      setLastFrames((p) => [...p, label]);
      if (strike) setStrikes((s) => s + 1);
      else if (spare) setSpares((s) => s + 1);
      else setOpens((s) => s + 1);
      if (speed) setSpeeds((p) => [...p, parseFloat(speed)]);
      setHooks((p) => [...p, hook]);
      if (b1.size > 0) setLeaves((p) => [...p, `${b1.size} pin${b1.size > 1 ? "s" : ""} left`]);
    } catch { Alert.alert("Error", "Failed to save frame."); }
    finally { setLoading(false); }
  }

  function advance() {
    setCurrentFrame((f) => f + 1); setBall(1);
    setStandingBall1(new Set()); setStandingBall2(new Set()); setStandingBall3(new Set());
    setSpeed(""); setStartBoard(null); setTargetBoard(null); setImpactBoard(null);
    setActiveBoardType("start"); setHook(5);
  }

  function confirmExit() {
    Alert.alert("Exit Game", "Exit and return to home?", [
      { text: "Stay", style: "cancel" },
      { text: "Exit", style: "destructive", onPress: onFinish },
    ]);
  }

  async function undoFrame() {
    if (!lastSnapshot) return;
    const snap = lastSnapshot;
    try {
      await deleteFrame(gameId, snap.frame);
    } catch {
      Alert.alert("Undo Error", "Could not delete the last frame from the server.");
      return;
    }
    setCurrentFrame(snap.frame);
    setStrikes(snap.strikes);
    setSpares(snap.spares);
    setOpens(snap.opens);
    setSpeeds(snap.speeds);
    setHooks(snap.hooks);
    setLeaves(snap.leaves);
    setLastFrames(snap.lastFrames);
    setFrames(snap.frames);
    setStandingBall1(new Set());
    setStandingBall2(new Set());
    setStandingBall3(new Set());
    setSpeed("");
    setStartBoard(null);
    setTargetBoard(null);
    setImpactBoard(null);
    setActiveBoardType("start");
    setHook(5);
    setBall(1);
    setLastSnapshot(null);
  }

  const avgSpeed = speeds.length ? speeds.reduce((a, b) => a + b) / speeds.length : undefined;
  const avgHook = hooks.length ? hooks.reduce((a, b) => a + b) / hooks.length : undefined;
  const isStrikeSituation = ball === 1 && currentStanding.size === 0;
  const isSpareSituation = ball === 2 && currentStanding.size === 0 && currentFrame < 10;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0f1e" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={confirmExit} style={styles.exitBtn}>
          <Ionicons name="close" size={22} color="#475569" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerFrame}>Frame {currentFrame}</Text>
          <Text style={styles.headerBall}>Ball {ball}{currentFrame === 10 ? " · 10th" : ""}</Text>
        </View>

        <View style={styles.headerActions}>
          {lastSnapshot !== null && (
            <TouchableOpacity onPress={undoFrame} style={styles.iconBtn}>
              <Ionicons name="arrow-undo" size={19} color="#64748b" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => setShowCoach(true)} style={styles.iconBtn}>
            <MaterialCommunityIcons name="target" size={19} color="#64748b" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowRecommender(true)} style={[styles.iconBtn, styles.iconBtnBlue]}>
            <MaterialCommunityIcons name="bowling" size={19} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Scorecard ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scorecardWrap} contentContainerStyle={styles.scorecard}>
        {Array.from({ length: 10 }, (_, i) => {
          const f = frames.find((fr) => fr.frame === i + 1);
          const isCurrent = i + 1 === currentFrame;
          const mark = !f ? null : f.isStrike ? "X" : f.isSpare ? "/" : `${10 - f.pinsLeft}`;
          return (
            <View key={i} style={[
              styles.frameCell,
              f?.isStrike && styles.frameCellStrike,
              f?.isSpare && styles.frameCellSpare,
              isCurrent && styles.frameCellActive,
            ]}>
              <Text style={[styles.frameCellNum, (f?.isStrike || f?.isSpare) && styles.frameCellNumLight]}>{i + 1}</Text>
              <Text style={[styles.frameCellMark, (f?.isStrike || f?.isSpare) && styles.frameCellMarkLight]}>
                {mark ?? (isCurrent ? "·" : "")}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Strike / Spare quick buttons ── */}
        <View style={styles.quickRow}>
          {(ball === 1 || (currentFrame === 10 && ball > 1)) && (
            <TouchableOpacity style={styles.strikeBtn} onPress={markStrike} disabled={loading}>
              <MaterialCommunityIcons name="lightning-bolt" size={18} color="#fbbf24" />
              <Text style={styles.strikeBtnText}>{currentFrame === 10 && ball === 3 ? "ALL DOWN" : "STRIKE"}</Text>
            </TouchableOpacity>
          )}
          {ball === 2 && currentFrame < 10 && (
            <TouchableOpacity style={styles.spareBtn} onPress={markSpare} disabled={loading}>
              <Ionicons name="checkmark-circle" size={18} color="#34d399" />
              <Text style={styles.spareBtnText}>SPARE</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Pin Deck ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>PINS</Text>
            <InfoButton title="Pin Deck" content={INFO.standing} />
          </View>
          <PinDeck standing={currentStanding} available={currentAvailable} onToggle={togglePin} disabled={loading} />
        </View>

        {/* ── Board selector ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>BOARD POSITIONS</Text>
          <LaneSelector
            startBoard={startBoard} targetBoard={targetBoard} impactBoard={impactBoard}
            activeType={activeBoardType} onSetActive={setActiveBoardType}
            onSelect={(type, board) => {
              if (type === "start") setStartBoard(board);
              else if (type === "target") setTargetBoard(board);
              else setImpactBoard(board);
            }}
          />
        </View>

        {/* ── Shot data (ball 1 only) ── */}
        {ball === 1 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>SHOT DATA</Text>
            <View style={styles.shotRow}>
              <View style={styles.shotField}>
                <View style={styles.shotLabelRow}>
                  <Text style={styles.shotFieldLabel}>Speed (mph)</Text>
                  <InfoButton title="Ball Speed" content={INFO.speed} />
                </View>
                <TextInput
                  style={styles.shotInput}
                  placeholder="17.5"
                  keyboardType="decimal-pad"
                  value={speed}
                  onChangeText={setSpeed}
                  placeholderTextColor="#374151"
                />
              </View>
              <View style={styles.shotField}>
                <View style={styles.shotLabelRow}>
                  <Text style={styles.shotFieldLabel}>Hook  {hook}/10</Text>
                  <InfoButton title="Hook Amount" content={INFO.hook} />
                </View>
                <View style={styles.hookRow}>
                  {[1,2,3,4,5,6,7,8,9,10].map((v) => (
                    <TouchableOpacity key={v} onPress={() => setHook(v)}
                      style={[styles.hookDot, hook >= v && styles.hookDotOn]} />
                  ))}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ── Confirm ── */}
        <TouchableOpacity
          style={[
            styles.confirmBtn,
            isStrikeSituation && styles.confirmBtnStrike,
            isSpareSituation && styles.confirmBtnSpare,
            loading && styles.btnDisabled,
          ]}
          onPress={() => handleConfirm()}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : (
            <View style={styles.confirmInner}>
              {isStrikeSituation && <MaterialCommunityIcons name="lightning-bolt" size={20} color="#fbbf24" />}
              {isSpareSituation && <Ionicons name="checkmark-circle" size={20} color="#34d399" />}
              {!isStrikeSituation && !isSpareSituation && <Ionicons name="arrow-forward" size={18} color="#fff" />}
              <Text style={styles.confirmText}>
                {isStrikeSituation ? "STRIKE — Confirm" : isSpareSituation ? "SPARE — Confirm" : ball < 3 ? "Next Ball" : "Finish Game"}
              </Text>
            </View>
          )}
        </TouchableOpacity>

      </ScrollView>

      {/* ── Modals ── */}
      <RecommenderModal
        visible={showRecommender} onClose={() => setShowRecommender(false)}
        bag={bag} strikeRate={frames.length ? Math.round(strikes / frames.length * 100) : 0}
        recentLeaves={leaves.slice(-5)} oilPattern={oilPattern} framesPlayed={frames.length}
        avgSpeed={avgSpeed} avgHook={avgHook}
      />
      <CoachModal
        visible={showCoach} onClose={() => setShowCoach(false)}
        framesPlayed={frames.length} strikes={strikes} spares={spares} opens={opens}
        recentLeaves={leaves.slice(-5)} lastFrames={lastFrames} oilPattern={oilPattern}
        ballName={bag[0]?.name} handStyle={handStyle} avgSpeed={avgSpeed} avgHook={avgHook}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0f1e" },

  // Header
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderColor: "#1f2937",
  },
  exitBtn: { padding: 6 },
  headerCenter: { flex: 1, alignItems: "center" },
  headerFrame: { fontSize: 17, fontWeight: "800", color: "#f1f5f9" },
  headerBall: { fontSize: 12, color: "#475569", marginTop: 1 },
  headerActions: { flexDirection: "row", gap: 8 },
  iconBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: "#111827", borderWidth: 1, borderColor: "#1f2937",
    alignItems: "center", justifyContent: "center",
  },
  iconBtnBlue: { backgroundColor: "#1d4ed8", borderColor: "#2563eb" },

  // Scorecard
  scorecardWrap: { borderBottomWidth: 1, borderColor: "#1f2937" },
  scorecard: { flexDirection: "row", paddingHorizontal: 12, paddingVertical: 10, gap: 4 },
  frameCell: {
    width: 40, height: 50, borderRadius: 10,
    backgroundColor: "#111827", borderWidth: 1, borderColor: "#1f2937",
    alignItems: "center", justifyContent: "center",
  },
  frameCellStrike: { backgroundColor: "#78350f", borderColor: "#92400e" },
  frameCellSpare: { backgroundColor: "#064e3b", borderColor: "#065f46" },
  frameCellActive: { borderColor: "#3b82f6", borderWidth: 2 },
  frameCellNum: { fontSize: 9, color: "#374151" },
  frameCellNumLight: { color: "rgba(255,255,255,0.4)" },
  frameCellMark: { fontSize: 15, fontWeight: "900", color: "#f1f5f9" },
  frameCellMarkLight: { color: "#fde68a" },

  // Body scroll
  body: { flex: 1 },
  bodyContent: { padding: 14, gap: 12, paddingBottom: 32 },

  // Quick buttons
  quickRow: { gap: 8 },
  strikeBtn: {
    backgroundColor: "#1c1007", borderWidth: 1, borderColor: "#92400e",
    borderRadius: 14, padding: 15,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
  },
  strikeBtnText: { color: "#fbbf24", fontWeight: "900", fontSize: 16, letterSpacing: 1 },
  spareBtn: {
    backgroundColor: "#022c22", borderWidth: 1, borderColor: "#065f46",
    borderRadius: 14, padding: 15,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
  },
  spareBtnText: { color: "#34d399", fontWeight: "900", fontSize: 16, letterSpacing: 1 },

  // Cards
  card: {
    backgroundColor: "#111827", borderRadius: 18,
    borderWidth: 1, borderColor: "#1f2937",
    padding: 16, gap: 12,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitle: { fontSize: 11, fontWeight: "700", color: "#374151", letterSpacing: 1.2 },

  // Shot data
  shotRow: { flexDirection: "row", gap: 12 },
  shotField: { flex: 1, gap: 8 },
  shotLabelRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  shotFieldLabel: { fontSize: 11, fontWeight: "600", color: "#6b7280" },
  shotInput: {
    backgroundColor: "#0f172a", borderRadius: 10, padding: 11,
    fontSize: 16, borderWidth: 1, borderColor: "#1f2937", color: "#f1f5f9",
  },
  hookRow: { flexDirection: "row", gap: 5, flexWrap: "wrap" },
  hookDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#1f2937" },
  hookDotOn: { backgroundColor: "#3b82f6" },

  // Confirm
  confirmBtn: {
    backgroundColor: "#1e293b", borderWidth: 1, borderColor: "#334155",
    borderRadius: 16, padding: 18, alignItems: "center",
  },
  confirmBtnStrike: { backgroundColor: "#1c1007", borderColor: "#92400e" },
  confirmBtnSpare: { backgroundColor: "#022c22", borderColor: "#065f46" },
  btnDisabled: { opacity: 0.4 },
  confirmInner: { flexDirection: "row", alignItems: "center", gap: 10 },
  confirmText: { color: "#f1f5f9", fontSize: 16, fontWeight: "800" },
});
