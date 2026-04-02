import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

export type CollectorCategory =
  | "baseball"
  | "basketball"
  | "football"
  | "pokemon"
  | "marvel"
  | "tcg"
  | "entertainment"
  | "all-cards";

export type CollectorGoal = "collect" | "invest" | "flip" | "grade" | "track";

export type ExperienceLevel = "beginner" | "intermediate" | "advanced";

type OnboardingState = {
  categories: CollectorCategory[];
  goals: CollectorGoal[];
  experienceLevel: ExperienceLevel;
  notificationsEnabled: boolean;
  completed: boolean;
  toggleCategory: (c: CollectorCategory) => void;
  toggleGoal: (g: CollectorGoal) => void;
  setExperienceLevel: (level: ExperienceLevel) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  complete: () => Promise<void>;
  hydrate: () => Promise<void>;
};

const PREFS_KEY = "vaultlore_collector_prefs_v1";

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  categories: [],
  goals: [],
  experienceLevel: "beginner",
  notificationsEnabled: true,
  completed: false,

  toggleCategory(c) {
    const current = get().categories;
    set({
      categories: current.includes(c) ? current.filter((x) => x !== c) : [...current, c]
    });
  },

  toggleGoal(g) {
    const current = get().goals;
    set({
      goals: current.includes(g) ? current.filter((x) => x !== g) : [...current, g]
    });
  },

  setExperienceLevel: (experienceLevel) => set({ experienceLevel }),
  setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),

  async complete() {
    const { categories, goals, experienceLevel, notificationsEnabled } = get();
    const prefs = { categories, goals, experienceLevel, notificationsEnabled, completed: true };
    await SecureStore.setItemAsync(PREFS_KEY, JSON.stringify(prefs));
    set({ completed: true });
  },

  async hydrate() {
    try {
      const raw = await SecureStore.getItemAsync(PREFS_KEY);
      if (raw) {
        const prefs = JSON.parse(raw) as Partial<OnboardingState>;
        set({
          categories: prefs.categories ?? [],
          goals: prefs.goals ?? [],
          experienceLevel: prefs.experienceLevel ?? "beginner",
          notificationsEnabled: prefs.notificationsEnabled ?? true,
          completed: prefs.completed ?? false
        });
      }
    } catch {
      // corrupt store — ignore and start fresh
    }
  }
}));
