export const cardCategories = [
  "baseball",
  "basketball",
  "football",
  "hockey",
  "soccer",
  "racing",
  "wrestling",
  "pokemon",
  "magic-the-gathering",
  "yu-gi-oh",
  "one-piece-card-game",
  "disney-lorcana",
  "marvel",
  "star-wars",
  "entertainment",
  "non-sports",
  "custom"
] as const;

export const collectorSignificanceTiers = [
  "iconic",
  "legendary",
  "super-rare",
  "rare",
  "uncommon",
  "common"
] as const;

export type CardCategory = (typeof cardCategories)[number];
export type CollectorSignificanceTier = (typeof collectorSignificanceTiers)[number];

export type CardIdentity = {
  id: string;
  title: string;
  category: CardCategory;
  setName: string;
  seriesName?: string | null;
  year?: number | null;
  subjectName: string;
  cardNumber?: string | null;
  rarity?: string | null;
  collectorTier?: CollectorSignificanceTier | null;
  parallel?: string | null;
  variant?: string | null;
  language?: string | null;
  franchise?: string | null;
  universe?: string | null;
  team?: string | null;
  league?: string | null;
  imageUrl?: string | null;
};

export const supportedDashboardModules = [
  "collection-summary",
  "top-movers",
  "recent-scans",
  "watchlist-alerts",
  "featured-grails",
  "market-pulse",
  "suggested-actions"
] as const;
