import { useState } from "react";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useQuery } from "@tanstack/react-query";

import { vaultLoreTheme } from "@vaultlore/ui";
import type { CollectionItem } from "@vaultlore/api-client";

import { apiClient } from "../lib/api";
import { useAuthStore } from "../lib/auth-store";

type SortKey = "recent" | "value" | "graded";
type FilterKey = "all" | "raw" | "graded";

const SORT_OPTIONS: Array<{ key: SortKey; label: string }> = [
  { key: "recent", label: "Recent" },
  { key: "value", label: "Value" },
  { key: "graded", label: "Graded" }
];

const FILTER_OPTIONS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "All" },
  { key: "raw", label: "Raw" },
  { key: "graded", label: "Graded" }
];

function CollectionCard({ item, onPress }: { item: CollectionItem; onPress: () => void }) {
  const isGraded = item.condition === "graded";
  const priceNum = item.purchasePrice ? parseFloat(item.purchasePrice) : null;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.65 }]}
      onPress={onPress}
    >
      <View style={styles.cardLeft}>
        <View style={styles.cardImgSlot}>
          <Text style={styles.cardGlyph}>{isGraded ? "★" : "◈"}</Text>
        </View>
      </View>
      <View style={styles.cardRight}>
        <Text style={styles.cardId} numberOfLines={1}>
          {item.cardId.slice(0, 8).toUpperCase()}
        </Text>
        <View style={styles.cardMetaRow}>
          <View style={[styles.condBadge, isGraded && styles.condBadgeGraded]}>
            <Text style={[styles.condBadgeText, isGraded && styles.condBadgeTextGraded]}>
              {isGraded && item.gradeCompany ? `${item.gradeCompany} ${item.gradeValue}` : "Raw"}
            </Text>
          </View>
          {item.quantity > 1 && (
            <Text style={styles.qtyText}>×{item.quantity}</Text>
          )}
          {item.favorite && <Text style={styles.favoriteStar}>★</Text>}
        </View>
        {priceNum != null ? (
          <Text style={styles.cardPrice}>${priceNum.toLocaleString()}</Text>
        ) : null}
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

function sortItems(items: CollectionItem[], sort: SortKey): CollectionItem[] {
  const copy = [...items];
  if (sort === "value") {
    return copy.sort((a, b) => {
      const av = a.purchasePrice ? parseFloat(a.purchasePrice) : 0;
      const bv = b.purchasePrice ? parseFloat(b.purchasePrice) : 0;
      return bv - av;
    });
  }
  if (sort === "graded") {
    return copy.sort((a) => (a.condition === "graded" ? -1 : 1));
  }
  return copy;
}

