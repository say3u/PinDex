import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, ActivityIndicator, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { lookupBall } from "../api/client";

const BAG_KEY = "pindex_ball_bag";

export interface BallSpec {
  name: string;
  brand: string;
  coverstock: string | null;
  core: string | null;
  rg: number | null;
  diff: number | null;
  finish: string | null;
  length: string;
  backend: string;
  hook: string;
  recommended_for: string;
  lane_condition: string;
}

interface Props {
  onBack: () => void;
}

const HOOK_COLORS: Record<string, string> = {
  "Low": "#22c55e",
  "Medium": "#eab308",
  "Medium-High": "#f97316",
  "High": "#ef4444",
  "Very High": "#7c3aed",
};

export async function loadBag(): Promise<BallSpec[]> {
  try {
    const raw = await AsyncStorage.getItem(BAG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (e) {
    console.warn("loadBag: failed to load ball bag", e);
    return [];
  }
}

async function saveBag(bag: BallSpec[]) {
  try {
    await AsyncStorage.setItem(BAG_KEY, JSON.stringify(bag));
  } catch (e) {
    Alert.alert("Save Error", "Could not save your ball bag. Check device storage.");
  }
}

export default function BallBagScreen({ onBack }: Props) {
  const insets = useSafeAreaInsets();
  const [bag, setBag] = useState<BallSpec[]>([]);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<BallSpec | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => { loadBag().then(setBag); }, []);

  async function search() {
    if (!query.trim()) return;
    setSearching(true);
    setResult(null);
    setNotFound(false);
    try {
      const data = await lookupBall(query.trim());
      if (data.found === false) {
        setNotFound(true);
      } else {
        setResult(data);
      }
    } catch {
      Alert.alert("Error", "Could not reach server.");
    } finally {
      setSearching(false);
    }
  }

  async function addToBag(ball: BallSpec) {
    if (bag.length >= 6) {
      Alert.alert("Bag full", "Max 6 balls in your bag.");
      return;
    }
    if (bag.find((b) => b.name === ball.name)) {
      Alert.alert("Already in bag", `${ball.name} is already in your bag.`);
      return;
    }
    const next = [...bag, ball];
    setBag(next);
    await saveBag(next);
    setResult(null);
    setQuery("");
  }

  async function removeFromBag(name: string) {
    Alert.alert("Remove ball", `Remove ${name} from your bag?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove", style: "destructive", onPress: async () => {
          const next = bag.filter((b) => b.name !== name);
          setBag(next);
          await saveBag(next);
        }
      },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + 12 }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Ball Bag</Text>
        <Text style={styles.bagCount}>{bag.length}/6</Text>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search any ball (e.g. Phaze II)"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={search}
          placeholderTextColor="#9ca3af"
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={search} disabled={searching}>
          {searching ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.searchBtnText}>Find</Text>}
        </TouchableOpacity>
      </View>

      {notFound && (
        <Text style={styles.notFound}>Ball not found. Try the full name (e.g. "Storm Phaze II")</Text>
      )}

      {/* Search result */}
      {result && (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.resultName}>{result.name}</Text>
              <Text style={styles.resultBrand}>{result.brand}</Text>
            </View>
            <View style={[styles.hookBadge, { backgroundColor: HOOK_COLORS[result.hook] ?? "#6b7280" }]}>
              <Text style={styles.hookBadgeText}>{result.hook}</Text>
            </View>
          </View>

          <View style={styles.specGrid}>
            <SpecItem label="RG" value={result.rg?.toFixed(2)} />
            <SpecItem label="Diff" value={result.diff?.toFixed(3)} />
            <SpecItem label="Length" value={result.length} />
            <SpecItem label="Backend" value={result.backend} />
            <SpecItem label="Coverstock" value={result.coverstock} />
            <SpecItem label="Core" value={result.core} />
            <SpecItem label="Finish" value={result.finish} />
            <SpecItem label="Lane" value={result.lane_condition} />
          </View>

          <Text style={styles.recommended}>{result.recommended_for}</Text>

          <Text style={styles.disclaimer}>
            * RG/Diff shown as N/A when not verified. Descriptive specs (hook, length) are AI estimates.
          </Text>

          <TouchableOpacity style={styles.addBtn} onPress={() => addToBag(result!)}>
            <Text style={styles.addBtnText}>+ Add to Bag</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bag */}
      {bag.length === 0 ? (
        <Text style={styles.emptyBag}>Your bag is empty. Search for a ball to add it.</Text>
      ) : (
        <View style={styles.bagList}>
          <Text style={styles.sectionLabel}>In Your Bag</Text>
          {bag.map((ball) => (
            <TouchableOpacity
              key={ball.name}
              style={styles.bagCard}
              onPress={() => setExpanded(expanded === ball.name ? null : ball.name)}
              onLongPress={() => removeFromBag(ball.name)}
              activeOpacity={0.8}
            >
              <View style={styles.bagCardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bagBallName}>{ball.name}</Text>
                  <Text style={styles.bagBallSub}>{ball.brand} · {ball.length} · {ball.hook} hook</Text>
                </View>
                <View style={[styles.hookBadgeSmall, { backgroundColor: HOOK_COLORS[ball.hook] ?? "#6b7280" }]}>
                  <Text style={styles.hookBadgeSmallText}>{ball.hook}</Text>
                </View>
              </View>

              {expanded === ball.name && (
                <View style={styles.expandedSpecs}>
                  <View style={styles.specGrid}>
                    <SpecItem label="RG" value={ball.rg?.toFixed(2)} />
                    <SpecItem label="Diff" value={ball.diff?.toFixed(3)} />
                    <SpecItem label="Coverstock" value={ball.coverstock} />
                    <SpecItem label="Core" value={ball.core} />
                    <SpecItem label="Finish" value={ball.finish} />
                    <SpecItem label="Lane" value={ball.lane_condition} />
                  </View>
                  <Text style={styles.recommended}>{ball.recommended_for}</Text>
                  <Text style={styles.removeHint}>Long press to remove</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function SpecItem({ label, value }: { label: string; value?: string | number }) {
  return (
    <View style={styles.specItem}>
      <Text style={styles.specLabel}>{label}</Text>
      <Text style={styles.specValue}>{value ?? "—"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#f9fafb", gap: 14 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { padding: 4 },
  backText: { color: "#1e3a8a", fontWeight: "600", fontSize: 15 },
  title: { fontSize: 20, fontWeight: "900", color: "#111827" },
  bagCount: { fontSize: 14, color: "#6b7280", fontWeight: "600" },
  searchRow: { flexDirection: "row", gap: 8 },
  searchInput: {
    flex: 1, backgroundColor: "#fff", borderRadius: 12, padding: 12,
    fontSize: 15, borderWidth: 1, borderColor: "#e5e7eb", color: "#111827",
  },
  searchBtn: {
    backgroundColor: "#1e3a8a", borderRadius: 12,
    paddingHorizontal: 16, justifyContent: "center",
  },
  searchBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  notFound: { color: "#ef4444", fontSize: 13, textAlign: "center" },
  resultCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: "#e5e7eb", gap: 12,
  },
  resultHeader: { flexDirection: "row", alignItems: "flex-start" },
  resultName: { fontSize: 17, fontWeight: "800", color: "#111827" },
  resultBrand: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  hookBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  hookBadgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  hookBadgeSmall: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  hookBadgeSmallText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  specGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  specItem: {
    backgroundColor: "#f9fafb", borderRadius: 8, padding: 8,
    minWidth: "45%", flex: 1,
  },
  specLabel: { fontSize: 10, color: "#9ca3af", textTransform: "uppercase", fontWeight: "600" },
  specValue: { fontSize: 13, color: "#111827", fontWeight: "700", marginTop: 2 },
  recommended: { fontSize: 13, color: "#374151", fontStyle: "italic", lineHeight: 18 },
  disclaimer: { fontSize: 11, color: "#9ca3af", lineHeight: 16 },
  addBtn: {
    backgroundColor: "#1e3a8a", borderRadius: 12,
    padding: 12, alignItems: "center",
  },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  emptyBag: { textAlign: "center", color: "#9ca3af", fontSize: 14, marginTop: 24 },
  bagList: { gap: 8 },
  sectionLabel: { fontSize: 12, fontWeight: "700", color: "#6b7280", textTransform: "uppercase" },
  bagCard: {
    backgroundColor: "#fff", borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: "#e5e7eb",
  },
  bagCardHeader: { flexDirection: "row", alignItems: "center" },
  bagBallName: { fontSize: 15, fontWeight: "800", color: "#111827" },
  bagBallSub: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  expandedSpecs: { marginTop: 12, gap: 8 },
  removeHint: { fontSize: 11, color: "#9ca3af", textAlign: "center" },
});
