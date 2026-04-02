"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { initWebMonitoring } from "../lib/monitoring";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    void initWebMonitoring();
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
