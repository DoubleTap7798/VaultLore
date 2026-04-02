import { Link } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";

import { vaultLoreTheme } from "@vaultlore/ui";

type ScreenShellProps = {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
};

export function ScreenShell({ title, subtitle, children }: ScreenShellProps) {
  return (
    <LinearGradient colors={["#090b10", "#121723", "#231a14"]} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.hero}>
            <Text style={styles.badge}>VaultLore</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          <View style={styles.panel}>{children}</View>
          <Link href="/" style={styles.link}>
            ← Back to home
          </Link>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

export function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailCard}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  content: { padding: 20, gap: 18 },
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
  panel: {
    backgroundColor: "rgba(18, 21, 29, 0.84)",
    borderWidth: 1,
    borderColor: vaultLoreTheme.colors.border,
    borderRadius: vaultLoreTheme.radii.lg,
    padding: 18,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 }
  },
  detailCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 14,
    borderRadius: vaultLoreTheme.radii.md,
    borderWidth: 1,
    borderColor: vaultLoreTheme.colors.border,
    gap: 6
  },
  detailLabel: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1
  },
  detailValue: {
    color: vaultLoreTheme.colors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22
  },
  link: {
    color: vaultLoreTheme.colors.accentPlatinum,
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 12,
    paddingBottom: 24
  }
});
