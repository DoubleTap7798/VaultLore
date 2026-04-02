import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { vaultLoreTheme } from "@vaultlore/ui";

import { ScreenShell } from "../components/ScreenShell";
import { apiClient } from "../lib/api";

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!token) {
      setError("Invalid reset link — no token found.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      await apiClient.resetPassword(token, password);
      setDone(true);
    } catch {
      setError("Reset failed. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <ScreenShell title="Password updated" subtitle="Your password has been changed. Sign in with your new credentials.">
        <Pressable onPress={() => router.replace("/sign-in")} style={styles.button}>
          <Text style={styles.buttonText}>Sign in</Text>
        </Pressable>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell title="Set new password" subtitle="Choose a strong password for your VaultLore account.">
      <TextInput
        secureTextEntry
        placeholder="New password"
        placeholderTextColor={vaultLoreTheme.colors.textSecondary}
        returnKeyType="next"
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />
      <TextInput
        secureTextEntry
        placeholder="Confirm new password"
        placeholderTextColor={vaultLoreTheme.colors.textSecondary}
        returnKeyType="done"
        style={styles.input}
        value={confirm}
        onChangeText={setConfirm}
        onSubmitEditing={submit}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable onPress={submit} style={styles.button} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? "Updating..." : "Update password"}</Text>
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
  error: {
    color: "#f17a8d",
    fontSize: 13
  }
});
