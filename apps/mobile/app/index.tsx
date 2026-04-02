import { Link, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";

import { vaultLoreTheme } from "@vaultlore/ui";

import { homeSections } from "../lib/screen-data";
import { apiClient } from "../lib/api";
import { useAuthStore } from "../lib/auth-store";

const NAV_ITEMS = [
  { href: "/scan", label: "Scan Card" },
  { href: "/browse", label: "Browse" },
  { href: "/search", label: "Search" },
  { href: "/market", label: "Market Hub" },
  { href: "/collection", label: "Collection" },
  { href: "/watchlist", label: "Watchlist" },
  { href: "/grading-assistant", label: "Grading" },
  { href: "/premium", label: "Premium" },
] as const;

export default function HomeScreen() {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const hydrated = useAuthStore((state) => state.hydrated);

  const meQuery = useQuery({
    queryKey: ["me", accessToken],
    queryFn: () => apiClient.getMe(),
    enabled: Boolean(accessToken)
  });

  const marketQuery = useQuery({
    queryKey: ["market-home"],
    queryFn: () => apiClient.getMarketHome()
  });

  const collectionQuery = useQuery({
    queryKey: ["collection", accessToken],
    queryFn: () => apiClient.getCollection(),
    enabled: Boolean(accessToken)
  });

  const dynamicSections = [
    {
      eyebrow: "Collector",
      title: meQuery.data ? meQuery.data.email : accessToken ? "Loading profile" : "Guest mode",
      caption: accessToken
        ? meQuery.data
          ? `Plan: ${meQuery.data.plan}`
          : "Fetching your account profile..."
        : "Sign in to unlock your personal dashboard"
    },
    {
      eyebrow: "Collection Value",
      title: collectionQuery.data ? `$${collectionQuery.data.totalValue.toLocaleString()}` : "$0",
      caption: collectionQuery.data
        ? `${collectionQuery.data.items.length} tracked cards`
        : accessToken
          ? "Loading your collection vault..."
          : "No collection data while signed out"
    },
    {
      eyebrow: "Market Pulse",
      title:
        marketQuery.data?.topMovers.length
          ? marketQuery.data.topMovers[0].title
          : "Gathering movers",
      caption:
        marketQuery.data?.topMovers.length
          ? `${marketQuery.data.topMovers[0].deltaPercent.toFixed(1)}% momentum`
          : "Fetching live market movement"
    }
  ];

  return (
    <LinearGradient colors={["#07090d", "#111624", "#261d16"]} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.heroPanel}>
            <Text style={styles.eyebrow}>The Collector's Command Center</Text>
            <Text style={styles.title}>Scan the card. Unlock the lore.</Text>
            <Text style={styles.subtitle}>
              Mobile-first premium intelligence for sports, TCG, Marvel, entertainment, and every
              future category worth collecting.
            </Text>
          </View>
          <View style={styles.metricsGrid}>
            {[...homeSections, ...dynamicSections].map((section) => (
              <View key={section.eyebrow} style={styles.metricCard}>
                <Text style={styles.metricEyebrow}>{section.eyebrow}</Text>
                <Text style={styles.metricTitle}>{section.title}</Text>
                <Text style={styles.metricCaption}>{section.caption}</Text>
              </View>
            ))}
          </View>
          {!hydrated ? <Text style={styles.status}>Restoring session...</Text> : null}
          {meQuery.error ? <Text style={styles.status}>Profile unavailable until you sign in again.</Text> : null}
          {marketQuery.error ? <Text style={styles.status}>Market feed is unavailable.</Text> : null}
          <View style={styles.navSection}>
            <Text style={styles.navSectionTitle}>Navigate</Text>
            <View style={styles.navGrid}>
              {NAV_ITEMS.map((item) => (
                <Pressable
                  key={item.href}
                  style={({ pressed }) => [styles.navCard, pressed && { opacity: 0.6 }]}
                  onPress={() => router.push(item.href as never)}
                >
                  <Text style={[styles.navCardText, item.href === "/scan" && styles.navCardTextAccent]}>
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  content: { padding: 20, gap: 18 },
  heroPanel: {
    borderRadius: 30,
    borderWidth: 1,
    borderColor: vaultLoreTheme.colors.border,
    padding: 22,
    backgroundColor: "rgba(12, 16, 23, 0.8)",
    gap: 12
  },
  eyebrow: {
    color: vaultLoreTheme.colors.accentGold,
    textTransform: "uppercase",
    letterSpacing: 2,
    fontSize: 12,
    fontWeight: "700"
  },
  title: {
    color: vaultLoreTheme.colors.textPrimary,
    fontSize: 36,
    lineHeight: 40,
    fontWeight: "800"
  },
  subtitle: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 15,
    lineHeight: 22
  },
  metricsGrid: { gap: 12 },
  metricCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: vaultLoreTheme.colors.border,
    borderRadius: 22,
    padding: 18,
    gap: 6
  },
  metricEyebrow: {
    color: vaultLoreTheme.colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontSize: 12
  },
  metricTitle: {
    color: vaultLoreTheme.colors.textPrimary,
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 30
  },
  metricCaption: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20
  },
  navSection: {
    gap: 14
  },
  navSectionTitle: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 2
  },
  navGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  navCard: {
    width: "47.5%",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: vaultLoreTheme.colors.border,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  navCardText: {
    color: vaultLoreTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.3
  },
  navCardTextAccent: {
    color: vaultLoreTheme.colors.accentGold
  },
  status: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 13
  }
});
