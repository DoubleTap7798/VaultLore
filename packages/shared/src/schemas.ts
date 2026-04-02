import { z } from "zod";

import { cardCategories, collectorSignificanceTiers } from "./domain";

export const cardCategorySchema = z.enum(cardCategories);
export const collectorTierSchema = z.enum(collectorSignificanceTiers);

export const authCredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const scanRequestSchema = z.object({
  frontImageUrl: z.string().url().optional(),
  backImageUrl: z.string().url().optional(),
  uploadId: z.string().uuid().optional(),
  categoryHint: cardCategorySchema.optional()
});

export const cardSearchSchema = z.object({
  query: z.string().min(1),
  category: cardCategorySchema.optional(),
  limit: z.coerce.number().min(1).max(50).default(20)
});

export const collectionItemSchema = z.object({
  cardId: z.string().uuid(),
  quantity: z.number().int().min(1).default(1),
  condition: z.enum(["raw", "graded"]),
  gradeCompany: z.string().optional(),
  gradeValue: z.number().optional(),
  purchasePrice: z.number().optional(),
  purchaseDate: z.string().optional(),
  notes: z.string().max(1000).optional(),
  tags: z.array(z.string()).default([]),
  folder: z.string().optional(),
  favorite: z.boolean().default(false),
  showcase: z.boolean().default(false)
});

export const gradingEstimateSchema = z.object({
  frontImageUrl: z.string().url(),
  backImageUrl: z.string().url().optional(),
  cardId: z.string().uuid().optional()
});

export const watchlistAlertSchema = z.object({
  cardId: z.string().uuid().optional(),
  subjectId: z.string().uuid().optional(),
  category: cardCategorySchema.optional(),
  targetPrice: z.number().positive().optional(),
  grade: z.string().optional()
});

export const notificationDeviceSchema = z.object({
  token: z.string().min(10),
  platform: z.enum(["ios", "android", "web"]),
  appVersion: z.string().optional()
});

// --- User profile patch ---

export const collectorGoalSchema = z.enum(["collect", "invest", "flip", "grade", "track"]);
export const experienceLevelSchema = z.enum(["beginner", "intermediate", "advanced"]);

export const patchUserSchema = z.object({
  displayName: z.string().max(120).optional(),
  favoriteCategories: z.array(cardCategorySchema).optional(),
  collectorLevel: experienceLevelSchema.optional(),
  collectorGoals: z.array(collectorGoalSchema).optional(),
  alertsEnabled: z.boolean().optional(),
  onboardingCompleted: z.boolean().optional()
});

// --- Collection item patch ---

export const patchCollectionItemSchema = z.object({
  quantity: z.number().int().min(1).optional(),
  condition: z.enum(["raw", "graded"]).optional(),
  gradeCompany: z.string().optional(),
  gradeValue: z.number().optional(),
  purchasePrice: z.number().optional(),
  purchaseDate: z.string().optional(),
  notes: z.string().max(1000).optional(),
  tags: z.array(z.string()).optional(),
  folder: z.string().optional(),
  favorite: z.boolean().optional(),
  showcase: z.boolean().optional()
});
