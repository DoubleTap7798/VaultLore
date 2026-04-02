import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useQuery } from "@tanstack/react-query";

import { vaultLoreTheme } from "@vaultlore/ui";

import { apiClient } from "../lib/api";

const CATEGORY_ICONS: Record<string, string> = {
  baseball: "⚾",
  basketball: "🏀",
  football: "🏈",
  pokemon: "⚡",
  marvel: "★",
  entertainment: "🎬",
  hockey: "🏒",
  soccer: "⚽"
};

const TREND_COLOR: Record<string, string> = {
  up: vaultLoreTheme.colors.accentEmerald,
  down: "#f17a8d",
  flat: vaultLoreTheme.colors.textSecondary
};

const TREND_LABEL: Record<string, string> = {
  up: "↑ Rising",
  down: "↓ Falling",
  flat: "→ Steady"
};

export default function BrowseScreen() {
  const router = useRouter();

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiClient.getCategories()
  });

  const marketQuery = useQuery({
    queryKey: ["market-home"],
    queryFn: () => apiClient.getMarketHome()
  });

  const categories = categoriesQuery.data ?? [];
  const topMovers = marketQuery.data?.topMovers ?? [];
  const categoryTrends = marketQuery.data?.categories ?? [];

  const trendFor = (slug: string) =>
    categoryTrends.find((ct) => ct.category === slug);

  return (
    <LinearGradient colors={["#07090d", "#111624", "#261d16"]} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.hero}>
            <Text style={styles.badge}>Browse</Text>
            <Text style={styles.title}>Category hubs</Text>
            <Text style={styles.subtitle}>
              High-signal surfaces for every collecting category. Tap to explore cards, sets, and grails.
            </Text>
          </View>

          {/* Top movers strip */}
          {topMovers.length > 0 && (
            <View style={styles.moversPanel}>
              <Text style={styles.panelLabel}>Top movers today</Text>
              {topMovers.map((mover) => (
                <Pressable
                  key={mover.id}
                  style={({ pressed }) => [styles.moverRow, pressed && { opacity: 0.6 }]}
                  onPress={() => router.push(`/card/${mover.id}` as never)}
                >
                  <Text style={styles.moverTitle} numberOfLines={1}>{mover.title}</Text>
                  <Text style={[styles.moverDelta, { color: vaultLoreTheme.colors.accentEmerald }]}>
                    +{mover.deltaPercent.toFixed(1)}%
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Category grid */}
          {categoriesQuery.isLoading ? (
            <ActivityIndicator color={vaultLoreTheme.colors.accentGold} style={styles.loader} />
          ) : (
            <View style={styles.grid}>
              {categories.map((cat) => {
                const trend = trendFor(cat.slug);
                const icon = CATEGORY_ICONS[cat.slug] ?? "◈";
                const trendColor = trend ? TREND_COLOR[trend.trend] : vaultLoreTheme.colors.textSecondary;
                const trendText = trend ? TREND_LABEL[trend.trend] : null;

                return (
                  <Pressable
                    key={cat.slug}
                    style={({ pressed }) => [styles.catCard, pressed && { opacity: 0.7 }]}
                    onPress={() => router.push(`/search?category=${cat.slug}` as never)}
                  >
                    <View style={styles.catHeader}>
                      <Text style={styles.catIcon}>{icon}</Text>
                      {trendText ? (
                        <Text style={[styles.trendBadge, { color: trendColor }]}>{trendText}</Text>
                      ) : null}
                    </View>
                    <Text style={styles.catLabel}>{cat.label}</Text>
                    <Text style={styles.catPulse} numberOfLines={2}>{cat.pulse}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {categoriesQuery.isError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>Could not load categories. Check your connection.</Text>
            </View>
          )}

          <Pressable
            style={({ pressed }) => [styles.searchBar, pressed && { opacity: 0.7 }]}
            onPress={() => router.push("/search" as never)}
          >
            <Text style={styles.searchBarText}>Search across all cards…</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  content: { padding: 20, gap: 20, paddingBottom: 40 },
  hero: { gap: 8, paddingTop: 12 },
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
  subtitle: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 15,
    lineHeight: 22
  },
  moversPanel: {
    backgroundColor: "rgba(18,21,29,0.84)",
    borderWidth: 1,
    borderColor: vaultLoreTheme.colors.border,
    borderRadius: vaultLoreTheme.radii.lg,
    padding: 16,
    gap: 10
  },
  panelLabel: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 2
  },
  moverRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: vaultLoreTheme.colors.border
  },
  moverTitle: {
    color: vaultLoreTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
    marginRight: 8
  },
  moverDelta: {
    fontSize: 14,
    fontWeight: "800"
  },
  loader: { marginTop: 24 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  catCard: {
    width: "47%",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: vaultLoreTheme.colors.border,
    borderRadius: vaultLoreTheme.radii.lg,
    padding: 16,
    gap: 6
  },
  catHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4
  },
  catIcon: { fontSize: 28 },
  trendBadge: { fontSize: 11, fontWeight: "700" },
  catLabel: {
    color: vaultLoreTheme.colors.textPrimary,
    fontSize: 16,
    fontWeight: "800"
  },
  catPulse: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17
  },
  errorBox: {
    backgroundColor: "rgba(143, 48, 66, 0.14)",
    borderWidth: 1,
    borderColor: vaultLoreTheme.colors.accentCrimson,
    borderRadius: vaultLoreTheme.radii.md,
    padding: 14
  },
  errorText: { color: "#f4a0b0", fontSize: 14, lineHeight: 20 },
  searchBar: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: vaultLoreTheme.colors.border,
    borderRadius: vaultLoreTheme.radii.pill,
    paddingVertical: 14,
    paddingHorizontal: 20
  },
  searchBarText: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 15
  }
});

