import { collectionItemSchema, patchCollectionItemSchema, watchlistAlertSchema } from "@vaultlore/shared";
import { and, eq } from "drizzle-orm";
import type { FastifyPluginAsync } from "fastify";

import { db } from "../db/client";
import { userCards, watchlists, wishlists } from "../db/schema";
import { toNumber } from "../lib/format";
import { requireAuthUser } from "../lib/auth";

export const vaultRoutes: FastifyPluginAsync = async (app) => {
  app.get("/collection", async (request, reply) => {
    const auth = await requireAuthUser(request, reply);
    if (!auth) {
      return;
    }

    const rows = await db.select().from(userCards).where(eq(userCards.userId, auth.userId));
    const totalValue = rows.reduce((accumulator, row) => {
      const price = toNumber(row.purchasePrice) ?? 0;
      return accumulator + price * row.quantity;
    }, 0);

    return {
      items: rows,
      totalValue,
      gainLossEstimate: "0.0%",
      showcaseCount: rows.filter((entry) => entry.showcase).length
    };
  });

  app.post("/collection", async (request, reply) => {
    const auth = await requireAuthUser(request, reply);
    if (!auth) {
      return;
    }

    const parsed = collectionItemSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }

    const inserted = await db
      .insert(userCards)
      .values({
        userId: auth.userId,
        cardId: parsed.data.cardId,
        quantity: parsed.data.quantity,
        condition: parsed.data.condition,
        gradeCompany: parsed.data.gradeCompany,
        gradeValue: parsed.data.gradeValue ? String(parsed.data.gradeValue) : null,
        purchasePrice: parsed.data.purchasePrice ? String(parsed.data.purchasePrice) : null,
        purchaseDate: parsed.data.purchaseDate ? new Date(parsed.data.purchaseDate) : null,
        folder: parsed.data.folder,
        notes: parsed.data.notes,
        tags: parsed.data.tags,
        favorite: parsed.data.favorite,
        showcase: parsed.data.showcase
      })
      .returning();

    return reply.code(201).send(inserted[0]);
  });

  app.get("/collection/:id", async (request, reply) => {
    const auth = await requireAuthUser(request, reply);
    if (!auth) {
      return;
    }

    const params = request.params as { id: string };
    const item = await db
      .select()
      .from(userCards)
      .where(and(eq(userCards.id, params.id), eq(userCards.userId, auth.userId)))
      .limit(1);
    if (item.length === 0) {
      return reply.code(404).send({ error: "Collection item not found" });
    }

    return item[0];
  });

  app.patch("/collection/:id", async (request, reply) => {
    const auth = await requireAuthUser(request, reply);
    if (!auth) return;

    const params = request.params as { id: string };

    const existing = await db
      .select({ id: userCards.id })
      .from(userCards)
      .where(and(eq(userCards.id, params.id), eq(userCards.userId, auth.userId)))
      .limit(1);

    if (existing.length === 0) {
      return reply.code(404).send({ error: "Collection item not found" });
    }

    const parsed = patchCollectionItemSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }

    const data = parsed.data;
    const updates: Record<string, unknown> = {};
    if (data.quantity !== undefined) updates.quantity = data.quantity;
    if (data.condition !== undefined) updates.condition = data.condition;
    if (data.gradeCompany !== undefined) updates.gradeCompany = data.gradeCompany;
    if (data.gradeValue !== undefined) updates.gradeValue = String(data.gradeValue);
    if (data.purchasePrice !== undefined) updates.purchasePrice = String(data.purchasePrice);
    if (data.purchaseDate !== undefined) updates.purchaseDate = new Date(data.purchaseDate);
    if (data.notes !== undefined) updates.notes = data.notes;
    if (data.tags !== undefined) updates.tags = data.tags;
    if (data.folder !== undefined) updates.folder = data.folder;
    if (data.favorite !== undefined) updates.favorite = data.favorite;
    if (data.showcase !== undefined) updates.showcase = data.showcase;

    if (Object.keys(updates).length === 0) {
      return reply.code(400).send({ error: "No valid fields provided" });
    }

    const updated = await db
      .update(userCards)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(userCards.id, params.id), eq(userCards.userId, auth.userId)))
      .returning();

    return updated[0];
  });

  app.delete("/collection/:id", async (request, reply) => {
    const auth = await requireAuthUser(request, reply);
    if (!auth) return;

    const params = request.params as { id: string };

    const existing = await db
      .select({ id: userCards.id })
      .from(userCards)
      .where(and(eq(userCards.id, params.id), eq(userCards.userId, auth.userId)))
      .limit(1);

    if (existing.length === 0) {
      return reply.code(404).send({ error: "Collection item not found" });
    }

    await db
      .delete(userCards)
      .where(and(eq(userCards.id, params.id), eq(userCards.userId, auth.userId)));

    return reply.code(200).send({ success: true, deletedId: params.id });
  });

  app.get("/watchlist", async (request, reply) => {
    const auth = await requireAuthUser(request, reply);
    if (!auth) {
      return;
    }

    return db.select().from(watchlists).where(eq(watchlists.userId, auth.userId));
  });

  app.post("/watchlist", async (request, reply) => {
    const auth = await requireAuthUser(request, reply);
    if (!auth) {
      return;
    }

    const parsed = watchlistAlertSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }

    const inserted = await db
      .insert(watchlists)
      .values({
        userId: auth.userId,
        cardId: parsed.data.cardId,
        subjectProfileId: parsed.data.subjectId,
        categorySlug: parsed.data.category,
        targetPrice: parsed.data.targetPrice ? String(parsed.data.targetPrice) : null,
        targetGrade: parsed.data.grade
      })
      .returning();

    return reply.code(201).send(inserted[0]);
  });

  app.get("/watchlist/:id", async (request, reply) => {
    const auth = await requireAuthUser(request, reply);
    if (!auth) {
      return;
    }

    const params = request.params as { id: string };
    const item = await db
      .select()
      .from(watchlists)
      .where(and(eq(watchlists.id, params.id), eq(watchlists.userId, auth.userId)))
      .limit(1);

    if (item.length === 0) {
      return reply.code(404).send({ error: "Watchlist item not found" });
    }

    return item[0];
  });

  app.get("/wishlist", async (request, reply) => {
    const auth = await requireAuthUser(request, reply);
    if (!auth) {
      return;
    }

    return db.select().from(wishlists).where(eq(wishlists.userId, auth.userId));
  });

  app.post("/wishlist", async (request, reply) => {
    const auth = await requireAuthUser(request, reply);
    if (!auth) {
      return;
    }

    const payload = request.body as {
      cardId?: string;
      subjectId?: string;
      notes?: string;
      priority?: number;
    };

    const inserted = await db
      .insert(wishlists)
      .values({
        userId: auth.userId,
        cardId: payload.cardId ?? null,
        subjectProfileId: payload.subjectId ?? null,
        notes: payload.notes,
        priority: payload.priority ?? 1
      })
      .returning();

    return reply.code(201).send(inserted[0]);
  });

  app.get("/wishlist/:id", async (request, reply) => {
    const auth = await requireAuthUser(request, reply);
    if (!auth) {
      return;
    }

    const params = request.params as { id: string };
    const item = await db
      .select()
      .from(wishlists)
      .where(and(eq(wishlists.id, params.id), eq(wishlists.userId, auth.userId)))
      .limit(1);

    if (item.length === 0) {
      return reply.code(404).send({ error: "Wishlist item not found" });
    }

    return item[0];
  });
};
