import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput } from "react-native";
import { useRouter } from "expo-router";

import { vaultLoreTheme } from "@vaultlore/ui";

import { ScreenShell } from "../components/ScreenShell";
import { apiClient } from "../lib/api";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await apiClient.forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <ScreenShell
        title="Check your inbox"
        subtitle="A password reset link has been sent. It expires in 1 hour."
      >
        <Text style={styles.hint}>
          If {email} is registered, you'll receive an email shortly. Check your spam folder if it doesn't arrive.
        </Text>
        <Pressable onPress={() => router.replace("/sign-in")} style={styles.button}>
          <Text style={styles.buttonText}>Back to sign in</Text>
        </Pressable>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell
      title="Forgot password"
      subtitle="Enter your email and we'll send a secure reset link."
    >
      <TextInput
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        placeholder="Email address"
        placeholderTextColor={vaultLoreTheme.colors.textSecondary}
        returnKeyType="send"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        onSubmitEditing={submit}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable onPress={submit} style={styles.button} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? "Sending..." : "Send reset link"}</Text>
      </Pressable>
      <Pressable onPress={() => router.back()} style={styles.ghost}>
        <Text style={styles.ghostText}>Back to sign in</Text>
      </Pressable>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: vaultLoreTheme.colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: vaultLoreTheme.colors.textPrimary,
    backgroundColor: "rgba(255,255,255,0.03)"
  },
  button: {
    backgroundColor: vaultLoreTheme.colors.accentGold,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12
  },
  buttonText: {
    color: "#111",
    fontWeight: "800",
    fontSize: 15
  },
  ghost: {
    alignItems: "center",
    paddingVertical: 10
  },
  ghostText: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 14
  },
  hint: {
    color: vaultLoreTheme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 22
  },
  error: {
    color: "#f17a8d",
    fontSize: 13
  }
});

