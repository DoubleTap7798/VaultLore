import { useState } from "react";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View
} from "react-native";

import { vaultLoreTheme } from "@vaultlore/ui";

import {
  type CollectorCategory,
  type CollectorGoal,
  type ExperienceLevel,
  useOnboardingStore
} from "../lib/onboarding-store";
import { apiClient } from "../lib/api";

const CATEGORIES: Array<{ id: CollectorCategory; label: string }> = [
  { id: "basketball", label: "Basketball" },
  { id: "baseball", label: "Baseball" },
  { id: "football", label: "Football" },
  { id: "pokemon", label: "Pokémon" },
  { id: "marvel", label: "Marvel" },
  { id: "tcg", label: "TCG" },
  { id: "entertainment", label: "Entertainment" },
  { id: "all-cards", label: "All Cards" }
];

const GOALS: Array<{ id: CollectorGoal; label: string; caption: string }> = [
  { id: "collect", label: "Collect", caption: "Build a showcase collection" },
  { id: "invest", label: "Invest", caption: "Long-term portfolio growth" },
  { id: "flip", label: "Flip", caption: "Buy low, sell high" },
  { id: "grade", label: "Grade", caption: "Submit and track graded cards" },
  { id: "track", label: "Track", caption: "Monitor what you already own" }
];

const LEVELS: Array<{ id: ExperienceLevel; label: string; caption: string }> = [
  { id: "beginner", label: "Beginner", caption: "Just getting started" },
  { id: "intermediate", label: "Intermediate", caption: "Familiar with the hobby" },
  { id: "advanced", label: "Advanced", caption: "Seasoned collector" }
];

