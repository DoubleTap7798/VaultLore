import { useState } from "react";
import { Link, useRouter } from "expo-router";
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

function validate(email: string, password: string, confirm: string): string | null {
  if (!email.trim()) return "Email is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email address.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (password !== confirm) return "Passwords do not match.";
  return null;
}

export default function SignUpScreen() {
  const router = useRouter();
  const setTokens = useAuthStore((state) => state.setTokens);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const validationError = validate(email, password, confirm);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const response = await apiClient.register({ email: email.trim().toLowerCase(), password });
      await setTokens(response.accessToken, response.refreshToken);
      router.replace("/onboarding");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed.";
      if (message.includes("409")) {
        setError("An account with this email already exists.");
      } else {
        setError("Unable to create account. Check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#07090d", "#111624", "#261d16"]} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.hero}>
              <Text style={styles.badge}>VaultLore</Text>
              <Text style={styles.title}>Create your account</Text>
              <Text style={styles.subtitle}>
                Join the collector intelligence platform. Scan, vault, and track every card that matters.
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Email address</Text>
                <TextInput
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  placeholder="your@email.com"
                  placeholderTextColor={vaultLoreTheme.colors.textSecondary}
                  style={styles.input}
                  value={email}
                  onChangeText={(t) => { setEmail(t); setError(null); }}
                  returnKeyType="next"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Password</Text>
                <TextInput
                  secureTextEntry
                  autoComplete="password-new"
                  placeholder="Minimum 8 characters"
                  placeholderTextColor={vaultLoreTheme.colors.textSecondary}
                  style={styles.input}
                  value={password}
                  onChangeText={(t) => { setPassword(t); setError(null); }}
                  returnKeyType="next"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Confirm password</Text>
                <TextInput
                  secureTextEntry
                  autoComplete="password-new"
                  placeholder="Re-enter your password"
                  placeholderTextColor={vaultLoreTheme.colors.textSecondary}
                  style={styles.input}
                  value={confirm}
                  onChangeText={(t) => { setConfirm(t); setError(null); }}
                  returnKeyType="done"
                  onSubmitEditing={submit}
                />
              </View>

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Pressable
                disabled={loading}
                style={({ pressed }) => [styles.cta, pressed && { opacity: 0.75 }]}
                onPress={submit}
              >
                <Text style={styles.ctaText}>{loading ? "Creating account…" : "Create account"}</Text>
              </Pressable>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already a collector? </Text>
              <Link href="/sign-in" style={styles.footerLink}>Sign in</Link>
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
  keyboardView: { flex: 1 },
  content: { padding: 24, gap: 28, paddingBottom: 48 },
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
  form: {
    backgroundColor: "rgba(18, 21, 29, 0.84)",
    borderWidth: 1,
    borderColor: vaultLoreTheme.colors.border,
    borderRadius: vaultLoreTheme.radii.lg,
    padding: 20,
    gap: 16
  },
  fieldGroup: { gap: 6 },
  fieldLabel: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1
  },
  input: {
    borderWidth: 1,
    borderColor: vaultLoreTheme.colors.border,
    borderRadius: vaultLoreTheme.radii.sm,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: vaultLoreTheme.colors.textPrimary,
    backgroundColor: "rgba(255,255,255,0.04)",
    fontSize: 15
  },
  errorBox: {
    backgroundColor: "rgba(143, 48, 66, 0.18)",
    borderWidth: 1,
    borderColor: vaultLoreTheme.colors.accentCrimson,
    borderRadius: vaultLoreTheme.radii.sm,
    padding: 12
  },
  errorText: {
    color: "#f4a0b0",
    fontSize: 14,
    lineHeight: 20
  },
  cta: {
    backgroundColor: vaultLoreTheme.colors.accentGold,
    borderRadius: vaultLoreTheme.radii.pill,
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 4
  },
  ctaText: {
    color: "#111",
    fontWeight: "800",
    fontSize: 15
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center"
  },
  footerText: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 14
  },
  footerLink: {
    color: vaultLoreTheme.colors.accentGold,
    fontSize: 14,
    fontWeight: "700"
  }
});

