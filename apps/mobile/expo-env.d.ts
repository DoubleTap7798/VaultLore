/// <reference types="expo/types" />
/// <reference types="react-native/types" />
/// <reference types="expo-router/types" />

declare module "react-native" {
  export * from "react-native/types";
}

declare module "expo-router" {
  import type { ComponentType } from "react";

  export const Link: ComponentType<any>;
  export const Stack: ComponentType<any> & { Screen?: ComponentType<any> };
  export function useRouter(): {
    push: (href: string) => void;
    replace: (href: string) => void;
    back: () => void;
  };
  export function useLocalSearchParams<
    T extends Record<string, string | string[] | undefined>
  >(): T;
}

declare module "expo-secure-store" {
  export function getItemAsync(key: string): Promise<string | null>;
  export function setItemAsync(key: string, value: string): Promise<void>;
  export function deleteItemAsync(key: string): Promise<void>;
}

declare module "react-native-purchases" {
  export type PurchasesPackage = { identifier: string };
  export type EntitlementInfo = { productIdentifier?: string };
  export type CustomerInfo = {
    entitlements: { active: Record<string, EntitlementInfo> };
  };
  export type Offerings = {
    current?: { availablePackages: PurchasesPackage[] };
  };

  const Purchases: {
    configure(config: { apiKey: string }): void;
    logIn(userId: string): Promise<unknown>;
    logOut(): Promise<void>;
    getOfferings(): Promise<Offerings>;
    purchasePackage(pkg: PurchasesPackage): Promise<{ customerInfo: CustomerInfo }>;
    restorePurchases(): Promise<CustomerInfo>;
  };

  export default Purchases;
}