export default function OnboardingScreen() {
  const router = useRouter();
  const store = useOnboardingStore();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const finish = async () => {
    setSaving(true);
    setSaveError(null);
    // Persist locally first (optimistic).
    await store.complete();
    // Persist to backend so preferences are available on any device.
    try {
      await apiClient.patchMe({
        favoriteCategories: store.categories as string[],
        collectorGoals: store.goals as Array<"collect" | "invest" | "flip" | "grade" | "track">,
        collectorLevel: store.experienceLevel as "beginner" | "intermediate" | "advanced" | undefined,
        alertsEnabled: store.notificationsEnabled,
        onboardingCompleted: true
      });
    } catch {
      // Non-blocking — local store already saved. Show a soft warning.
      setSaveError("Preferences saved locally. They will sync next time you're online.");
      await new Promise((r) => setTimeout(r, 1800));
    }
    router.replace("/");
  };

  return (
    <LinearGradient colors={["#07090d", "#111624", "#261d16"]} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.hero}>
            <Text style={styles.badge}>VaultLore</Text>
            <Text style={styles.title}>Set up your vault</Text>
            <Text style={styles.subtitle}>
              Tell us what you collect and we'll personalize your market intelligence, alerts, and discovery.
            </Text>
          </View>

          {/* Categories */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>What do you collect?</Text>
            <Text style={styles.sectionCaption}>Select all that apply</Text>
            <View style={styles.chipGrid}>
              {CATEGORIES.map((cat) => {
                const active = store.categories.includes(cat.id);
                return (
                  <Pressable
                    key={cat.id}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => store.toggleCategory(cat.id)}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Goals */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Collector goals</Text>
            <Text style={styles.sectionCaption}>What drives your collecting?</Text>
            <View style={styles.goalList}>
              {GOALS.map((goal) => {
                const active = store.goals.includes(goal.id);
                return (
                  <Pressable
                    key={goal.id}
                    style={[styles.goalRow, active && styles.goalRowActive]}
                    onPress={() => store.toggleGoal(goal.id)}
                  >
                    <View style={[styles.goalCheck, active && styles.goalCheckActive]}>
                      {active ? <Text style={styles.goalCheckMark}>✓</Text> : null}
                    </View>
                    <View style={styles.goalTextBlock}>
                      <Text style={[styles.goalLabel, active && styles.goalLabelActive]}>
                        {goal.label}
                      </Text>
                      <Text style={styles.goalCaption}>{goal.caption}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Experience */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Experience level</Text>
            <View style={styles.levelRow}>
              {LEVELS.map((lvl) => {
                const active = store.experienceLevel === lvl.id;
                return (
                  <Pressable
                    key={lvl.id}
                    style={[styles.levelCard, active && styles.levelCardActive]}
                    onPress={() => store.setExperienceLevel(lvl.id)}
                  >
                    <Text style={[styles.levelLabel, active && styles.levelLabelActive]}>
                      {lvl.label}
                    </Text>
                    <Text style={styles.levelCaption}>{lvl.caption}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Notifications */}
          <View style={styles.section}>
            <View style={styles.notifRow}>
              <View style={styles.notifText}>
                <Text style={styles.sectionLabel}>Smart alerts</Text>
                <Text style={styles.sectionCaption}>
                  Price triggers, scan results, and market pulse notifications
                </Text>
              </View>
              <Switch
                value={store.notificationsEnabled}
                onValueChange={store.setNotificationsEnabled}
                trackColor={{
                  false: "rgba(255,255,255,0.1)",
                  true: vaultLoreTheme.colors.accentGold
                }}
                thumbColor={vaultLoreTheme.colors.textPrimary}
              />
            </View>
          </View>

          <Pressable
            disabled={saving}
            style={({ pressed }) => [styles.cta, pressed && { opacity: 0.75 }]}
            onPress={finish}
          >
            <Text style={styles.ctaText}>{saving ? "Saving…" : "Enter your vault"}</Text>
          </Pressable>

          {saveError ? (
            <View style={styles.saveErrorBox}>
              <Text style={styles.saveErrorText}>{saveError}</Text>
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  content: { padding: 24, gap: 24, paddingBottom: 48 },
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
  section: {
    backgroundColor: "rgba(18,21,29,0.84)",
    borderWidth: 1,
    borderColor: vaultLoreTheme.colors.border,
    borderRadius: vaultLoreTheme.radii.lg,
    padding: 18,
    gap: 12
  },
  sectionLabel: {
    color: vaultLoreTheme.colors.textPrimary,
    fontSize: 16,
    fontWeight: "700"
  },
  sectionCaption: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: -6
  },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: vaultLoreTheme.radii.pill,
    borderWidth: 1,
    borderColor: vaultLoreTheme.colors.border,
    backgroundColor: "rgba(255,255,255,0.03)"
  },
  chipActive: {
    backgroundColor: "rgba(214,170,82,0.15)",
    borderColor: vaultLoreTheme.colors.accentGold
  },
  chipText: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 14,
    fontWeight: "600"
  },
  chipTextActive: { color: vaultLoreTheme.colors.accentGold },
  goalList: { gap: 8 },
  goalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: vaultLoreTheme.radii.md,
    borderWidth: 1,
    borderColor: vaultLoreTheme.colors.border,
    backgroundColor: "rgba(255,255,255,0.02)"
  },
  goalRowActive: {
    backgroundColor: "rgba(214,170,82,0.1)",
    borderColor: vaultLoreTheme.colors.accentGold
  },
  goalCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: vaultLoreTheme.colors.border,
    alignItems: "center",
    justifyContent: "center"
  },
  goalCheckActive: {
    backgroundColor: vaultLoreTheme.colors.accentGold,
    borderColor: vaultLoreTheme.colors.accentGold
  },
  goalCheckMark: { color: "#111", fontSize: 12, fontWeight: "800", lineHeight: 14 },
  goalTextBlock: { flex: 1, gap: 2 },
  goalLabel: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 15,
    fontWeight: "600"
  },
  goalLabelActive: { color: vaultLoreTheme.colors.textPrimary },
  goalCaption: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 16
  },
  levelRow: { flexDirection: "row", gap: 8 },
  levelCard: {
    flex: 1,
    padding: 12,
    borderRadius: vaultLoreTheme.radii.md,
    borderWidth: 1,
    borderColor: vaultLoreTheme.colors.border,
    backgroundColor: "rgba(255,255,255,0.02)",
    alignItems: "center",
    gap: 4
  },
  levelCardActive: {
    backgroundColor: "rgba(214,170,82,0.12)",
    borderColor: vaultLoreTheme.colors.accentGold
  },
  levelLabel: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 14,
    fontWeight: "700"
  },
  levelLabelActive: { color: vaultLoreTheme.colors.accentGold },
  levelCaption: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 11,
    textAlign: "center",
    lineHeight: 15
  },
  notifRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16
  },
  notifText: { flex: 1, gap: 4 },
  cta: {
    backgroundColor: vaultLoreTheme.colors.accentGold,
    borderRadius: vaultLoreTheme.radii.pill,
    alignItems: "center",
    paddingVertical: 16
  },
  ctaText: {
    color: "#111",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.3
  },
  saveErrorBox: {
    backgroundColor: "rgba(255,200,80,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,200,80,0.3)",
    borderRadius: vaultLoreTheme.radii.md,
    padding: 12
  },
  saveErrorText: {
    color: "rgba(255,200,80,0.85)",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center"
  }
});

