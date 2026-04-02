import { useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { useQuery } from "@tanstack/react-query";

import { vaultLoreTheme } from "@vaultlore/ui";
import type { CardSearchResult } from "@vaultlore/api-client";

import { apiClient } from "../lib/api";

const CATEGORY_FILTERS = [
  { slug: "", label: "All" },
  { slug: "basketball", label: "Basketball" },
  { slug: "baseball", label: "Baseball" },
  { slug: "football", label: "Football" },
  { slug: "pokemon", label: "Pokémon" },
  { slug: "marvel", label: "Marvel" },
  { slug: "tcg", label: "TCG" },
  { slug: "entertainment", label: "Entertainment" }
];

const TIER_COLOR: Record<string, string> = {
  iconic: "#d6aa52",
  legendary: "#c0a0e0",
  "super-rare": "#7ab8ed",
  rare: "#74c994",
  uncommon: vaultLoreTheme.colors.textSecondary,
  common: vaultLoreTheme.colors.textSecondary
};

function ResultCard({ item, onPress }: { item: CardSearchResult; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.resultCard, pressed && { opacity: 0.65 }]}
      onPress={onPress}
    >
      <View style={styles.resultLeft}>
        <View style={styles.resultImagePlaceholder}>
          <Text style={styles.resultImageGlyph}>◈</Text>
        </View>
      </View>
      <View style={styles.resultRight}>
        <View style={styles.resultTitleRow}>
          <Text style={styles.resultTitle} numberOfLines={2}>{item.title}</Text>
          {item.collectorTier ? (
            <Text style={[styles.tierBadge, { color: TIER_COLOR[item.collectorTier] ?? vaultLoreTheme.colors.textSecondary }]}>
              {item.collectorTier}
            </Text>
          ) : null}
        </View>
        <Text style={styles.resultSubject}>{item.subjectName}</Text>
        <View style={styles.resultMeta}>
          <Text style={styles.metaPill}>{item.category}</Text>
          {item.setName ? <Text style={styles.metaText}>{item.setName}</Text> : null}
          {item.year ? <Text style={styles.metaText}>{item.year}</Text> : null}
        </View>
        {item.rarity ? (
          <Text style={styles.resultRarity}>{item.rarity}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(params.category ?? "");
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 420);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ["search", debouncedQuery, activeCategory],
    queryFn: () => apiClient.searchCards(debouncedQuery, activeCategory || undefined),
    enabled: debouncedQuery.trim().length >= 2
  });

  const results = data ?? [];
  const showEmpty = debouncedQuery.length >= 2 && !isLoading && !isFetching && results.length === 0;
  const showIdle = debouncedQuery.length < 2 && !isLoading;

  return (
    <LinearGradient colors={["#07090d", "#111624", "#261d16"]} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.searchRow}>
            <View style={styles.searchInputWrap}>
              <Text style={styles.searchIcon}>⌕</Text>
              <TextInput
                ref={inputRef}
                autoFocus
                autoCapitalize="none"
                placeholder="Card, subject, set, or keyword…"
                placeholderTextColor={vaultLoreTheme.colors.textSecondary}
                returnKeyType="search"
                style={styles.searchInput}
                value={query}
                onChangeText={setQuery}
              />
              {query.length > 0 && (
                <Pressable onPress={() => { setQuery(""); setDebouncedQuery(""); }}>
                  <Text style={styles.clearBtn}>✕</Text>
                </Pressable>
              )}
            </View>
            <Pressable onPress={() => router.back()} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>

          {/* Category filters */}
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={CATEGORY_FILTERS}
            keyExtractor={(item) => item.slug}
            contentContainerStyle={styles.filterRow}
            renderItem={({ item }) => {
              const active = activeCategory === item.slug;
              return (
                <Pressable
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => setActiveCategory(item.slug)}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            }}
          />
        </View>

        {(isLoading || isFetching) && (
          <ActivityIndicator color={vaultLoreTheme.colors.accentGold} style={styles.loader} />
        )}

        {showIdle && (
          <View style={styles.idleState}>
            <Text style={styles.idleGlyph}>◈</Text>
            <Text style={styles.idleTitle}>Search the vault</Text>
            <Text style={styles.idleCaption}>
              Search by card name, player, character, set, or year across all categories.
            </Text>
          </View>
        )}

        {showEmpty && (
          <View style={styles.idleState}>
            <Text style={styles.idleGlyph}>○</Text>
            <Text style={styles.idleTitle}>No matching cards</Text>
            <Text style={styles.idleCaption}>
              Try a different keyword, adjust the category filter, or browse trending cards.
            </Text>
          </View>
        )}

        {isError && (
          <View style={styles.idleState}>
            <Text style={styles.idleCaption}>Search is temporarily unavailable. Try again shortly.</Text>
          </View>
        )}

        {results.length > 0 && (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.resultsList}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({ item }) => (
              <ResultCard
                item={item}
                onPress={() => router.push(`/card/${item.id}` as never)}
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
  header: {
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: vaultLoreTheme.colors.border
  },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  searchInputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: vaultLoreTheme.colors.border,
    borderRadius: vaultLoreTheme.radii.pill,
    paddingHorizontal: 14,
    gap: 8
  },
  searchIcon: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 18
  },
  searchInput: {
    flex: 1,
    color: vaultLoreTheme.colors.textPrimary,
    fontSize: 15,
    paddingVertical: 11
  },
  clearBtn: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 14,
    paddingHorizontal: 4
  },
  cancelBtn: { paddingVertical: 8, paddingHorizontal: 4 },
  cancelText: {
    color: vaultLoreTheme.colors.accentGold,
    fontSize: 14,
    fontWeight: "600"
  },
  filterRow: { gap: 8, paddingVertical: 4 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: vaultLoreTheme.radii.pill,
    borderWidth: 1,
    borderColor: vaultLoreTheme.colors.border,
    backgroundColor: "rgba(255,255,255,0.03)"
  },
  filterChipActive: {
    backgroundColor: "rgba(214,170,82,0.15)",
    borderColor: vaultLoreTheme.colors.accentGold
  },
  filterChipText: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 13,
    fontWeight: "600"
  },
  filterChipTextActive: { color: vaultLoreTheme.colors.accentGold },
  loader: { marginTop: 32 },
  idleState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 10,
    paddingBottom: 60
  },
  idleGlyph: {
    color: vaultLoreTheme.colors.accentGold,
    fontSize: 42,
    opacity: 0.4
  },
  idleTitle: {
    color: vaultLoreTheme.colors.textPrimary,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center"
  },
  idleCaption: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center"
  },
  resultsList: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },
  separator: { height: 1, backgroundColor: vaultLoreTheme.colors.border, marginVertical: 2 },
  resultCard: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 12
  },
  resultLeft: { justifyContent: "flex-start", paddingTop: 2 },
  resultImagePlaceholder: {
    width: 52,
    height: 72,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: vaultLoreTheme.colors.border,
    alignItems: "center",
    justifyContent: "center"
  },
  resultImageGlyph: {
    color: vaultLoreTheme.colors.accentGold,
    fontSize: 20,
    opacity: 0.5
  },
  resultRight: { flex: 1, gap: 4 },
  resultTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6
  },
  resultTitle: {
    flex: 1,
    color: vaultLoreTheme.colors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20
  },
  tierBadge: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 2
  },
  resultSubject: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18
  },
  resultMeta: { flexDirection: "row", gap: 6, alignItems: "center", flexWrap: "wrap", marginTop: 2 },
  metaPill: {
    color: vaultLoreTheme.colors.accentGold,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  metaText: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 12
  },
  resultRarity: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 12,
    fontStyle: "italic"
  }
});

