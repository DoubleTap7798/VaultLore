import { useState } from "react";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

import { vaultLoreTheme } from "@vaultlore/ui";

import { apiClient } from "../lib/api";
import { useAuthStore } from "../lib/auth-store";

const CONFIRM_WORD = "DELETE";

export default function DeleteAccountScreen() {
  const router = useRouter();
  const clearTokens = useAuthStore((s) => s.clearTokens);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmed = input.trim() === CONFIRM_WORD;

  const submit = async () => {
    if (!confirmed) return;
    setError(null);
    setLoading(true);
    try {
      await apiClient.deleteAccount();
      await clearTokens();
      setDeleted(true);
      setTimeout(() => router.replace("/sign-in"), 2200);
    } catch {
      setError("Deletion failed. Make sure you are signed in and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (deleted) {
    return (
      <LinearGradient colors={["#07090d", "#111624", "#261d16"]} style={styles.gradient}>
        <SafeAreaView style={[styles.safeArea, styles.center]}>
          <View style={styles.deletedPanel}>
            <Text style={styles.deletedGlyph}>✓</Text>
            <Text style={styles.deletedTitle}>Account deleted</Text>
            <Text style={styles.deletedCaption}>
              Your data has been scheduled for removal. Redirecting you now…
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#07090d", "#111624", "#1a0808"]} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Pressable style={styles.backBtn} onPress={() => router.back()}>
              <Text style={styles.backBtnText}>← Back</Text>
            </Pressable>

            <View style={styles.hero}>
              <Text style={styles.badge}>Account</Text>
              <Text style={styles.title}>Delete your account</Text>
              <Text style={styles.subtitle}>
                This action permanently deletes your VaultLore account, collection data, watchlist, and session history.
                It cannot be undone.
              </Text>
            </View>

            {/* Warning card */}
            <View style={styles.warningCard}>
              <Text style={styles.warningIcon}>⚠</Text>
              <View style={styles.warningBody}>
                <Text style={styles.warningTitle}>What gets deleted</Text>
                <Text style={styles.warningItem}>· Your account and profile</Text>
                <Text style={styles.warningItem}>· Collection entries and ownership records</Text>
                <Text style={styles.warningItem}>· Watchlist and wishlist data</Text>
                <Text style={styles.warningItem}>· Scan history and session tokens</Text>
                <Text style={styles.warningItem}>· All personal preferences</Text>
              </View>
            </View>

            {/* Confirmation form */}
            <View style={styles.form}>
              <Text style={styles.confirmPrompt}>
                Type <Text style={styles.confirmWord}>DELETE</Text> to confirm
              </Text>
              <TextInput
                autoCapitalize="characters"
                autoCorrect={false}
                placeholder="Type DELETE here"
                placeholderTextColor={vaultLoreTheme.colors.textSecondary}
                style={[styles.input, confirmed && styles.inputConfirmed]}
                value={input}
                onChangeText={(t) => { setInput(t); setError(null); }}
              />

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Pressable
                disabled={!confirmed || loading}
                style={({ pressed }) => [
                  styles.deleteBtn,
                  (!confirmed || loading) && styles.deleteBtnDisabled,
                  pressed && confirmed && { opacity: 0.8 }
                ]}
                onPress={submit}
              >
                <Text style={styles.deleteBtnText}>
                  {loading ? "Deleting account…" : "Permanently delete account"}
                </Text>
              </Pressable>

              <Pressable style={styles.cancelBtn} onPress={() => router.back()}>
                <Text style={styles.cancelBtnText}>Cancel — keep my account</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  center: { justifyContent: "center", alignItems: "center" },
  keyboardView: { flex: 1 },
  content: { padding: 24, gap: 20, paddingBottom: 48 },
  backBtn: { paddingVertical: 4 },
  backBtnText: { color: vaultLoreTheme.colors.accentPlatinum, fontSize: 14, fontWeight: "600" },
  hero: { gap: 10 },
  badge: {
    color: vaultLoreTheme.colors.accentCrimson,
    textTransform: "uppercase",
    letterSpacing: 2,
    fontSize: 12,
    fontWeight: "700"
  },
  title: {
    color: vaultLoreTheme.colors.textPrimary,
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 36
  },
  subtitle: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 21
  },
  warningCard: {
    backgroundColor: "rgba(143,48,66,0.14)",
    borderWidth: 1,
    borderColor: vaultLoreTheme.colors.accentCrimson,
    borderRadius: vaultLoreTheme.radii.lg,
    padding: 16,
    flexDirection: "row",
    gap: 14
  },
  warningIcon: {
    color: vaultLoreTheme.colors.accentCrimson,
    fontSize: 24,
    marginTop: 2
  },
  warningBody: { flex: 1, gap: 5 },
  warningTitle: {
    color: "#f4a0b0",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2
  },
  warningItem: {
    color: "#f4a0b0",
    fontSize: 13,
    lineHeight: 19
  },
  form: {
    backgroundColor: "rgba(18,21,29,0.84)",
    borderWidth: 1,
    borderColor: vaultLoreTheme.colors.border,
    borderRadius: vaultLoreTheme.radii.lg,
    padding: 20,
    gap: 14
  },
  confirmPrompt: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 14
  },
  confirmWord: {
    color: vaultLoreTheme.colors.accentCrimson,
    fontWeight: "800"
  },
  input: {
    borderWidth: 1.5,
    borderColor: vaultLoreTheme.colors.border,
    borderRadius: vaultLoreTheme.radii.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: vaultLoreTheme.colors.textPrimary,
    backgroundColor: "rgba(255,255,255,0.04)",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 2,
    textAlign: "center"
  },
  inputConfirmed: {
    borderColor: vaultLoreTheme.colors.accentCrimson,
    backgroundColor: "rgba(143,48,66,0.1)"
  },
  errorBox: {
    backgroundColor: "rgba(143,48,66,0.14)",
    borderWidth: 1,
    borderColor: vaultLoreTheme.colors.accentCrimson,
    borderRadius: vaultLoreTheme.radii.sm,
    padding: 12
  },
  errorText: { color: "#f4a0b0", fontSize: 13 },
  deleteBtn: {
    backgroundColor: vaultLoreTheme.colors.accentCrimson,
    borderRadius: vaultLoreTheme.radii.pill,
    paddingVertical: 14,
    alignItems: "center"
  },
  deleteBtnDisabled: { backgroundColor: "rgba(143,48,66,0.25)" },
  deleteBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15
  },
  cancelBtn: {
    paddingVertical: 8,
    alignItems: "center"
  },
  cancelBtnText: {
    color: vaultLoreTheme.colors.accentPlatinum,
    fontSize: 14
  },
  deletedPanel: {
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 40
  },
  deletedGlyph: {
    color: vaultLoreTheme.colors.accentEmerald,
    fontSize: 52
  },
  deletedTitle: {
    color: vaultLoreTheme.colors.textPrimary,
    fontSize: 24,
    fontWeight: "800"
  },
  deletedCaption: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center"
  }
});

