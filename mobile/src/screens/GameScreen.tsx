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
import { loadBag, BallSpec } from "./BallBagScreen";
import { logFrame } from "../api/client";

const INFO = {
  startBoard: "The board you stand on at the approach. Boards are numbered 1–39, right to left for right-handers. Most house shot players start around board 15–25.",
  targetBoard: "The board you're targeting at the arrows (about 15 feet down the lane). The arrows are at boards 5, 10, 15, 20, 25, 30, 35. Most players target the 2nd arrow (board 10).",
  impactBoard: "The board where your ball contacts the pins at the pin deck. Ideal entry for a right-hander is around the 17-board (between the 1 and 3 pins).",
  speed: "Ball speed measured at the pins in mph. Most league bowlers average 15–18 mph. Faster = less hook. Slower = more hook and more time to read the lane.",
  hook: "How much your ball curved from its launch angle to the pins. 1 = almost straight, 10 = aggressive snap at the breakpoint. Rate what you felt this shot.",
  standing: "Tap the pins that are STILL STANDING after your shot. Leave it empty for a strike — no pins standing.",
};

const ALL_PINS = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

// standing pins bitmask → Set
const bitmaskToSet = (mask: number): Set<number> => {
  const s = new Set<number>();
  for (let i = 0; i < 10; i++) if (mask & (1 << i)) s.add(i + 1);
  return s;
};

// Set of KNOCKED pins → bitmask
const knockedToBitmask = (standing: Set<number>, available: Set<number>): number =>
  [...available].filter((p) => !standing.has(p))
    .reduce((acc, p) => acc | (1 << (p - 1)), 0);

interface Frame {
  frame: number;
  isStrike: boolean;
  isSpare: boolean;
  pinsLeft: number; // count of pins left after ball 1
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
  const [currentFrame, setCurrentFrame] = useState(1);
  const [ball, setBall] = useState<1 | 2 | 3>(1);
  const [showRecommender, setShowRecommender] = useState(false);
  const [bag, setBag] = useState<BallSpec[]>([]);
  const [strikes, setStrikes] = useState(0);
  const [speeds, setSpeeds] = useState<number[]>([]);
  const [hooks, setHooks] = useState<number[]>([]);
  const [leaves, setLeaves] = useState<string[]>([]);

  React.useEffect(() => { loadBag().then(setBag); }, []);

  // Pins still standing — user taps to toggle
  const [standingBall1, setStandingBall1] = useState<Set<number>>(new Set());
  const [standingBall2, setStandingBall2] = useState<Set<number>>(new Set());
  const [standingBall3, setStandingBall3] = useState<Set<number>>(new Set());

  const [frames, setFrames] = useState<Frame[]>([]);
  const [loading, setLoading] = useState(false);

  // Shot detail fields
  const [speed, setSpeed] = useState("");
  const [startBoard, setStartBoard] = useState<number | null>(null);
  const [targetBoard, setTargetBoard] = useState<number | null>(null);
  const [impactBoard, setImpactBoard] = useState<number | null>(null);
  const [activeBoardType, setActiveBoardType] = useState<"start" | "target" | "impact" | null>("start");
  const [hook, setHook] = useState(5);

  // 10th frame: did ball 2 knock all remaining pins?
  const ball1StandingAfter = standingBall1; // pins left after ball 1
  const ball2IsStrike10 = currentFrame === 10 && standingBall2.size === 0 && ball1StandingAfter.size === 0;
  const ball2Spare10 = currentFrame === 10 && standingBall2.size === 0 && ball1StandingAfter.size > 0;

  // Available pins for ball 2: only what was left standing after ball 1
  // Exception: 10th frame after a strike, all pins reset
  const ball2Available = currentFrame === 10 && standingBall1.size === 0
    ? ALL_PINS
    : standingBall1;

  // Available for ball 3 in 10th: if ball 2 was a strike, all pins; else what's left after ball 2
  const ball3Available = ball2IsStrike10 ? ALL_PINS : standingBall2;

  const currentStanding =
    ball === 1 ? standingBall1 : ball === 2 ? standingBall2 : standingBall3;
  const currentAvailable =
    ball === 1 ? ALL_PINS : ball === 2 ? ball2Available : ball3Available;
  const setCurrentStanding =
    ball === 1 ? setStandingBall1 : ball === 2 ? setStandingBall2 : setStandingBall3;

