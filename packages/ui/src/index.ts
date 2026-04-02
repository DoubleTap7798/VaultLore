export const vaultLoreTheme = {
  colors: {
    background: "#08090d",
    panel: "#12151d",
    panelElevated: "#171b25",
    border: "rgba(255, 255, 255, 0.08)",
    textPrimary: "#f4f0e8",
    textSecondary: "#a4adba",
    accentGold: "#d6aa52",
    accentPlatinum: "#d7dde8",
    accentCrimson: "#8f3042",
    accentEmerald: "#22a37a",
    glow: "rgba(214, 170, 82, 0.28)"
  },
  radii: {
    sm: 12,
    md: 18,
    lg: 28,
    pill: 999
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 20,
    xl: 28,
    xxl: 40
  },
  shadows: {
    glow: "0 0 32px rgba(214, 170, 82, 0.22)",
    panel: "0 24px 80px rgba(0, 0, 0, 0.32)"
  },
  gradients: {
    hero: "linear-gradient(135deg, #0d1018 0%, #161b28 54%, #2d1d14 100%)",
    spotlight: "linear-gradient(160deg, rgba(214, 170, 82, 0.18), rgba(255, 255, 255, 0.04))"
  }
} as const;

export type VaultLoreTheme = typeof vaultLoreTheme;