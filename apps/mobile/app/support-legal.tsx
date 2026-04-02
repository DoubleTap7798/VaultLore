import Constants from "expo-constants";
import { Linking, Pressable, StyleSheet, Text } from "react-native";

import { vaultLoreTheme } from "@vaultlore/ui";

import { ScreenShell } from "../components/ScreenShell";

const extra = Constants.expoConfig?.extra as {
  privacyUrl?: string;
  termsUrl?: string;
  supportUrl?: string;
  supportEmail?: string;
} | undefined;

const privacyUrl = extra?.privacyUrl ?? "https://app.vaultlore.app/privacy";
const termsUrl = extra?.termsUrl ?? "https://app.vaultlore.app/terms";
const supportUrl = extra?.supportUrl ?? "https://app.vaultlore.app/support";
const supportEmail = extra?.supportEmail ?? "support@vaultlore.app";

export default function SupportLegalScreen() {
  const open = async (url: string) => {
    await Linking.openURL(url);
  };

  return (
    <ScreenShell
      title="Support and legal"
      subtitle="Consumer-facing policy and support endpoints required for App Store and Google Play review."
    >
      <Pressable style={styles.linkCard} onPress={() => open(privacyUrl)}>
        <Text style={styles.label}>Privacy policy</Text>
        <Text style={styles.value}>{privacyUrl}</Text>
      </Pressable>
      <Pressable style={styles.linkCard} onPress={() => open(termsUrl)}>
        <Text style={styles.label}>Terms of service</Text>
        <Text style={styles.value}>{termsUrl}</Text>
      </Pressable>
      <Pressable style={styles.linkCard} onPress={() => open(supportUrl)}>
        <Text style={styles.label}>Support</Text>
        <Text style={styles.value}>{supportUrl}</Text>
      </Pressable>
      <Pressable style={styles.linkCard} onPress={() => open(`mailto:${supportEmail}`)}>
        <Text style={styles.label}>Support email</Text>
        <Text style={styles.value}>{supportEmail}</Text>
      </Pressable>
      <Text style={styles.note}>
        Account deletion is available in-app via Settings {'>'} Delete Account and processed immediately.
      </Text>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  linkCard: {
    borderWidth: 1,
    borderColor: vaultLoreTheme.colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.03)",
    gap: 4
  },
  label: {
    color: vaultLoreTheme.colors.textPrimary,
    fontWeight: "700",
    fontSize: 14
  },
  value: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 13
  },
  note: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 19
  }
});
