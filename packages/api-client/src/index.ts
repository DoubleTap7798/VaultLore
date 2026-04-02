import type {
  CardIdentity,
  cardCategories,
  CollectorSignificanceTier
} from "@vaultlore/shared";

type CardCategory = (typeof cardCategories)[number];

export type ApiClientOptions = {
  baseUrl: string;
  getToken?: () => Promise<string | null> | string | null;
  getRefreshToken?: () => Promise<string | null> | string | null;
  onAccessToken?: (accessToken: string) => Promise<void> | void;
  onAuthFailure?: () => Promise<void> | void;
};

export type AuthResponse = {
  user: {
    id: string;
    email: string;
  };
  accessToken: string;
  refreshToken: string;
};

export type CurrentUser = {
  id: string;
  email: string;
  displayName: string | null;
  plan: string;
  favoriteCategories: string[];
  collectorLevel: string | null;
  collectorGoals: string[];
  alertsEnabled: boolean;
  onboardingCompleted: boolean;
};

export type MarketPulse = {
  topMovers: Array<{
    id: string;
    title: string;
    deltaPercent: number;
    tier: CollectorSignificanceTier;
  }>;
  categories: Array<{
    category: CardCategory;
    trend: "up" | "down" | "flat";
    summary: string;
  }>;
};

export type CardSearchResult = {
  id: string;
  title: string;
  category: string;
  setName: string | null;
  year: number | null;
  subjectName: string;
  cardNumber: string | null;
  rarity: string | null;
  collectorTier: string | null;
  parallel: string | null;
  imageUrl: string | null;
};

export type CardDetail = CardSearchResult & {
  variant: string | null;
  language: string | null;
  franchise: string | null;
  universe: string | null;
  team: string | null;
  league: string | null;
  rawEstimatedValue: number;
  gradedEstimatedValue: number;
  marketMovement: string;
  gradingPotential: string;
  notableFacts: string[];
  moments: string[];
  relatedCards: CardSearchResult[];
};

export type Category = {
  slug: string;
  label: string;
  pulse: string;
};

export type ScanCreateResult = {
  jobId: string;
  uploadId?: string;
  status: string;
  categoryHint: string | null;
};

export type ScanJobResult = {
  jobId: string;
  status: string;
  confidence: number | null;
  matches: CardIdentity[];
  analyzedAt: string | null;
};

export type CollectionItem = {
  id: string;
  userId: string;
  cardId: string;
  quantity: number;
  condition: string;
  gradeCompany: string | null;
  gradeValue: string | null;
  purchasePrice: string | null;
  purchaseDate: string | null;
  folder: string | null;
  notes: string | null;
  tags: string[];
  favorite: boolean;
  showcase: boolean;
  createdAt: string;
};

export type CollectionSummary = {
  items: CollectionItem[];
  totalValue: number;
  gainLossEstimate: string;
  showcaseCount: number;
};

export type CompEntry = {
  saleDate: string;
  venue: string;
  price: number;
  grade: string;
};

export type CompsResult = {
  cardId: string;
  comps: CompEntry[];
};

export type PatchUserPayload = {
  displayName?: string;
  favoriteCategories?: string[];
  collectorLevel?: "beginner" | "intermediate" | "advanced";
  collectorGoals?: Array<"collect" | "invest" | "flip" | "grade" | "track">;
  alertsEnabled?: boolean;
  onboardingCompleted?: boolean;
};

export type PatchCollectionItemPayload = {
  quantity?: number;
  condition?: "raw" | "graded";
  gradeCompany?: string;
  gradeValue?: number;
  purchasePrice?: number;
  purchaseDate?: string;
  notes?: string;
  tags?: string[];
  folder?: string;
  favorite?: boolean;
  showcase?: boolean;
};

async function request<T>(
  path: string,
  init: RequestInit | undefined,
  options: ApiClientOptions
): Promise<T> {
  const buildHeaders = (token: string | null | undefined) => ({
    "content-type": "application/json",
    ...(token ? { authorization: `Bearer ${token}` } : {}),
    ...(init?.headers ?? {})
  });

  const token = await options.getToken?.();
  let response = await fetch(`${options.baseUrl}${path}`, {
    ...init,
    headers: buildHeaders(token)
  });

  if (response.status === 401 && path !== "/auth/login" && path !== "/auth/register" && path !== "/auth/refresh") {
    const refreshToken = await options.getRefreshToken?.();
    if (!refreshToken) {
      await options.onAuthFailure?.();
    } else {
      const refreshResponse = await fetch(`${options.baseUrl}/auth/refresh`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ refreshToken })
      });

      if (refreshResponse.ok) {
        const refreshPayload = (await refreshResponse.json()) as { accessToken: string };
        await options.onAccessToken?.(refreshPayload.accessToken);
        response = await fetch(`${options.baseUrl}${path}`, {
          ...init,
          headers: buildHeaders(refreshPayload.accessToken)
        });
      } else {
        await options.onAuthFailure?.();
      }
    }
  }

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

