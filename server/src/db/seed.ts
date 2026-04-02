import "dotenv/config";

import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";

import { cardCategories, featuredCards } from "@vaultlore/shared";

import { db } from "./client";
import {
  cards,
  categories,
  users,
  userCards,
  watchlists,
  wishlists
} from "./schema";

async function seedCategories() {
  for (const slug of cardCategories) {
    await db
      .insert(categories)
      .values({
        slug,
        label: slug.replace(/-/g, " ").replace(/\b\w/g, (match) => match.toUpperCase()),
        description: `${slug} cards category`
      })
      .onConflictDoNothing({ target: categories.slug });
  }
}

async function seedCards() {
  for (const card of featuredCards) {
    await db
      .insert(cards)
      .values({
        id: card.id,
        categorySlug: card.category,
        normalizedKey: `${card.category}:${card.setName}:${card.cardNumber ?? card.title}`.toLowerCase(),
        title: card.title,
        subjectName: card.subjectName,
        franchise: card.franchise,
        seriesName: card.setName,
        year: card.year ?? null,
        cardNumber: card.cardNumber,
        rarity: card.rarity,
        collectorTier: card.collectorTier,
        parallel: card.parallel,
        variant: card.variant,
        language: card.language,
        universe: card.universe,
        team: card.team,
        league: card.league,
        imageFrontUrl: card.imageUrl
      })
      .onConflictDoNothing({ target: cards.normalizedKey });
  }
}

async function seedDemoUser() {
  const email = "collector@vaultlore.app";
  const passwordHash = await bcrypt.hash("Password123!", 12);

  await db
    .insert(users)
    .values({
      email,
      passwordHash,
      collectorLevel: "advanced",
      favoriteCategories: ["basketball", "pokemon", "marvel"]
    })
    .onConflictDoNothing({ target: users.email });

  const found = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return found[0]?.id ?? null;
}

async function seedCollection(userId: string) {
  const existing = await db
    .select({ id: userCards.id })
    .from(userCards)
    .where(and(eq(userCards.userId, userId), eq(userCards.cardId, featuredCards[0].id)))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(userCards).values([
      {
        userId,
        cardId: featuredCards[0].id,
        quantity: 1,
        condition: "graded",
        gradeCompany: "PSA",
        gradeValue: "8",
        purchasePrice: "4200",
        favorite: true,
        showcase: true,
        notes: "Anchor grail card"
      },
      {
        userId,
        cardId: featuredCards[1].id,
        quantity: 2,
        condition: "raw",
        purchasePrice: "780",
        favorite: true,
        showcase: false,
        notes: "Long-term hold"
      }
    ]);
  }

  const watchExisting = await db
    .select({ id: watchlists.id })
    .from(watchlists)
    .where(and(eq(watchlists.userId, userId), eq(watchlists.cardId, featuredCards[2].id)))
    .limit(1);
  if (watchExisting.length === 0) {
    await db.insert(watchlists).values({
      userId,
      cardId: featuredCards[2].id,
      targetPrice: "1750",
      targetGrade: "PSA 9"
    });
  }

  const wishExisting = await db
    .select({ id: wishlists.id })
    .from(wishlists)
    .where(and(eq(wishlists.userId, userId), eq(wishlists.cardId, featuredCards[1].id)))
    .limit(1);
  if (wishExisting.length === 0) {
    await db.insert(wishlists).values({
      userId,
      cardId: featuredCards[1].id,
      priority: 1,
      notes: "Centered unlimited copy"
    });
  }
}

async function main() {
  await seedCategories();
  await seedCards();

  const userId = await seedDemoUser();
  if (userId) {
    await seedCollection(userId);
  }

  console.log("VaultLore seed complete");
}

void main().catch((error) => {
  console.error("Seed failed", error);
  process.exit(1);
});
