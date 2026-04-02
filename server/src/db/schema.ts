import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
};

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: varchar("display_name", { length: 120 }),
  collectorLevel: varchar("collector_level", { length: 32 }),
  favoriteCategories: jsonb("favorite_categories").$type<string[]>().default([]).notNull(),
  collectorGoals: jsonb("collector_goals").$type<string[]>().default([]).notNull(),
  alertsEnabled: boolean("alerts_enabled").default(true).notNull(),
  onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
  ...timestamps
});

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  refreshTokenHash: text("refresh_token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ...timestamps
});

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  label: varchar("label", { length: 120 }).notNull(),
  description: text("description"),
  ...timestamps
});

export const brandsOrFranchises = pgTable("brands_or_franchises", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  categorySlug: varchar("category_slug", { length: 80 }),
  universe: varchar("universe", { length: 120 }),
  ...timestamps
});

export const cardSets = pgTable("card_sets", {
  id: uuid("id").defaultRandom().primaryKey(),
  categorySlug: varchar("category_slug", { length: 80 }).notNull(),
  brandId: uuid("brand_id"),
  setName: varchar("set_name", { length: 180 }).notNull(),
  seriesName: varchar("series_name", { length: 180 }),
  year: integer("year"),
  language: varchar("language", { length: 32 }),
  metadata: jsonb("metadata").default({}).notNull(),
  ...timestamps
});

export const cards = pgTable("cards", {
  id: uuid("id").defaultRandom().primaryKey(),
  categorySlug: varchar("category_slug", { length: 80 }).notNull(),
  brandId: uuid("brand_id"),
  setId: uuid("set_id"),
  normalizedKey: varchar("normalized_key", { length: 255 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  subjectName: varchar("subject_name", { length: 255 }).notNull(),
  franchise: varchar("franchise", { length: 180 }),
  seriesName: varchar("series_name", { length: 180 }),
  year: integer("year"),
  cardNumber: varchar("card_number", { length: 64 }),
  rarity: varchar("rarity", { length: 80 }),
  collectorTier: varchar("collector_tier", { length: 32 }),
  parallel: varchar("parallel", { length: 120 }),
  variant: varchar("variant", { length: 120 }),
  language: varchar("language", { length: 32 }),
  universe: varchar("universe", { length: 120 }),
  team: varchar("team", { length: 120 }),
  league: varchar("league", { length: 120 }),
  character: varchar("character", { length: 160 }),
  imageFrontUrl: text("image_front_url"),
  imageBackUrl: text("image_back_url"),
  metadata: jsonb("metadata").default({}).notNull(),
  ...timestamps
});

export const cardVariants = pgTable("card_variants", {
  id: uuid("id").defaultRandom().primaryKey(),
  cardId: uuid("card_id").notNull(),
  label: varchar("label", { length: 180 }).notNull(),
  parallel: varchar("parallel", { length: 120 }),
  variant: varchar("variant", { length: 120 }),
  serialNumber: varchar("serial_number", { length: 64 }),
  printRun: integer("print_run"),
  notes: text("notes"),
  ...timestamps
});

export const subjectProfiles = pgTable("subject_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  categorySlug: varchar("category_slug", { length: 80 }).notNull(),
  subjectName: varchar("subject_name", { length: 255 }).notNull(),
  profileType: varchar("profile_type", { length: 80 }).notNull(),
  team: varchar("team", { length: 120 }),
  league: varchar("league", { length: 120 }),
  franchise: varchar("franchise", { length: 160 }),
  universe: varchar("universe", { length: 120 }),
  rookieYear: integer("rookie_year"),
  summary: text("summary"),
  metadata: jsonb("metadata").default({}).notNull(),
  ...timestamps
});

export const iconicMoments = pgTable("iconic_moments", {
  id: uuid("id").defaultRandom().primaryKey(),
  subjectProfileId: uuid("subject_profile_id").notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  description: text("description").notNull(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }),
  significance: varchar("significance", { length: 32 }),
  mediaUrl: text("media_url"),
  ...timestamps
});

