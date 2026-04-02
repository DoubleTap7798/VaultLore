import Constants from "expo-constants";

import { createApiClient } from "@vaultlore/api-client";

import { useAuthStore } from "./auth-store";

const fromExpoConfig = Constants.expoConfig?.extra?.apiUrl as string | undefined;
const fromEnv = process.env.EXPO_PUBLIC_API_URL;

const baseUrl = fromEnv ?? fromExpoConfig ?? "http://localhost:4000/v1";

export const apiClient = createApiClient({
  baseUrl,
  getToken: () => useAuthStore.getState().accessToken,
  getRefreshToken: () => useAuthStore.getState().refreshToken,
  onAccessToken: async (accessToken) => {
    const store = useAuthStore.getState();
    if (store.refreshToken) {
      await store.setTokens(accessToken, store.refreshToken);
    }
  },
  onAuthFailure: async () => {
    await useAuthStore.getState().clearTokens();
  }
});
