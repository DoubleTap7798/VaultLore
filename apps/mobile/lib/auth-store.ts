import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

const ACCESS_TOKEN_KEY = "vaultlore_access_token";
const REFRESH_TOKEN_KEY = "vaultlore_refresh_token";

function parseJwtSub(token: string): string | null {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(
      decodeURIComponent(
        atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      )
    ) as { sub?: string };
    return decoded.sub ?? null;
  } catch {
    return null;
  }
}

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  hydrated: boolean;
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  clearTokens: () => Promise<void>;
  hydrate: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  userId: null,
  hydrated: false,
  async setTokens(accessToken, refreshToken) {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    set({ accessToken, refreshToken, userId: parseJwtSub(accessToken) });
  },
  async clearTokens() {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    set({ accessToken: null, refreshToken: null, userId: null });
  },
  async hydrate() {
    const [accessToken, refreshToken] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.getItemAsync(REFRESH_TOKEN_KEY)
    ]);

    set({
      accessToken,
      refreshToken,
      userId: accessToken ? parseJwtSub(accessToken) : null,
      hydrated: true
    });
  }
}));