/**
 * Multipart upload helper — does NOT inject content-type (browser/RN sets boundary automatically).
 */
async function uploadMultipart<T>(
  path: string,
  formData: FormData,
  options: ApiClientOptions
): Promise<T> {
  const token = await options.getToken?.();
  const headers: Record<string, string> = token ? { authorization: `Bearer ${token}` } : {};

  let response = await fetch(`${options.baseUrl}${path}`, {
    method: "POST",
    headers,
    body: formData
  });

  if (response.status === 401) {
    const refreshToken = await options.getRefreshToken?.();
    if (refreshToken) {
      const refreshResponse = await fetch(`${options.baseUrl}/auth/refresh`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ refreshToken })
      });
      if (refreshResponse.ok) {
        const refreshPayload = (await refreshResponse.json()) as { accessToken: string };
        await options.onAccessToken?.(refreshPayload.accessToken);
        response = await fetch(`${options.baseUrl}${path}`, {
          method: "POST",
          headers: { authorization: `Bearer ${refreshPayload.accessToken}` },
          body: formData
        });
      } else {
        await options.onAuthFailure?.();
      }
    } else {
      await options.onAuthFailure?.();
    }
  }

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

export function createApiClient(options: ApiClientOptions) {
  return {
    register: (payload: { email: string; password: string }) =>
      request<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload)
      }, options),
    login: (payload: { email: string; password: string }) =>
      request<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(payload)
      }, options),
    refresh: (refreshToken: string) =>
      request<{ accessToken: string }>("/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refreshToken })
      }, options),
    logout: (refreshToken: string) =>
      request<{ success: boolean }>("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken })
      }, options),
    deleteAccount: () =>
      request<{ success: boolean; deletedAt: string }>("/auth/delete-account", {
        method: "DELETE"
      }, options),
    forgotPassword: (email: string) =>
      request<{ queued: boolean }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email })
      }, options),
    resetPassword: (token: string, password: string) =>
      request<{ success: boolean }>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password })
      }, options),
    getMe: () => request<CurrentUser>("/users/me", undefined, options),
    patchMe: (payload: PatchUserPayload) =>
      request<CurrentUser>("/users/me", {
        method: "PATCH",
        body: JSON.stringify(payload)
      }, options),
    getCollection: () =>
      request<CollectionSummary>("/collection", undefined, options),
    getCollectionItem: (id: string) =>
      request<CollectionItem>(`/collection/${id}`, undefined, options),
    patchCollectionItem: (id: string, payload: PatchCollectionItemPayload) =>
      request<CollectionItem>(`/collection/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload)
      }, options),
    deleteCollectionItem: (id: string) =>
      request<{ success: boolean; deletedId: string }>(`/collection/${id}`, {
        method: "DELETE"
      }, options),
    addToCollection: (payload: {
      cardId: string;
      quantity?: number;
      condition: "raw" | "graded";
      gradeCompany?: string;
      gradeValue?: number;
      purchasePrice?: number;
      purchaseDate?: string;
      notes?: string;
      favorite?: boolean;
    }) =>
      request<CollectionItem>("/collection", {
        method: "POST",
        body: JSON.stringify({ quantity: 1, tags: [], favorite: false, showcase: false, ...payload })
      }, options),
    addToWatchlist: (payload: {
      cardId?: string;
      category?: string;
      targetPrice?: number;
      grade?: string;
    }) =>
      request<unknown>("/watchlist", {
        method: "POST",
        body: JSON.stringify(payload)
      }, options),
    createScan: (payload: { categoryHint?: string; uploadId?: string }) =>
      request<ScanCreateResult>("/cards/scan", {
        method: "POST",
        body: JSON.stringify(payload)
      }, options),
    /**
     * Upload card images via multipart/form-data and simultaneously create a scan job.
     * Use this when the user has selected card images — it handles storage, job creation,
     * and returns the jobId in one call.
     */
    uploadCardScan: (formData: FormData) =>
      uploadMultipart<ScanCreateResult>("/uploads/card-scan", formData, options),
    getScanJob: (jobId: string) =>
      request<ScanJobResult>(`/cards/scan/${jobId}`, undefined, options),
    searchCards: (query: string, category?: string, limit = 20) =>
      request<CardSearchResult[]>(
        `/cards/search?query=${encodeURIComponent(query)}${category ? `&category=${category}` : ""}&limit=${limit}`,
        undefined,
        options
      ),
    getCard: (id: string) =>
      request<CardDetail>(`/cards/${id}`, undefined, options),
    getComps: (cardId: string) =>
      request<CompsResult>(`/comps/${cardId}`, undefined, options),
    getCategories: () =>
      request<Category[]>("/categories", undefined, options),
    health: () => request<{ status: string }>("/health", undefined, options),
    getFeaturedCards: () => request<CardIdentity[]>("/market/trending", undefined, options),
    getMarketHome: () => request<MarketPulse>("/market/home", undefined, options)
  };
}
