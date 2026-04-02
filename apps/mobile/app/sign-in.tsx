import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput } from "react-native";

import { vaultLoreTheme } from "@vaultlore/ui";

import { DetailCard, ScreenShell } from "../components/ScreenShell";
import { apiClient } from "../lib/api";
import { useAuthStore } from "../lib/auth-store";

export default function SignInScreen() {
  const setTokens = useAuthStore((state) => state.setTokens);
  const [email, setEmail] = useState("collector@vaultlore.app");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    setLoading(true);

    try {
      const response = await apiClient.login({ email, password });
      await setTokens(response.accessToken, response.refreshToken);
    } catch {
      setError("Unable to sign in. Check credentials or backend availability.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenShell title="Sign in" subtitle="Email/password auth with secure session restore and premium-ready account state.">
      <TextInput
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Email"
        placeholderTextColor={vaultLoreTheme.colors.textSecondary}
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        secureTextEntry
        placeholder="Password"
        placeholderTextColor={vaultLoreTheme.colors.textSecondary}
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />
      <Pressable onPress={submit} style={styles.button} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? "Signing in..." : "Sign in"}</Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <DetailCard label="Recovery" value="Forgot password and reset token flow" />
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
