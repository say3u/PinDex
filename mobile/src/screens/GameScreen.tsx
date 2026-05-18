import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import PinDeck from "../components/PinDeck";
import { logFrame } from "../api/client";

// Convert set of knocked pins to bitmask (pin 1 = bit 0)
const toBitmask = (pins: Set<number>) =>
  [...pins].reduce((acc, p) => acc | (1 << (p - 1)), 0);

const ALL_PINS = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

interface Frame {
  frame: number;
  ball1: Set<number>;
  ball2?: Set<number>;
  ball3?: Set<number>;
  isStrike: boolean;
  isSpare: boolean;
}

interface Props {
  gameId: string;
  bowlerId: string;
  onFinish: () => void;
}

export default function GameScreen({ gameId, bowlerId, onFinish }: Props) {
  const [currentFrame, setCurrentFrame] = useState(1);
  const [ball, setBall] = useState<1 | 2 | 3>(1);
  const [ball1Knocked, setBall1Knocked] = useState<Set<number>>(new Set());
  const [ball2Knocked, setBall2Knocked] = useState<Set<number>>(new Set());
  const [frames, setFrames] = useState<Frame[]>([]);
  const [loading, setLoading] = useState(false);

  const currentKnocked = ball === 1 ? ball1Knocked : ball2Knocked;
  const setCurrentKnocked = ball === 1 ? setBall1Knocked : setBall2Knocked;

  // Pins available to knock depend on ball
  const availablePins =
    ball === 1
      ? ALL_PINS
      : new Set([...ALL_PINS].filter((p) => !ball1Knocked.has(p)));

  function togglePin(pin: number) {
    if (!availablePins.has(pin)) return;
    setCurrentKnocked((prev) => {
      const next = new Set(prev);
      next.has(pin) ? next.delete(pin) : next.add(pin);
      return next;
    });
  }

  async function confirmBall() {
    const isStrike = ball === 1 && ball1Knocked.size === 10;
    const isSpare =
      ball === 2 && ball1Knocked.size + ball2Knocked.size === 10;

    if (ball === 1 && (isStrike || currentFrame === 10)) {
      if (isStrike && currentFrame < 10) {
        await submitFrame(ball1Knocked, undefined, undefined, true, false);
        advance();
        return;
      }
    }

    if (ball === 2) {
      if (currentFrame < 10) {
        await submitFrame(ball1Knocked, ball2Knocked, undefined, false, isSpare);
        advance();
        return;
      }
    }

    // 10th frame special handling
    if (currentFrame === 10) {
      if (ball === 1 && isStrike) {
        setBall(2);
        setBall2Knocked(new Set());
        return;
      }
      if (ball === 2) {
        const needsBall3 = isStrike || isSpare;
        if (needsBall3) {
          setBall(3);
          return;
        }
        await submitFrame(ball1Knocked, ball2Knocked, undefined, false, isSpare);
        onFinish();
        return;
      }
      if (ball === 3) {
        await submitFrame(
          ball1Knocked,
          ball2Knocked,
          currentKnocked,
          ball1Knocked.size === 10,
          isSpare
        );
        onFinish();
        return;
      }
    }

    setBall(2);
  }

  async function submitFrame(
    b1: Set<number>,
    b2: Set<number> | undefined,
    b3: Set<number> | undefined,
    strike: boolean,
    spare: boolean
  ) {
    setLoading(true);
    try {
      await logFrame({
        game_id: gameId,
        frame_number: currentFrame,
        ball1_pins: toBitmask(b1),
        ball2_pins: b2 !== undefined ? toBitmask(b2) : undefined,
        ball3_pins: b3 !== undefined ? toBitmask(b3) : undefined,
      });
      setFrames((prev) => [
        ...prev,
        { frame: currentFrame, ball1: b1, ball2: b2, ball3: b3, isStrike: strike, isSpare: spare },
      ]);
    } catch {
      Alert.alert("Error", "Failed to save frame. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  function advance() {
    setCurrentFrame((f) => f + 1);
    setBall(1);
    setBall1Knocked(new Set());
    setBall2Knocked(new Set());
  }

  function frameLabel(f: Frame) {
    if (f.isStrike) return "X";
    if (f.isSpare) return `${f.ball1.size} /`;
    return `${f.ball1.size} ${f.ball2?.size ?? "-"}`;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Frame {currentFrame} — Ball {ball}</Text>

      {/* Scorecard */}
      <ScrollView horizontal style={styles.scorecard}>
        {frames.map((f) => (
          <View key={f.frame} style={styles.frameBox}>
            <Text style={styles.frameNum}>{f.frame}</Text>
            <Text style={styles.frameScore}>{frameLabel(f)}</Text>
          </View>
        ))}
        <View style={[styles.frameBox, styles.activeFrame]}>
          <Text style={styles.frameNum}>{currentFrame}</Text>
          <Text style={styles.frameScore}>•</Text>
        </View>
      </ScrollView>

      {/* Pin deck */}
      <PinDeck
        knocked={currentKnocked}
        onToggle={togglePin}
        disabled={loading}
      />

      <Text style={styles.hint}>
        {ball === 1
          ? "Tap pins you knocked down on ball 1"
          : "Tap additional pins knocked on ball 2"}
      </Text>

      <TouchableOpacity
        style={[styles.btn, loading && styles.btnDisabled]}
        onPress={confirmBall}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>
            {ball === 1 && ball1Knocked.size === 10 ? "STRIKE!" : "Confirm"}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, alignItems: "center", gap: 24 },
  title: { fontSize: 22, fontWeight: "700", color: "#111827" },
  scorecard: { flexDirection: "row" },
  frameBox: {
    width: 48,
    height: 56,
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
    marginRight: 4,
  },
  activeFrame: { borderColor: "#2563eb", backgroundColor: "#eff6ff" },
  frameNum: { fontSize: 10, color: "#6b7280" },
  frameScore: { fontSize: 14, fontWeight: "700", color: "#111827" },
  hint: { color: "#6b7280", fontSize: 13, textAlign: "center" },
  btn: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
