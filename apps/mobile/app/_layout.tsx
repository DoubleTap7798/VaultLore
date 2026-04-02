import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";

import { useAuthStore } from "../lib/auth-store";
import { initMobileMonitoring } from "../lib/monitoring";
import { identifyPurchasesUser, initPurchases } from "../lib/purchases-service";

const queryClient = new QueryClient();

const RC_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_KEY ?? "";

export default function RootLayout() {
  const hydrate = useAuthStore((state) => state.hydrate);
  const userId = useAuthStore((state) => state.userId);

  useEffect(() => {
    initMobileMonitoring();
    void hydrate();
    initPurchases(RC_API_KEY);
  }, [hydrate]);

  useEffect(() => {
    void identifyPurchasesUser(userId);
  }, [userId]);

  return (
    <QueryClientProvider client={queryClient}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade"
        }}
      />
    </QueryClientProvider>
  );
}

