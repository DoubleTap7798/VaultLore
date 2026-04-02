import { useState } from "react";
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

import { vaultLoreTheme } from "@vaultlore/ui";

import {
  OFFERINGS,
  purchasePlan,
  restorePurchases,
  type PurchaseOffering
} from "../lib/purchases-service";
import { useAuthStore } from "../lib/auth-store";

const FREE_FEATURES = [
  "10 card scans per month",
  "Basic collection tracking",
  "Public market data",
  "Search catalog"
];

function PlanCard({
  offering,
  selected,
  onSelect
}: {
  offering: PurchaseOffering;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Pressable
      style={[styles.planCard, selected && styles.planCardSelected, offering.isPopular && styles.planCardPopular]}
      onPress={onSelect}
    >
      {offering.isPopular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularBadgeText}>Most popular</Text>
        </View>
      )}
      <View style={styles.planHeader}>
        <View style={styles.planHeaderLeft}>
          <Text style={styles.planLabel}>{offering.label}</Text>
          <View style={styles.planPriceRow}>
            <Text style={styles.planPrice}>{offering.price}</Text>
            <Text style={styles.planPeriod}>{offering.period}</Text>
          </View>
        </View>
        <View style={[styles.planSelectDot, selected && styles.planSelectDotActive]}>
          {selected ? <Text style={styles.planSelectCheck}>✓</Text> : null}
        </View>
      </View>
      <View style={styles.planFeatures}>
        {offering.features.map((f) => (
          <View key={f} style={styles.featureRow}>
            <Text style={styles.featureTick}>◈</Text>
            <Text style={styles.featureText}>{f}</Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

export default function PremiumScreen() {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [selectedId, setSelectedId] = useState<string>(OFFERINGS[0]?.id ?? "");
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  const handlePurchase = async () => {
    if (!accessToken) { router.push("/sign-in"); return; }
    setPurchasing(true);
    setMessage(null);
    const result = await purchasePlan(selectedId);
    setPurchasing(false);
    if (result.success) {
      setMessage({ type: "success", text: "Purchase successful! Welcome to the vault." });
    } else if (result.cancelled) {
      setMessage({ type: "info", text: "Purchase cancelled." });
    } else {
      setMessage({ type: "error", text: result.error ?? "Purchase failed. Try again." });
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    setMessage(null);
    const result = await restorePurchases();
    setRestoring(false);
    if (result.success) {
      setMessage({ type: "success", text: `Purchases restored — plan: ${result.tier}` });
    } else {
      setMessage({
        type: "info",
        text: result.error ?? "No prior purchases found."
      });
    }
  };

  const selectedOffering = OFFERINGS.find((o) => o.id === selectedId);

  return (
    <LinearGradient colors={["#07090d", "#111624", "#261d16"]} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* Hero */}
          <View style={styles.hero}>
            <Text style={styles.badge}>VaultLore Premium</Text>
            <Text style={styles.title}>Unlock the full vault</Text>
            <Text style={styles.subtitle}>
              Unlimited scans, advanced comps, grade-aware alerts, and deep collector intelligence across every category.
            </Text>
          </View>

          {/* Free tier reminder */}
          <View style={styles.freeTier}>
            <Text style={styles.freeTierLabel}>Free tier includes:</Text>
            <View style={styles.freeFeaturesList}>
              {FREE_FEATURES.map((f) => (
                <View key={f} style={styles.freeFeatureRow}>
                  <Text style={styles.freeFeatureDot}>·</Text>
                  <Text style={styles.freeFeatureText}>{f}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Plan selection */}
          <View style={styles.plansSection}>
            <Text style={styles.sectionLabel}>Choose a plan</Text>
            {OFFERINGS.map((offering) => (
              <PlanCard
                key={offering.id}
                offering={offering}
                selected={selectedId === offering.id}
                onSelect={() => setSelectedId(offering.id)}
              />
            ))}
          </View>

          {/* Message */}
          {message && (
            <View style={[
              styles.messageBox,
              message.type === "success" && styles.messageSuccess,
              message.type === "error" && styles.messageError
            ]}>
              <Text style={[
                styles.messageText,
                message.type === "success" && styles.messageTextSuccess,
                message.type === "error" && { color: "#f4a0b0" }
              ]}>
                {message.text}
              </Text>
            </View>
          )}

          {/* Subscribe CTA */}
          <Pressable
            disabled={purchasing || !selectedOffering}
            style={({ pressed }) => [styles.cta, purchasing && styles.ctaDisabled, pressed && { opacity: 0.75 }]}
            onPress={handlePurchase}
          >
            {purchasing ? (
              <View style={styles.ctaInner}>
                <ActivityIndicator color="#111" />
                <Text style={styles.ctaText}>Processing…</Text>
              </View>
            ) : (
              <Text style={styles.ctaText}>
                {selectedOffering
                  ? `Subscribe — ${selectedOffering.price}${selectedOffering.period}`
                  : "Select a plan"}
              </Text>
            )}
          </Pressable>

          {/* Restore */}
          <Pressable
            disabled={restoring}
            style={({ pressed }) => [styles.restoreBtn, pressed && { opacity: 0.7 }]}
            onPress={handleRestore}
          >
            {restoring ? (
              <ActivityIndicator color={vaultLoreTheme.colors.accentPlatinum} />
            ) : (
              <Text style={styles.restoreBtnText}>Restore purchases</Text>
            )}
          </Pressable>

          <Text style={styles.legalNote}>
            Subscriptions are billed via the App Store or Google Play. Cancel anytime in your device's subscription settings.
            Prices shown are in USD.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  content: { padding: 24, gap: 22, paddingBottom: 48 },
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
  subtitle: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 15,
    lineHeight: 22
  },
  freeTier: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: vaultLoreTheme.colors.border,
    borderRadius: vaultLoreTheme.radii.md,
    padding: 14,
    gap: 8
  },
  freeTierLabel: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1
  },
  freeFeaturesList: { gap: 4 },
  freeFeatureRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  freeFeatureDot: { color: vaultLoreTheme.colors.textSecondary, fontSize: 16 },
  freeFeatureText: { color: vaultLoreTheme.colors.textSecondary, fontSize: 13 },
  plansSection: { gap: 12 },
  sectionLabel: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 2
  },
  planCard: {
    backgroundColor: "rgba(18,21,29,0.84)",
    borderWidth: 1,
    borderColor: vaultLoreTheme.colors.border,
    borderRadius: vaultLoreTheme.radii.lg,
    padding: 18,
    gap: 14,
    overflow: "hidden",
    position: "relative"
  },
  planCardSelected: {
    borderColor: vaultLoreTheme.colors.accentGold,
    backgroundColor: "rgba(214,170,82,0.08)"
  },
  planCardPopular: {
    borderColor: "rgba(214,170,82,0.4)"
  },
  popularBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: vaultLoreTheme.colors.accentGold,
    borderRadius: vaultLoreTheme.radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 3
  },
  popularBadgeText: { color: "#111", fontSize: 10, fontWeight: "800" },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  planHeaderLeft: { gap: 4 },
  planLabel: {
    color: vaultLoreTheme.colors.textPrimary,
    fontSize: 18,
    fontWeight: "800"
  },
  planPriceRow: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  planPrice: {
    color: vaultLoreTheme.colors.accentGold,
    fontSize: 26,
    fontWeight: "800"
  },
  planPeriod: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 13
  },
  planSelectDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: vaultLoreTheme.colors.border,
    alignItems: "center",
    justifyContent: "center"
  },
  planSelectDotActive: {
    backgroundColor: vaultLoreTheme.colors.accentGold,
    borderColor: vaultLoreTheme.colors.accentGold
  },
  planSelectCheck: { color: "#111", fontSize: 12, fontWeight: "800" },
  planFeatures: { gap: 8 },
  featureRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  featureTick: {
    color: vaultLoreTheme.colors.accentGold,
    fontSize: 10,
    marginTop: 3,
    opacity: 0.7
  },
  featureText: {
    flex: 1,
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20
  },
  messageBox: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: vaultLoreTheme.colors.border,
    borderRadius: vaultLoreTheme.radii.md,
    padding: 13
  },
  messageSuccess: {
    backgroundColor: "rgba(34,163,122,0.12)",
    borderColor: vaultLoreTheme.colors.accentEmerald
  },
  messageError: {
    backgroundColor: "rgba(143,48,66,0.12)",
    borderColor: vaultLoreTheme.colors.accentCrimson
  },
  messageText: { color: vaultLoreTheme.colors.textSecondary, fontSize: 14, lineHeight: 20 },
  messageTextSuccess: { color: vaultLoreTheme.colors.accentEmerald },
  cta: {
    backgroundColor: vaultLoreTheme.colors.accentGold,
    borderRadius: vaultLoreTheme.radii.pill,
    paddingVertical: 16,
    alignItems: "center"
  },
  ctaDisabled: { backgroundColor: "rgba(214,170,82,0.25)" },
  ctaInner: { flexDirection: "row", gap: 10, alignItems: "center" },
  ctaText: { color: "#111", fontWeight: "800", fontSize: 16 },
  restoreBtn: {
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: vaultLoreTheme.colors.border,
    borderRadius: vaultLoreTheme.radii.pill
  },
  restoreBtnText: {
    color: vaultLoreTheme.colors.accentPlatinum,
    fontSize: 14,
    fontWeight: "600"
  },
  legalNote: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    opacity: 0.6
  }
});