export const userCards = pgTable("user_cards", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  cardId: uuid("card_id").notNull(),
  quantity: integer("quantity").default(1).notNull(),
  condition: varchar("condition", { length: 32 }).notNull(),
  gradeCompany: varchar("grade_company", { length: 32 }),
  gradeValue: numeric("grade_value", { precision: 4, scale: 1 }),
  purchasePrice: numeric("purchase_price", { precision: 12, scale: 2 }),
  purchaseDate: timestamp("purchase_date", { withTimezone: true }),
  folder: varchar("folder", { length: 120 }),
  notes: text("notes"),
  tags: jsonb("tags").$type<string[]>().default([]).notNull(),
  favorite: boolean("favorite").default(false).notNull(),
  showcase: boolean("showcase").default(false).notNull(),
  ...timestamps
});

export const watchlists = pgTable("watchlists", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  cardId: uuid("card_id"),
  subjectProfileId: uuid("subject_profile_id"),
  categorySlug: varchar("category_slug", { length: 80 }),
  targetPrice: numeric("target_price", { precision: 12, scale: 2 }),
  targetGrade: varchar("target_grade", { length: 24 }),
  ...timestamps
});

export const wishlists = pgTable("wishlists", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  cardId: uuid("card_id"),
  subjectProfileId: uuid("subject_profile_id"),
  priority: integer("priority").default(1).notNull(),
  notes: text("notes"),
  ...timestamps
});

export const alerts = pgTable("alerts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  alertType: varchar("alert_type", { length: 64 }).notNull(),
  criteria: jsonb("criteria").default({}).notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  lastTriggeredAt: timestamp("last_triggered_at", { withTimezone: true }),
  ...timestamps
});

export const comps = pgTable("comps", {
  id: uuid("id").defaultRandom().primaryKey(),
  cardId: uuid("card_id").notNull(),
  source: varchar("source", { length: 80 }).notNull(),
  salePrice: numeric("sale_price", { precision: 12, scale: 2 }).notNull(),
  saleDate: timestamp("sale_date", { withTimezone: true }).notNull(),
  grade: varchar("grade", { length: 32 }),
  metadata: jsonb("metadata").default({}).notNull(),
  ...timestamps
});

export const gradingEstimates = pgTable("grading_estimates", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id"),
  cardId: uuid("card_id"),
  likelyGradeRange: varchar("likely_grade_range", { length: 32 }),
  worthGradingScore: integer("worth_grading_score"),
  roiEstimate: numeric("roi_estimate", { precision: 8, scale: 2 }),
  assessment: jsonb("assessment").default({}).notNull(),
  ...timestamps
});

export const uploads = pgTable("uploads", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id"),
  purpose: varchar("purpose", { length: 80 }).notNull(),
  storageKey: text("storage_key").notNull(),
  mimeType: varchar("mime_type", { length: 120 }).notNull(),
  ...timestamps
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  provider: varchar("provider", { length: 64 }).notNull(),
  externalId: varchar("external_id", { length: 160 }).notNull(),
  status: varchar("status", { length: 64 }).notNull(),
  planCode: varchar("plan_code", { length: 64 }).notNull(),
  renewsAt: timestamp("renews_at", { withTimezone: true }),
  ...timestamps
});

export const notificationDevices = pgTable("notification_devices", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  platform: varchar("platform", { length: 32 }).notNull(),
  token: text("token").notNull(),
  appVersion: varchar("app_version", { length: 32 }),
  ...timestamps
});

export const jobsLog = pgTable("jobs_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  externalJobId: varchar("external_job_id", { length: 128 }),
  queueName: varchar("queue_name", { length: 64 }).notNull(),
  jobType: varchar("job_type", { length: 64 }).notNull(),
  status: varchar("status", { length: 32 }).notNull(),
  payload: jsonb("payload").default({}).notNull(),
  errorMessage: text("error_message"),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  ...timestamps
});

export const auditEvents = pgTable("audit_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id"),
  eventType: varchar("event_type", { length: 80 }).notNull(),
  entityType: varchar("entity_type", { length: 80 }).notNull(),
  entityId: uuid("entity_id"),
  metadata: jsonb("metadata").default({}).notNull(),
  ...timestamps
});

export const passwordResets = pgTable("password_resets", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  ...timestamps
});