export default function CollectionScreen() {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [sort, setSort] = useState<SortKey>("recent");
  const [filter, setFilter] = useState<FilterKey>("all");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["collection", accessToken],
    queryFn: () => apiClient.getCollection(),
    enabled: Boolean(accessToken)
  });

  const rawItems = data?.items ?? [];
  const filteredItems = filter === "all" ? rawItems : rawItems.filter((i) => i.condition === filter);
  const sortedItems = sortItems(filteredItems, sort);
  const totalValue = data?.totalValue ?? 0;

  if (!accessToken) {
    return (
      <LinearGradient colors={["#07090d", "#111624", "#261d16"]} style={styles.gradient}>
        <SafeAreaView style={[styles.safeArea, styles.center]}>
          <View style={styles.authGate}>
            <Text style={styles.authGateGlyph}>◈</Text>
            <Text style={styles.authGateTitle}>Sign in to see your vault</Text>
            <Text style={styles.authGateCaption}>
              Your collection, value estimates, and ownership history live here.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.signInBtn, pressed && { opacity: 0.75 }]}
              onPress={() => router.push("/sign-in")}
            >
              <Text style={styles.signInBtnText}>Sign in</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#07090d", "#111624", "#261d16"]} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerBadge}>Collection</Text>
            <Text style={styles.headerValue}>${totalValue.toLocaleString()}</Text>
            <Text style={styles.headerSub}>
              {rawItems.length} {rawItems.length === 1 ? "card" : "cards"} · {data?.gainLossEstimate ?? "—"}
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.scanFab, pressed && { opacity: 0.7 }]}
            onPress={() => router.push("/scan")}
          >
            <Text style={styles.scanFabText}>+ Scan</Text>
          </Pressable>
        </View>

        {/* Sort / filter bar */}
        <View style={styles.controlBar}>
          <View style={styles.controlGroup}>
            {SORT_OPTIONS.map((opt) => (
              <Pressable
                key={opt.key}
                style={[styles.controlChip, sort === opt.key && styles.controlChipActive]}
                onPress={() => setSort(opt.key)}
              >
                <Text style={[styles.controlChipText, sort === opt.key && styles.controlChipTextActive]}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.controlGroup}>
            {FILTER_OPTIONS.map((opt) => (
              <Pressable
                key={opt.key}
                style={[styles.controlChip, filter === opt.key && styles.controlChipActive]}
                onPress={() => setFilter(opt.key)}
              >
                <Text style={[styles.controlChipText, filter === opt.key && styles.controlChipTextActive]}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {isLoading && <ActivityIndicator color={vaultLoreTheme.colors.accentGold} style={styles.loader} />}

        {isError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>Could not load your collection.</Text>
          </View>
        )}

        {!isLoading && sortedItems.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyGlyph}>◈</Text>
            <Text style={styles.emptyTitle}>Your vault is empty</Text>
            <Text style={styles.emptyCaption}>
              Scan a card or search the catalog to start building your collection.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.scanBtn, pressed && { opacity: 0.75 }]}
              onPress={() => router.push("/scan")}
            >
              <Text style={styles.scanBtnText}>Scan your first card</Text>
            </Pressable>
          </View>
        )}

        {sortedItems.length > 0 && (
          <FlatList
            data={sortedItems}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({ item }) => (
              <CollectionCard
                item={item}
                onPress={() => router.push(`/collection/${item.id}` as never)}
              />
            )}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  center: { justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    padding: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: vaultLoreTheme.colors.border
  },
  headerLeft: { gap: 2 },
  headerBadge: {
    color: vaultLoreTheme.colors.accentGold,
    textTransform: "uppercase",
    letterSpacing: 2,
    fontSize: 11,
    fontWeight: "700"
  },
  headerValue: {
    color: vaultLoreTheme.colors.textPrimary,
    fontSize: 32,
    fontWeight: "800"
  },
  headerSub: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 13
  },
  scanFab: {
    backgroundColor: vaultLoreTheme.colors.accentGold,
    borderRadius: vaultLoreTheme.radii.pill,
    paddingVertical: 10,
    paddingHorizontal: 18
  },
  scanFabText: { color: "#111", fontWeight: "800", fontSize: 13 },
  controlBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: vaultLoreTheme.colors.border
  },
  controlGroup: { flexDirection: "row", gap: 6 },
  controlChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: vaultLoreTheme.radii.pill,
    borderWidth: 1,
    borderColor: vaultLoreTheme.colors.border,
    backgroundColor: "rgba(255,255,255,0.03)"
  },
  controlChipActive: {
    backgroundColor: "rgba(214,170,82,0.15)",
    borderColor: vaultLoreTheme.colors.accentGold
  },
  controlChipText: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: "600"
  },
  controlChipTextActive: { color: vaultLoreTheme.colors.accentGold },
  loader: { marginTop: 32 },
  errorBox: {
    margin: 20,
    padding: 14,
    backgroundColor: "rgba(143,48,66,0.12)",
    borderWidth: 1,
    borderColor: vaultLoreTheme.colors.accentCrimson,
    borderRadius: vaultLoreTheme.radii.md
  },
  errorText: { color: "#f4a0b0", fontSize: 14 },
  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },
  separator: {
    height: 1,
    backgroundColor: vaultLoreTheme.colors.border,
    marginVertical: 1
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12
  },
  cardLeft: {},
  cardImgSlot: {
    width: 48,
    height: 66,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: vaultLoreTheme.colors.border,
    alignItems: "center",
    justifyContent: "center"
  },
  cardGlyph: { color: vaultLoreTheme.colors.accentGold, fontSize: 18, opacity: 0.5 },
  cardRight: { flex: 1, gap: 4 },
  cardId: {
    color: vaultLoreTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
    fontFamily: "monospace"
  },
  cardMetaRow: { flexDirection: "row", gap: 6, alignItems: "center" },
  condBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: vaultLoreTheme.radii.pill,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: vaultLoreTheme.colors.border
  },
  condBadgeGraded: {
    backgroundColor: "rgba(214,170,82,0.12)",
    borderColor: vaultLoreTheme.colors.accentGold
  },
  condBadgeText: { color: vaultLoreTheme.colors.textSecondary, fontSize: 11, fontWeight: "700" },
  condBadgeTextGraded: { color: vaultLoreTheme.colors.accentGold },
  qtyText: { color: vaultLoreTheme.colors.textSecondary, fontSize: 13 },
  favoriteStar: { color: vaultLoreTheme.colors.accentGold, fontSize: 13 },
  cardPrice: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 13
  },
  chevron: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 20,
    paddingRight: 4
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 10,
    paddingBottom: 60
  },
  emptyGlyph: {
    color: vaultLoreTheme.colors.accentGold,
    fontSize: 52,
    opacity: 0.25
  },
  emptyTitle: {
    color: vaultLoreTheme.colors.textPrimary,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center"
  },
  emptyCaption: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center"
  },
  scanBtn: {
    marginTop: 8,
    backgroundColor: vaultLoreTheme.colors.accentGold,
    borderRadius: vaultLoreTheme.radii.pill,
    paddingVertical: 13,
    paddingHorizontal: 28
  },
  scanBtnText: { color: "#111", fontWeight: "800", fontSize: 14 },
  authGate: {
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 40
  },
  authGateGlyph: { color: vaultLoreTheme.colors.accentGold, fontSize: 52, opacity: 0.3 },
  authGateTitle: {
    color: vaultLoreTheme.colors.textPrimary,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center"
  },
  authGateCaption: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center"
  },
  signInBtn: {
    marginTop: 8,
    backgroundColor: vaultLoreTheme.colors.accentGold,
    borderRadius: vaultLoreTheme.radii.pill,
    paddingVertical: 13,
    paddingHorizontal: 32
  },
  signInBtnText: { color: "#111", fontWeight: "800", fontSize: 15 }
});

