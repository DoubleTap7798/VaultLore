"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.patchCollectionItemSchema = exports.patchUserSchema = exports.experienceLevelSchema = exports.collectorGoalSchema = exports.notificationDeviceSchema = exports.watchlistAlertSchema = exports.gradingEstimateSchema = exports.collectionItemSchema = exports.cardSearchSchema = exports.scanRequestSchema = exports.authCredentialsSchema = exports.collectorTierSchema = exports.cardCategorySchema = void 0;
const zod_1 = require("zod");
const domain_1 = require("./domain");
exports.cardCategorySchema = zod_1.z.enum(domain_1.cardCategories);
exports.collectorTierSchema = zod_1.z.enum(domain_1.collectorSignificanceTiers);
exports.authCredentialsSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8)
});
exports.scanRequestSchema = zod_1.z.object({
    frontImageUrl: zod_1.z.string().url().optional(),
    backImageUrl: zod_1.z.string().url().optional(),
    uploadId: zod_1.z.string().uuid().optional(),
    categoryHint: exports.cardCategorySchema.optional()
});
exports.cardSearchSchema = zod_1.z.object({
    query: zod_1.z.string().min(1),
    category: exports.cardCategorySchema.optional(),
    limit: zod_1.z.coerce.number().min(1).max(50).default(20)
});
exports.collectionItemSchema = zod_1.z.object({
    cardId: zod_1.z.string().uuid(),
    quantity: zod_1.z.number().int().min(1).default(1),
    condition: zod_1.z.enum(["raw", "graded"]),
    gradeCompany: zod_1.z.string().optional(),
    gradeValue: zod_1.z.number().optional(),
    purchasePrice: zod_1.z.number().optional(),
    purchaseDate: zod_1.z.string().optional(),
    notes: zod_1.z.string().max(1000).optional(),
    tags: zod_1.z.array(zod_1.z.string()).default([]),
    folder: zod_1.z.string().optional(),
    favorite: zod_1.z.boolean().default(false),
    showcase: zod_1.z.boolean().default(false)
});
exports.gradingEstimateSchema = zod_1.z.object({
    frontImageUrl: zod_1.z.string().url(),
    backImageUrl: zod_1.z.string().url().optional(),
    cardId: zod_1.z.string().uuid().optional()
});
exports.watchlistAlertSchema = zod_1.z.object({
    cardId: zod_1.z.string().uuid().optional(),
    subjectId: zod_1.z.string().uuid().optional(),
    category: exports.cardCategorySchema.optional(),
    targetPrice: zod_1.z.number().positive().optional(),
    grade: zod_1.z.string().optional()
});
exports.notificationDeviceSchema = zod_1.z.object({
    token: zod_1.z.string().min(10),
    platform: zod_1.z.enum(["ios", "android", "web"]),
    appVersion: zod_1.z.string().optional()
});
// --- User profile patch ---
exports.collectorGoalSchema = zod_1.z.enum(["collect", "invest", "flip", "grade", "track"]);
exports.experienceLevelSchema = zod_1.z.enum(["beginner", "intermediate", "advanced"]);
exports.patchUserSchema = zod_1.z.object({
    displayName: zod_1.z.string().max(120).optional(),
    favoriteCategories: zod_1.z.array(exports.cardCategorySchema).optional(),
    collectorLevel: exports.experienceLevelSchema.optional(),
    collectorGoals: zod_1.z.array(exports.collectorGoalSchema).optional(),
    alertsEnabled: zod_1.z.boolean().optional(),
    onboardingCompleted: zod_1.z.boolean().optional()
});
// --- Collection item patch ---
exports.patchCollectionItemSchema = zod_1.z.object({
    quantity: zod_1.z.number().int().min(1).optional(),
    condition: zod_1.z.enum(["raw", "graded"]).optional(),
    gradeCompany: zod_1.z.string().optional(),
    gradeValue: zod_1.z.number().optional(),
    purchasePrice: zod_1.z.number().optional(),
    purchaseDate: zod_1.z.string().optional(),
    notes: zod_1.z.string().max(1000).optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    folder: zod_1.z.string().optional(),
    favorite: zod_1.z.boolean().optional(),
    showcase: zod_1.z.boolean().optional()
});
