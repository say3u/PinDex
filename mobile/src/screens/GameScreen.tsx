import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ScrollView, ActivityIndicator, TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PinDeck from "../components/PinDeck";
import InfoButton from "../components/InfoModal";
import LaneSelector from "../components/LaneSelector";
import RecommenderModal from "../components/RecommenderModal";
import CoachModal from "../components/CoachModal";
import { loadBag, BallSpec } from "./BallBagScreen";
import { logFrame } from "../api/client";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const INFO = {
  startBoard: "The board you stand on at the approach. Boards are numbered 1–39, right to left for right-handers. Most house shot players start around board 15–25.",
  targetBoard: "The board you're targeting at the arrows (about 15 feet down the lane). The arrows are at boards 5, 10, 15, 20, 25, 30, 35. Most players target the 2nd arrow (board 10).",
  impactBoard: "The board where your ball contacts the pins at the pin deck. Ideal entry for a right-hander is around the 17-board (between the 1 and 3 pins).",
  speed: "Ball speed at the pins in mph. Most league bowlers average 15–18 mph. Faster = less hook. Slower = more hook.",
  hook: "How much your ball curved. 1 = nearly straight, 10 = aggressive snap at the breakpoint.",
  standing: "Tap the pins still STANDING after your shot. Leave all untapped for a strike.",
};

const ALL_PINS = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

const knockedToBitmask = (standing: Set<number>, available: Set<number>): number =>
  [...available].filter((p) => !standing.has(p))
    .reduce((acc, p) => acc | (1 << (p - 1)), 0);

interface Frame {
  frame: number;
  isStrike: boolean;
  isSpare: boolean;
  pinsLeft: number;
  label: string;
}

interface Props {
  gameId: string;
  bowlerId: string;
  handStyle: string;
  oilPattern: string;
  onFinish: () => void;
}

