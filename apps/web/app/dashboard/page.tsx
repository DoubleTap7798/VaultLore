"use client";

import { useState } from "react";

import { createApiClient } from "@vaultlore/api-client";

const api = createApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/v1"
});

export default function DashboardPage() {
  const [token, setToken] = useState("");
  const [data, setData] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    setData("");

    try {
      const client = createApiClient({
        baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/v1",
        getToken: () => token
      });
      const me = await client.getMe();
      setData(JSON.stringify(me, null, 2));
    } catch {
      setError("Failed to load /users/me. Verify token and NEXT_PUBLIC_API_URL.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page">
      <section className="card">
        <div className="eyebrow">Web Companion</div>
        <h1>Authenticated Dashboard Check</h1>
        <p>Paste a valid access token and validate production API auth from web.</p>
        <textarea
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Bearer access token"
          style={{ width: "100%", minHeight: 120, borderRadius: 12, padding: 12 }}
        />
        <button className="primaryButton" onClick={load} disabled={loading || !token.trim()}>
          {loading ? "Loading..." : "Load profile"}
        </button>
        {error ? <p>{error}</p> : null}
        {data ? <pre>{data}</pre> : null}
      </section>
    </main>
  );
}
