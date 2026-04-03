"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { createApiClient } from "@vaultlore/api-client";

import { webEnv } from "../lib/env";

const baseUrl = webEnv.NEXT_PUBLIC_API_URL;

export function LiveDashboard() {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return window.localStorage.getItem("vaultlore_access_token");
  });
  const [refreshToken, setRefreshToken] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return window.localStorage.getItem("vaultlore_refresh_token");
  });
  const [email, setEmail] = useState("collector@vaultlore.app");
  const [password, setPassword] = useState("Password123!");
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const client = useMemo(
    () =>
      createApiClient({
        baseUrl,
        getToken: () => token,
        getRefreshToken: () => refreshToken,
        onAccessToken: (nextToken) => {
          setToken(nextToken);
          window.localStorage.setItem("vaultlore_access_token", nextToken);
        },
        onAuthFailure: () => {
          setToken(null);
          setRefreshToken(null);
          window.localStorage.removeItem("vaultlore_access_token");
          window.localStorage.removeItem("vaultlore_refresh_token");
        }
      }),
    [token, refreshToken]
  );

  const meQuery = useQuery({
    queryKey: ["web-me", token],
    queryFn: () => client.getMe(),
    enabled: Boolean(token)
  });

  const marketQuery = useQuery({
    queryKey: ["web-market-home"],
    queryFn: () => client.getMarketHome()
  });

  const collectionQuery = useQuery({
    queryKey: ["web-collection", token],
    queryFn: () => client.getCollection(),
    enabled: Boolean(token)
  });

  const signIn = async () => {
    setLoading(true);
    setAuthError(null);

    try {
      const response = await client.login({ email, password });
      setToken(response.accessToken);
      setRefreshToken(response.refreshToken);
      window.localStorage.setItem("vaultlore_access_token", response.accessToken);
      window.localStorage.setItem("vaultlore_refresh_token", response.refreshToken);
    } catch {
      setAuthError("Unable to sign in. Check credentials or backend availability.");
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    if (refreshToken) {
      try {
        await client.logout(refreshToken);
      } catch {
        // Keep local signout resilient if backend is unavailable.
      }
    }

    setToken(null);
    setRefreshToken(null);
    window.localStorage.removeItem("vaultlore_access_token");
    window.localStorage.removeItem("vaultlore_refresh_token");
  };

  return (
    <section className="card" style={{ marginTop: 18 }}>
      <div className="eyebrow">Live vault session</div>
      <h2>Authenticated collector dashboard</h2>
      {!token ? (
        <div className="authForm">
          <input
            className="textInput"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
          />
          <input
            className="textInput"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
          />
          <button className="primaryButton" type="button" onClick={signIn} disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
          {authError ? <p className="errorText">{authError}</p> : null}
        </div>
      ) : (
        <div className="grid stats">
          <article className="card panelInset">
            <h3>Collector</h3>
            <p>{meQuery.data ? meQuery.data.email : "Loading profile..."}</p>
            <p className="meta">{meQuery.data ? meQuery.data.plan : "Plan unavailable"}</p>
          </article>
          <article className="card panelInset">
            <h3>Collection value</h3>
            <p>
              {collectionQuery.data
                ? `$${collectionQuery.data.totalValue.toLocaleString()}`
                : "Loading collection..."}
            </p>
            <p className="meta">
              {collectionQuery.data
                ? `${collectionQuery.data.items.length} cards tracked`
                : "Waiting for vault response"}
            </p>
          </article>
          <article className="card panelInset">
            <h3>Top mover</h3>
            <p>{marketQuery.data?.topMovers[0]?.title ?? "Loading market pulse..."}</p>
            <p className="meta">
              {marketQuery.data?.topMovers[0]
                ? `${marketQuery.data.topMovers[0].deltaPercent.toFixed(1)}%`
                : "No mover data yet"}
            </p>
          </article>
          <button className="secondaryButton" type="button" onClick={signOut}>
            Sign out
          </button>
        </div>
      )}
    </section>
  );
}