export default function GameScreen({ gameId, bowlerId, handStyle, oilPattern, onFinish }: Props) {
  const insets = useSafeAreaInsets();

  // Navigation
  const [currentFrame, setCurrentFrame] = useState(1);
  const [ball, setBall] = useState<1 | 2 | 3>(1);

  // Modals
  const [showRecommender, setShowRecommender] = useState(false);
  const [showCoach, setShowCoach] = useState(false);

  // Ball bag
  const [bag, setBag] = useState<BallSpec[]>([]);
  React.useEffect(() => { loadBag().then(setBag); }, []);

  // Session tracking
  const [strikes, setStrikes] = useState(0);
  const [spares, setSpares] = useState(0);
  const [opens, setOpens] = useState(0);
  const [speeds, setSpeeds] = useState<number[]>([]);
  const [hooks, setHooks] = useState<number[]>([]);
  const [leaves, setLeaves] = useState<string[]>([]);
  const [lastFrames, setLastFrames] = useState<string[]>([]);

  // Pin state
  const [standingBall1, setStandingBall1] = useState<Set<number>>(new Set());
  const [standingBall2, setStandingBall2] = useState<Set<number>>(new Set());
  const [standingBall3, setStandingBall3] = useState<Set<number>>(new Set());

  const [frames, setFrames] = useState<Frame[]>([]);
  const [loading, setLoading] = useState(false);

  // Shot detail
  const [speed, setSpeed] = useState("");
  const [hook, setHook] = useState(5);
  const [startBoard, setStartBoard] = useState<number | null>(null);
  const [targetBoard, setTargetBoard] = useState<number | null>(null);
  const [impactBoard, setImpactBoard] = useState<number | null>(null);
  const [activeBoardType, setActiveBoardType] = useState<"start" | "target" | "impact" | null>("start");

  // 10th frame pin availability
  const ball2Available = currentFrame === 10 && standingBall1.size === 0
    ? ALL_PINS : standingBall1;
  const ball3Available = standingBall2.size === 0 ? ALL_PINS : standingBall2;

  const currentStanding = ball === 1 ? standingBall1 : ball === 2 ? standingBall2 : standingBall3;
  const currentAvailable = ball === 1 ? ALL_PINS : ball === 2 ? ball2Available : ball3Available;
  const setCurrentStanding = ball === 1 ? setStandingBall1 : ball === 2 ? setStandingBall2 : setStandingBall3;

  function togglePin(pin: number) {
    setCurrentStanding((prev) => {
      const next = new Set(prev);
      next.has(pin) ? next.delete(pin) : next.add(pin);
      return next;
    });
  }

  function markStrike() {
    if (ball === 1) setStandingBall1(new Set());
    else if (ball === 2) setStandingBall2(new Set());
    else setStandingBall3(new Set());
    handleConfirm(ball === 1);
  }

  function markSpare() {
    setStandingBall2(new Set());
    handleConfirm(false, true);
  }

  async function handleConfirm(forceStrike = false, forceSpare = false) {
    const b1Standing = forceStrike ? new Set<number>() : standingBall1;
    const isStrike = b1Standing.size === 0;

    if (ball === 1) {
      if (isStrike && currentFrame < 10) {
        await submit(b1Standing, undefined, undefined, true, false);
        advance();
        return;
      }
      setStandingBall2(new Set(b1Standing));
      setBall(2);
      return;
    }

    if (ball === 2) {
      const b2Standing = forceSpare ? new Set<number>() : standingBall2;
      const isSpare = !isStrike && b2Standing.size === 0;

      if (currentFrame < 10) {
        await submit(b1Standing, b2Standing, undefined, false, isSpare);
        advance();
        return;
      }

      const needsBall3 = isStrike || b2Standing.size === 0;
      if (needsBall3) {
        setStandingBall3(new Set());
        setBall(3);
        return;
      }
      await submit(b1Standing, b2Standing, undefined, false, false);
      onFinish();
      return;
    }

    if (ball === 3) {
      const b3Standing = standingBall3;
      const b2Standing = standingBall2;
      const b3IsSpare = !isStrike && b2Standing.size === 0;
      await submit(b1Standing, b2Standing, b3Standing, isStrike, b3IsSpare);
      onFinish();
    }
  }

  async function submit(
    b1: Set<number>, b2: Set<number> | undefined,
    b3: Set<number> | undefined, strike: boolean, spare: boolean
  ) {
    setLoading(true);
    try {
      const ball1Knocked = knockedToBitmask(b1, ALL_PINS);
      const ball2Knocked = b2 !== undefined ? knockedToBitmask(b2, ball2Available) : undefined;
      const ball3Knocked = b3 !== undefined ? knockedToBitmask(b3, ball3Available) : undefined;

      await logFrame({
        game_id: gameId,
        frame_number: currentFrame,
        ball1_pins: ball1Knocked,
        ball2_pins: ball2Knocked,
        ball3_pins: ball3Knocked,
        ball1_speed: speed ? parseFloat(speed) : undefined,
        ball1_arrow: targetBoard ?? undefined,
        ball1_hook: hook,
        hand_style: handStyle,
      });

      const label = strike ? "strike" : spare ? "spare" : "open";
      setFrames((prev) => [...prev, { frame: currentFrame, isStrike: strike, isSpare: spare, pinsLeft: b1.size, label }]);
      setLastFrames((prev) => [...prev, label]);
      if (strike) setStrikes((s) => s + 1);
      else if (spare) setSpares((s) => s + 1);
      else setOpens((s) => s + 1);
      if (speed) setSpeeds((prev) => [...prev, parseFloat(speed)]);
      setHooks((prev) => [...prev, hook]);
      if (b1.size > 0) {
        const leaveLabel = `${b1.size} pin${b1.size > 1 ? "s" : ""} left`;
        setLeaves((prev) => [...prev, leaveLabel]);
      }
    } catch {
      Alert.alert("Error", "Failed to save frame. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  function advance() {
    setCurrentFrame((f) => f + 1);
    setBall(1);
    setStandingBall1(new Set());
    setStandingBall2(new Set());
    setStandingBall3(new Set());
    setSpeed("");
    setStartBoard(null);
    setTargetBoard(null);
    setImpactBoard(null);
    setActiveBoardType("start");
    setHook(5);
  }

  function confirmExit() {
    Alert.alert("Exit Game", "Your progress will be saved. Exit?", [
      { text: "Cancel", style: "cancel" },
      { text: "Exit", style: "destructive", onPress: onFinish },
    ]);
  }

  const avgSpeed = speeds.length ? speeds.reduce((a, b) => a + b) / speeds.length : undefined;
  const avgHook = hooks.length ? hooks.reduce((a, b) => a + b) / hooks.length : undefined;
  const isStrikeSituation = ball === 1 && currentStanding.size === 0;
  const isSpareSituation = ball === 2 && currentStanding.size === 0 && currentFrame < 10;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.container, { paddingTop: insets.top }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={confirmExit} style={styles.exitBtn}>
          <Text style={styles.exitText}>✕</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Frame {currentFrame}</Text>
          <Text style={styles.headerSub}>Ball {ball}{currentFrame === 10 ? "  ·  10th" : ""}</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowCoach(true)} style={styles.actionBtn}>
            <MaterialCommunityIcons name="target" size={20} color="#94a3b8" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowRecommender(true)} style={[styles.actionBtn, styles.actionBtnBlue]}>
            <MaterialCommunityIcons name="bowling" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Scorecard strip ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scorecardScroll}>
        <View style={styles.scorecard}>
          {frames.map((f) => (
            <View key={f.frame} style={[styles.frameBox, f.isStrike && styles.frameStrike, f.isSpare && styles.frameSpare]}>
              <Text style={[styles.frameNum, (f.isStrike || f.isSpare) && styles.frameNumLight]}>{f.frame}</Text>
              <Text style={[styles.frameMark, (f.isStrike || f.isSpare) && styles.frameMarkLight]}>
                {f.isStrike ? "X" : f.isSpare ? "/" : `${10 - f.pinsLeft}`}
              </Text>
            </View>
          ))}
          <View style={[styles.frameBox, styles.frameActive]}>
            <Text style={styles.frameNum}>{currentFrame}</Text>
            <Text style={styles.frameMark}>·</Text>
          </View>
          {Array.from({ length: Math.max(0, 10 - frames.length - 1) }, (_, i) => (
            <View key={`empty-${i}`} style={styles.frameBox}>
              <Text style={styles.frameNum}>{frames.length + i + 2}</Text>
              <Text style={styles.frameMark} />
            </View>
          ))}
        </View>
      </ScrollView>

      {/* ── Quick action row ── */}
      <View style={styles.quickRow}>
        {(ball === 1 || (currentFrame === 10 && ball > 1)) && (
          <TouchableOpacity style={styles.strikeBtn} onPress={markStrike} disabled={loading}>
            <MaterialCommunityIcons name="lightning-bolt" size={20} color="#fff" />
            <Text style={styles.strikeBtnText}>
              {currentFrame === 10 && ball === 3 ? "ALL DOWN" : "STRIKE"}
            </Text>
          </TouchableOpacity>
        )}
        {ball === 2 && currentFrame < 10 && (
          <TouchableOpacity style={styles.spareBtn} onPress={markSpare} disabled={loading}>
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.spareBtnText}>SPARE</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Pin deck ── */}
      <View style={styles.card}>
        <View style={styles.cardLabelRow}>
          <Text style={styles.cardLabel}>
            {ball === 1 ? "Tap pins LEFT STANDING" : "Tap remaining pins LEFT"}
          </Text>
          <InfoButton title="Pin Deck" content={INFO.standing} />
        </View>
        <PinDeck
          standing={currentStanding}
          available={currentAvailable}
          onToggle={togglePin}
          disabled={loading}
        />
      </View>

      {/* ── Lane board selector ── */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Board Positions</Text>
        <LaneSelector
          startBoard={startBoard}
          targetBoard={targetBoard}
          impactBoard={impactBoard}
          activeType={activeBoardType}
          onSetActive={setActiveBoardType}
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
          <Text style={styles.cardLabel}>Shot Data</Text>
          <View style={styles.shotRow}>
            {/* Speed */}
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
                placeholderTextColor="#94a3b8"
              />
            </View>
            {/* Hook */}
            <View style={styles.shotField}>
              <View style={styles.shotLabelRow}>
                <Text style={styles.shotFieldLabel}>Hook  {hook}/10</Text>
                <InfoButton title="Hook Amount" content={INFO.hook} />
              </View>
              <View style={styles.hookRow}>
                {[1,2,3,4,5,6,7,8,9,10].map((v) => (
                  <TouchableOpacity
                    key={v}
                    onPress={() => setHook(v)}
                    style={[styles.hookDot, hook >= v && styles.hookDotFilled]}
                  />
                ))}
              </View>
            </View>
          </View>
        </View>
      )}

      {/* ── Confirm button ── */}
      <TouchableOpacity
        style={[styles.confirmBtn,
          isStrikeSituation && styles.confirmBtnStrike,
          isSpareSituation && styles.confirmBtnSpare,
          loading && styles.btnDisabled,
        ]}
        onPress={() => handleConfirm()}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <View style={styles.confirmBtnInner}>
              {isStrikeSituation && <MaterialCommunityIcons name="lightning-bolt" size={20} color="#fff" />}
              {isSpareSituation && <Ionicons name="checkmark-circle" size={20} color="#fff" />}
              {!isStrikeSituation && !isSpareSituation && ball < 3 && <Ionicons name="arrow-forward" size={18} color="#fff" />}
              <Text style={styles.confirmBtnText}>
                {isStrikeSituation ? "STRIKE — Confirm"
                  : isSpareSituation ? "SPARE — Confirm"
                  : ball < 3 ? "Next Ball"
                  : "Finish Game"}
              </Text>
            </View>
        }
      </TouchableOpacity>

      {/* ── Modals ── */}
      <RecommenderModal
        visible={showRecommender}
        onClose={() => setShowRecommender(false)}
        bag={bag}
        strikeRate={frames.length ? Math.round(strikes / frames.length * 100) : 0}
        recentLeaves={leaves.slice(-5)}
        oilPattern={oilPattern}
        framesPlayed={frames.length}
        avgSpeed={avgSpeed}
        avgHook={avgHook}
      />

      <CoachModal
        visible={showCoach}
        onClose={() => setShowCoach(false)}
        framesPlayed={frames.length}
        strikes={strikes}
        spares={spares}
        opens={opens}
        recentLeaves={leaves.slice(-5)}
        lastFrames={lastFrames}
        oilPattern={oilPattern}
        ballName={bag[0]?.name}
        handStyle={handStyle}
        avgSpeed={avgSpeed}
        avgHook={avgHook}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f1f5f9" },
  container: { gap: 12, paddingBottom: 40 },

  // Header
  header: {
    backgroundColor: "#0f172a",
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16,
  },
  exitBtn: { padding: 8 },
  exitText: { color: "#64748b", fontSize: 18, fontWeight: "700" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 20, fontWeight: "900", color: "#fff" },
  headerSub: { fontSize: 12, color: "#64748b", marginTop: 1 },
  headerActions: { flexDirection: "row", gap: 8 },
  actionBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "#1e293b",
    alignItems: "center", justifyContent: "center",
  },
  actionBtnBlue: { backgroundColor: "#1d4ed8" },
  actionBtnText: { fontSize: 16 },

  // Scorecard
  scorecardScroll: { paddingHorizontal: 16 },
  scorecard: { flexDirection: "row", gap: 4, paddingVertical: 4 },
  frameBox: {
    width: 42, height: 52, borderRadius: 10,
    backgroundColor: "#fff", alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "#e2e8f0",
  },
  frameStrike: { backgroundColor: "#1e3a8a", borderColor: "#1e3a8a" },
  frameSpare: { backgroundColor: "#059669", borderColor: "#059669" },
  frameActive: { backgroundColor: "#eff6ff", borderColor: "#3b82f6", borderWidth: 2 },
  frameNum: { fontSize: 10, color: "#94a3b8" },
  frameNumLight: { color: "rgba(255,255,255,0.6)" },
  frameMark: { fontSize: 16, fontWeight: "900", color: "#0f172a" },
  frameMarkLight: { color: "#fff" },

  // Quick actions
  quickRow: { paddingHorizontal: 16, gap: 8 },
  strikeBtn: {
    backgroundColor: "#0f172a", borderRadius: 14,
    padding: 14, alignItems: "center",
    flexDirection: "row", justifyContent: "center", gap: 8,
  },
  strikeBtnText: { color: "#fff", fontWeight: "900", fontSize: 17, letterSpacing: 0.5 },
  spareBtn: {
    backgroundColor: "#059669", borderRadius: 14,
    padding: 14, alignItems: "center",
    flexDirection: "row", justifyContent: "center", gap: 8,
  },
  spareBtnText: { color: "#fff", fontWeight: "900", fontSize: 17 },

  // Cards
  card: {
    marginHorizontal: 16, backgroundColor: "#fff",
    borderRadius: 20, padding: 16, gap: 12,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
  },
  cardLabel: { fontSize: 12, fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: 0.6 },
  cardLabelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },

  // Shot data
  shotRow: { flexDirection: "row", gap: 12 },
  shotField: { flex: 1, gap: 8 },
  shotLabelRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  shotFieldLabel: { fontSize: 11, fontWeight: "600", color: "#64748b" },
  shotInput: {
    backgroundColor: "#f8fafc", borderRadius: 10, padding: 10,
    fontSize: 16, borderWidth: 1, borderColor: "#e2e8f0", color: "#0f172a",
  },
  hookRow: { flexDirection: "row", gap: 5, flexWrap: "wrap" },
  hookDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#e2e8f0" },
  hookDotFilled: { backgroundColor: "#3b82f6" },

  // Confirm
  confirmBtn: {
    marginHorizontal: 16, backgroundColor: "#334155",
    borderRadius: 16, padding: 18, alignItems: "center",
    flexDirection: "row", justifyContent: "center",
  },
  confirmBtnInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  confirmBtnStrike: { backgroundColor: "#0f172a" },
  confirmBtnSpare: { backgroundColor: "#059669" },
  btnDisabled: { opacity: 0.5 },
  confirmBtnText: { color: "#fff", fontSize: 17, fontWeight: "800" },
});
