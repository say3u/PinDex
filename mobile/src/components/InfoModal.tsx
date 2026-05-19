import React, { useState } from "react";
import {
  Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from "react-native";

interface Props {
  title: string;
  content: string;
}

export default function InfoButton({ title, content }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <TouchableOpacity onPress={() => setVisible(true)} style={styles.btn} hitSlop={12}>
        <Text style={styles.btnText}>i</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setVisible(false)}>
          <View style={styles.card}>
            <Text style={styles.title}>{title}</Text>
            <ScrollView>
              <Text style={styles.content}>{content}</Text>
            </ScrollView>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setVisible(false)}>
              <Text style={styles.closeBtnText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: "#e5e7eb",
    alignItems: "center", justifyContent: "center",
  },
  btnText: { fontSize: 11, fontWeight: "800", color: "#6b7280" },
  overlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center", justifyContent: "center", padding: 32,
  },
  card: {
    backgroundColor: "#fff", borderRadius: 20, padding: 24,
    width: "100%", maxHeight: "60%", gap: 12,
  },
  title: { fontSize: 16, fontWeight: "800", color: "#111827" },
  content: { fontSize: 14, color: "#374151", lineHeight: 22 },
  closeBtn: {
    backgroundColor: "#1e3a8a", borderRadius: 12,
    padding: 12, alignItems: "center", marginTop: 4,
  },
  closeBtnText: { color: "#fff", fontWeight: "700" },
});