  function togglePin(pin: number) {
    setCurrentStanding((prev) => {
      const next = new Set(prev);
      next.has(pin) ? next.delete(pin) : next.add(pin);
      return next;
    });
  }

  function markStrike() {
    // Ball 1 strike: no pins standing
    setStandingBall1(new Set());
    handleConfirm(true);
  }

  function markSpare() {
    // Ball 2 spare: clear all remaining standing
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
      // Move to ball 2
      setStandingBall2(new Set(b1Standing)); // start ball 2 with same pins standing
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

      // 10th frame ball 2
      const needsBall3 = isStrike || b2Standing.size === 0;
      if (needsBall3) {
        setStandingBall3(new Set()); // reset for ball 3
        setBall(3);
        return;
      }
      await submit(b1Standing, b2Standing, undefined, false, false);
      onFinish();
      return;
    }

    if (ball === 3) {
      const b2Standing = standingBall2;
      const b3Standing = standingBall3;
      const isSpare = !isStrike && b2Standing.size === 0;
      await submit(b1Standing, b2Standing, b3Standing, isStrike, isSpare);
      onFinish();
      return;
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
      const leaveMask = [...b1].reduce((acc, p) => acc | (1 << (p - 1)), 0);

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

      setFrames((prev) => [...prev, {
        frame: currentFrame,
        isStrike: strike,
        isSpare: spare,
        pinsLeft: b1.size,
      }]);
      if (strike) setStrikes((s) => s + 1);
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
    Alert.alert(
      "Exit Game",
      "Your progress will be lost. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Exit", style: "destructive", onPress: onFinish },
      ]
    );
  }

  function frameLabel(f: Frame) {
    if (f.isStrike) return "X";
    if (f.isSpare) return "/";
    return `${10 - f.pinsLeft}`;
  }

  const isStrikeSituation = ball === 1 && currentStanding.size === 0;
  const isSpareSituation = ball === 2 && currentStanding.size === 0;

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + 8 }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={confirmExit} style={styles.exitBtn}>
          <Text style={styles.exitText}>✕ Exit</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Frame {currentFrame} · Ball {ball}</Text>
        <TouchableOpacity onPress={() => setShowRecommender(true)} style={styles.aiBtn}>
          <Text style={styles.aiBtnText}>AI 🎳</Text>
        </TouchableOpacity>
      </View>

      {/* Scorecard */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scorecard}>
        {frames.map((f) => (
          <View key={f.frame} style={styles.frameBox}>
            <Text style={styles.frameNum}>{f.frame}</Text>
            <Text style={styles.frameScore}>{frameLabel(f)}</Text>
          </View>
        ))}
        <View style={[styles.frameBox, styles.activeFrame]}>
          <Text style={styles.frameNum}>{currentFrame}</Text>
          <Text style={styles.frameScore}>·</Text>
        </View>
      </ScrollView>

      {/* Strike / Spare quick buttons */}
      <View style={styles.quickRow}>
        {ball === 1 && (
          <TouchableOpacity style={styles.strikeBtn} onPress={markStrike} disabled={loading}>
            <Text style={styles.strikeBtnText}>STRIKE</Text>
          </TouchableOpacity>
        )}
        {ball === 2 && currentStanding.size === 0 && (
          <TouchableOpacity style={styles.spareBtn} onPress={markSpare} disabled={loading}>
            <Text style={styles.spareBtnText}>SPARE</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Pin deck */}
      <View style={styles.labelRow}>
        <Text style={styles.deckLabel}>
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

      {/* Visual board selector */}
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


      {/* Speed + Hook (ball 1 only) */}
      {ball === 1 && (
        <View style={styles.shotCard}>
          <View style={styles.shotRow}>
            <View style={styles.shotField}>
              <View style={styles.labelRow}>
                <Text style={styles.shotLabel}>Speed (mph)</Text>
                <InfoButton title="Ball Speed" content={INFO.speed} />
              </View>
              <TextInput
                style={styles.shotInput}
                placeholder="17.5"
                keyboardType="decimal-pad"
                value={speed}
                onChangeText={setSpeed}
                placeholderTextColor="#9ca3af"
              />
            </View>
            <View style={styles.shotField}>
              <View style={styles.labelRow}>
                <Text style={styles.shotLabel}>Hook: {hook}/10</Text>
                <InfoButton title="Hook Amount" content={INFO.hook} />
              </View>
              <View style={styles.hookRow}>
                {[1,2,3,4,5,6,7,8,9,10].map((v) => (
                  <TouchableOpacity
                    key={v}
                    onPress={() => setHook(v)}
                    style={[styles.hookDot, hook >= v && styles.hookDotActive]}
                  />
                ))}
              </View>
            </View>
          </View>
        </View>
      )}

      <RecommenderModal
        visible={showRecommender}
        onClose={() => setShowRecommender(false)}
        bag={bag}
        strikeRate={frames.length ? Math.round(strikes / frames.length * 100) : 0}
        recentLeaves={leaves.slice(-5)}
        oilPattern={oilPattern}
        framesPlayed={frames.length}
        avgSpeed={speeds.length ? speeds.reduce((a, b) => a + b) / speeds.length : undefined}
        avgHook={hooks.length ? hooks.reduce((a, b) => a + b) / hooks.length : undefined}
      />

      {/* Confirm button */}
      <TouchableOpacity
        style={[styles.confirmBtn, loading && styles.btnDisabled]}
        onPress={() => handleConfirm()}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.confirmBtnText}>
              {isStrikeSituation ? "STRIKE ✓"
                : isSpareSituation ? "SPARE ✓"
                : ball < 3 ? "Next Ball"
                : "Finish Game"}
            </Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#f9fafb", gap: 14 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  exitBtn: { padding: 8 },
  exitText: { color: "#ef4444", fontWeight: "600", fontSize: 14 },
  aiBtn: { backgroundColor: "#1e3a8a", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  aiBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  title: { fontSize: 18, fontWeight: "800", color: "#1e3a8a" },
  scorecard: { flexDirection: "row" },
  frameBox: {
    width: 44, height: 52, borderWidth: 1, borderColor: "#d1d5db",
    alignItems: "center", justifyContent: "center",
    borderRadius: 6, marginRight: 4, backgroundColor: "#fff",
  },
  activeFrame: { borderColor: "#1e3a8a", backgroundColor: "#eff6ff" },
  frameNum: { fontSize: 10, color: "#6b7280" },
  frameScore: { fontSize: 15, fontWeight: "800", color: "#111827" },
  quickRow: { alignItems: "center" },
  strikeBtn: {
    backgroundColor: "#1e3a8a", paddingHorizontal: 40, paddingVertical: 12,
    borderRadius: 30, width: "100%", alignItems: "center",
  },
  strikeBtnText: { color: "#fff", fontWeight: "900", fontSize: 18, letterSpacing: 1 },
  spareBtn: {
    backgroundColor: "#059669", paddingHorizontal: 40, paddingVertical: 12,
    borderRadius: 30, width: "100%", alignItems: "center",
  },
  spareBtnText: { color: "#fff", fontWeight: "900", fontSize: 18, letterSpacing: 1 },
  deckLabel: { color: "#6b7280", fontSize: 13, fontWeight: "500" },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 5, justifyContent: "center" },
  shotCard: { backgroundColor: "#fff", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#e5e7eb" },
  shotRow: { flexDirection: "row", gap: 12 },
  shotField: { flex: 1, gap: 6 },
  shotLabel: { fontSize: 11, fontWeight: "600", color: "#6b7280", textTransform: "uppercase" },
  shotInput: {
    backgroundColor: "#f9fafb", borderRadius: 8, padding: 10,
    fontSize: 16, borderWidth: 1, borderColor: "#e5e7eb", color: "#111827",
  },
  hookRow: { flexDirection: "row", gap: 4, flexWrap: "wrap" },
  hookDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#e5e7eb" },
  hookDotActive: { backgroundColor: "#1e3a8a" },
  confirmBtn: {
    backgroundColor: "#374151", padding: 16, borderRadius: 14,
    alignItems: "center", marginTop: 4,
  },
  btnDisabled: { opacity: 0.5 },
  confirmBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
