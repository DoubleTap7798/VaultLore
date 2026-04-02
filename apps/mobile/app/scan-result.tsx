import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useQuery } from "@tanstack/react-query";

import { vaultLoreTheme } from "@vaultlore/ui";
import type { CardIdentity } from "@vaultlore/shared";

import { apiClient } from "../lib/api";

function MatchCard({ card, onView, onAdd }: {
  card: CardIdentity;
  onView: () => void;
  onAdd: () => void;
}) {
  return (
    <View style={styles.matchCard}>
      <View style={styles.matchLeft}>
        <View style={styles.matchImageSlot}>
          <Text style={styles.matchGlyph}>◈</Text>
        </View>
      </View>
      <View style={styles.matchRight}>
        <Text style={styles.matchTitle}>{card.title}</Text>
        <Text style={styles.matchSubject}>{card.subjectName}</Text>
        <View style={styles.matchMeta}>
          <Text style={styles.matchCategory}>{card.category}</Text>
          {card.setName ? <Text style={styles.matchMetaText}>{card.setName}</Text> : null}
          {card.year ? <Text style={styles.matchMetaText}>{card.year}</Text> : null}
        </View>
        {card.rarity ? <Text style={styles.matchRarity}>{card.rarity}</Text> : null}
        <View style={styles.matchActions}>
          <Pressable
            style={({ pressed }) => [styles.matchBtn, pressed && { opacity: 0.7 }]}
            onPress={onView}
          >
            <Text style={styles.matchBtnText}>View card</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.matchBtnAdd, pressed && { opacity: 0.7 }]}
            onPress={onAdd}
          >
            <Text style={styles.matchBtnAddText}>+ Add</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function ScanResultScreen() {
  const router = useRouter();
  const { jobId } = useLocalSearchParams<{ jobId: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["scan-job", jobId],
    queryFn: () => apiClient.getScanJob(jobId ?? ""),
    enabled: Boolean(jobId)
  });

  const matches = (data?.matches ?? []) as CardIdentity[];
  const confidence = data?.confidence;

  return (
    <LinearGradient colors={["#07090d", "#111624", "#261d16"]} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.hero}>
            <Text style={styles.badge}>Scan result</Text>
            <Text style={styles.title}>
              {isLoading ? "Loading results…" : "Match found"}
            </Text>
            {confidence != null && (
              <View style={styles.confidenceRow}>
                <View style={[styles.confidenceFill, { width: `${Math.round(confidence * 100)}%` }]} />
                <Text style={styles.confidenceLabel}>
                  {Math.round(confidence * 100)}% confidence
                </Text>
              </View>
            )}
          </View>

          {isLoading && (
            <ActivityIndicator color={vaultLoreTheme.colors.accentGold} style={styles.loader} />
          )}

          {isError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>Could not load scan results. Check your connection.</Text>
              <Pressable style={styles.retryScan} onPress={() => router.replace("/scan")}>
                <Text style={styles.retryText}>Start a new scan</Text>
              </Pressable>
            </View>
          )}

          {!isLoading && matches.length === 0 && !isError && (
            <View style={styles.noMatchBox}>
              <Text style={styles.noMatchGlyph}>○</Text>
              <Text style={styles.noMatchTitle}>No matches identified</Text>
              <Text style={styles.noMatchCaption}>
                Try re-scanning with better lighting, or add a category hint to improve accuracy.
              </Text>
              <Pressable
                style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.7 }]}
                onPress={() => router.replace("/scan")}
              >
                <Text style={styles.retryBtnText}>Scan another card</Text>
              </Pressable>
            </View>
          )}

          {matches.length > 0 && (
            <View style={styles.matchList}>
              <Text style={styles.matchesLabel}>
                {matches.length} {matches.length === 1 ? "match" : "matches"} identified
              </Text>
              {matches.map((card) => (
                <MatchCard
                  key={card.id}
                  card={card}
                  onView={() => router.push(`/card/${card.id}` as never)}
                  onAdd={() => router.push(`/card/${card.id}` as never)}
                />
              ))}
            </View>
          )}

          {!isLoading && (
            <Pressable
              style={({ pressed }) => [styles.newScanBtn, pressed && { opacity: 0.7 }]}
              onPress={() => router.replace("/scan")}
            >
              <Text style={styles.newScanText}>Scan another card</Text>
            </Pressable>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  content: { padding: 20, gap: 20, paddingBottom: 48 },
  hero: { gap: 10, paddingTop: 12 },
  badge: {
    color: vaultLoreTheme.colors.accentGold,
    textTransform: "uppercase",
    letterSpacing: 2,
    fontSize: 12,
    fontWeight: "700"
  },
  title: {
    color: vaultLoreTheme.colors.textPrimary,
    fontSize: 34,
    fontWeight: "800",
    lineHeight: 40
  },
  confidenceRow: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 3,
    overflow: "hidden",
    marginTop: 4,
    position: "relative"
  },
  confidenceFill: {
    height: "100%",
    backgroundColor: vaultLoreTheme.colors.accentGold,
    borderRadius: 3
  },
  confidenceLabel: {
    color: vaultLoreTheme.colors.accentGold,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4
  },
  loader: { marginTop: 32 },
  errorBox: {
    backgroundColor: "rgba(143, 48, 66, 0.14)",
    borderWidth: 1,
    borderColor: vaultLoreTheme.colors.accentCrimson,
    borderRadius: vaultLoreTheme.radii.md,
    padding: 16,
    gap: 12,
    alignItems: "center"
  },
  errorText: { color: "#f4a0b0", fontSize: 14, lineHeight: 20, textAlign: "center" },
  retryScan: { paddingVertical: 6 },
  retryText: { color: vaultLoreTheme.colors.accentGold, fontWeight: "700", fontSize: 14 },
  noMatchBox: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 24,
    paddingHorizontal: 20
  },
  noMatchGlyph: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 42,
    opacity: 0.4
  },
  noMatchTitle: {
    color: vaultLoreTheme.colors.textPrimary,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center"
  },
  noMatchCaption: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center"
  },
  retryBtn: {
    marginTop: 8,
    backgroundColor: vaultLoreTheme.colors.accentGold,
    borderRadius: vaultLoreTheme.radii.pill,
    paddingVertical: 12,
    paddingHorizontal: 28
  },
  retryBtnText: { color: "#111", fontWeight: "800", fontSize: 14 },
  matchList: { gap: 12 },
  matchesLabel: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1
  },
  matchCard: {
    flexDirection: "row",
    gap: 14,
    backgroundColor: "rgba(18,21,29,0.84)",
    borderWidth: 1,
    borderColor: vaultLoreTheme.colors.border,
    borderRadius: vaultLoreTheme.radii.lg,
    padding: 14
  },
  matchLeft: { paddingTop: 2 },
  matchImageSlot: {
    width: 60,
    height: 84,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: vaultLoreTheme.colors.border,
    alignItems: "center",
    justifyContent: "center"
  },
  matchGlyph: {
    color: vaultLoreTheme.colors.accentGold,
    fontSize: 22,
    opacity: 0.5
  },
  matchRight: { flex: 1, gap: 4 },
  matchTitle: {
    color: vaultLoreTheme.colors.textPrimary,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 20
  },
  matchSubject: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 13
  },
  matchMeta: { flexDirection: "row", gap: 6, flexWrap: "wrap", alignItems: "center" },
  matchCategory: {
    color: vaultLoreTheme.colors.accentGold,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  matchMetaText: { color: vaultLoreTheme.colors.textSecondary, fontSize: 12 },
  matchRarity: { color: vaultLoreTheme.colors.textSecondary, fontSize: 12, fontStyle: "italic" },
  matchActions: { flexDirection: "row", gap: 8, marginTop: 6 },
  matchBtn: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: vaultLoreTheme.colors.border,
    borderRadius: vaultLoreTheme.radii.pill,
    paddingVertical: 8,
    alignItems: "center"
  },
  matchBtnText: {
    color: vaultLoreTheme.colors.textPrimary,
    fontSize: 13,
    fontWeight: "600"
  },
  matchBtnAdd: {
    backgroundColor: "rgba(214,170,82,0.15)",
    borderWidth: 1,
    borderColor: vaultLoreTheme.colors.accentGold,
    borderRadius: vaultLoreTheme.radii.pill,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center"
  },
  matchBtnAddText: {
    color: vaultLoreTheme.colors.accentGold,
    fontSize: 13,
    fontWeight: "700"
  },
  newScanBtn: {
    borderWidth: 1,
    borderColor: vaultLoreTheme.colors.border,
    borderRadius: vaultLoreTheme.radii.pill,
    paddingVertical: 14,
    alignItems: "center"
  },
  newScanText: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 14,
    fontWeight: "600"
  }
});

