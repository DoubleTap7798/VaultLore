/**
 * Purchases service scaffold — architecture-ready for RevenueCat live integration.
 *
 * ACTIVATION STEPS (when native module is ready):
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. pnpm add react-native-purchases --filter @vaultlore/mobile
 * 2. npx expo install react-native-purchases
 * 3. Set REVENUECAT_API_KEY in your .env / Expo secret store
 * 4. Call `initPurchases(REVENUECAT_API_KEY)` in your root _layout.tsx
 *    (after auth hydration, before any premium screens render)
 * 5. Replace the stub bodies below with the real SDK calls marked ## LIVE ##
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The interface of this module is intentionally stable. The premium screen
 * calls purchasePlan() and restorePurchases() — those signatures will NOT
 * change when the native SDK is wired in.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PlanTier = "free" | "vault-pro" | "legendary";

export type PurchaseOffering = {
  id: string;
  label: string;
  price: string;
  period: string;
  features: string[];
  tier: PlanTier;
  isPopular?: boolean;
};

export type PurchaseResult =
  | { success: true; tier: PlanTier }
  | { success: false; cancelled: boolean; error?: string };

export type RestoreResult =
  | { success: true; tier: PlanTier }
  | { success: false; error?: string };

// ---------------------------------------------------------------------------
// Offerings catalog (source of truth for UI)
// ---------------------------------------------------------------------------

export const OFFERINGS: PurchaseOffering[] = [
  {
    id: "vault_pro_monthly",
    label: "Vault Pro",
    price: "$6.99",
    period: "/ month",
    tier: "vault-pro",
    isPopular: true,
    features: [
      "Unlimited card scans",
      "Full comp history (90-day)",
      "Grade-aware watchlist alerts",
      "Priority collection analytics",
      "Advanced market pulse"
    ]
  },
  {
    id: "legendary_annual",
    label: "Legendary",
    price: "$59.99",
    period: "/ year",
    tier: "legendary",
    features: [
      "Everything in Vault Pro",
      "AI grading assistant (unlimited)",
      "Multi-collection portfolios",
      "Exclusive lore content",
      "Early access to new categories",
      "Dedicated collector support"
    ]
  }
];

// ---------------------------------------------------------------------------
// Initialisation
// ---------------------------------------------------------------------------

/**
 * Call once at app startup (in _layout.tsx) once the user is identified.
 * Uses dynamic import so the module is only loaded in dev-client / production builds
 * (not Expo Go, which lacks the native module).
 */
export function initPurchases(apiKey: string, userId?: string): void {
  if (!apiKey) return;
  import("react-native-purchases")
    .then(({ default: Purchases }) => {
      Purchases.configure({ apiKey });
      if (userId) void Purchases.logIn(userId);
    })
    .catch(() => {
      // Native module not available (Expo Go) — silently skip
    });
}

/**
 * Update the RevenueCat user ID when auth changes (login / logout).
 */
export async function identifyPurchasesUser(_userId: string | null): Promise<void> {
  try {
    const { default: Purchases } = await import("react-native-purchases");
    if (_userId) {
      await Purchases.logIn(_userId);
    } else {
      await Purchases.logOut();
    }
  } catch {
    // Native module not available — silently skip
  }
}

// ---------------------------------------------------------------------------
// Purchase flow
// ---------------------------------------------------------------------------

/**
 * Attempt to purchase a plan.
 */
export async function purchasePlan(offeringId: string): Promise<PurchaseResult> {
  try {
    const { default: Purchases } = await import("react-native-purchases");
    const offerings = await Purchases.getOfferings();
    const pkg = offerings.current?.availablePackages.find(
      (p: { identifier: string }) => p.identifier === offeringId
    );
    if (!pkg) {
      return { success: false, cancelled: false, error: "Package not found" };
    }
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const entitlement = Object.values(customerInfo.entitlements.active)[0] as
      | { productIdentifier?: string }
      | undefined;
    const tier = (entitlement?.productIdentifier as PlanTier | undefined) ?? "vault-pro";
    return { success: true, tier };
  } catch (err: unknown) {
    const e = err as { userCancelled?: boolean; message?: string };
    if (e?.userCancelled) {
      return { success: false, cancelled: true };
    }
    return { success: false, cancelled: false, error: e?.message ?? "Purchase failed" };
  }
}

// ---------------------------------------------------------------------------
// Restore purchases
// ---------------------------------------------------------------------------

/**
 * Restore prior purchases for the current device / Apple / Google account.
 */
export async function restorePurchases(): Promise<RestoreResult> {
  try {
    const { default: Purchases } = await import("react-native-purchases");
    const customerInfo = await Purchases.restorePurchases();
    const active = Object.values(customerInfo.entitlements.active) as Array<{
      productIdentifier?: string;
    }>;
    if (active.length > 0) {
      const tier = (active[0]?.productIdentifier as PlanTier | undefined) ?? "vault-pro";
      return { success: true, tier };
    }
    return { success: false, error: "No active subscriptions found." };
  } catch {
    return {
      success: false,
      error: "RevenueCat SDK not available. Install native module to enable restore."
    };
  }
}
