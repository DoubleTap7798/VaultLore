import {
  cardSearchSchema,
  featuredCards,
  gradingEstimateSchema,
  scanRequestSchema
} from "@vaultlore/shared";
import { and, eq, ilike, or } from "drizzle-orm";
import type { FastifyPluginAsync } from "fastify";

import { db } from "../db/client";
import { cards, jobsLog } from "../db/schema";
import { requireAuthUser } from "../lib/auth";
import { queues } from "../lib/queues";

export const cardRoutes: FastifyPluginAsync = async (app) => {
  app.post("/cards/scan", async (request, reply) => {
    const auth = await requireAuthUser(request, reply);
    if (!auth) {
      return;
    }

    const parsed = scanRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }

    const job = await queues.cardScan.add("scan-card", {
      userId: auth.userId,
      frontImageUrl: parsed.data.frontImageUrl ?? null,
      backImageUrl: parsed.data.backImageUrl ?? null,
      uploadId: parsed.data.uploadId ?? null,
      categoryHint: parsed.data.categoryHint ?? null,
      requestedAt: new Date().toISOString()
    });

    await db.insert(jobsLog).values({
      externalJobId: String(job.id),
      queueName: "card-scan",
      jobType: "scan-card",
      status: "queued",
      payload: {
        userId: auth.userId,
        categoryHint: parsed.data.categoryHint ?? null
      }
    });

    return reply.code(202).send({
      jobId: String(job.id),
      status: "queued",
      categoryHint: parsed.data.categoryHint ?? null
    });
  });

  app.get("/cards/scan/:jobId", async (request, reply) => {
    const auth = await requireAuthUser(request, reply);
    if (!auth) {
      return;
    }

    const params = request.params as { jobId: string };

    const job = await queues.cardScan.getJob(params.jobId);
    if (!job) {
      return reply.code(404).send({ error: "Scan job not found" });
    }

    const state = await job.getState();
    const result = state === "completed" ? await job.returnvalue : null;

    return {
      jobId: params.jobId,
      status: state,
      confidence: result?.confidence ?? null,
      matches: result?.matches ?? [],
      analyzedAt: result?.analyzedAt ?? null
    };
  });

  app.get("/cards/search", async (request, reply) => {
    const parsed = cardSearchSchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }

    const query = parsed.data.query.toLowerCase();
    const searchFilter = or(
      ilike(cards.title, `%${query}%`),
      ilike(cards.subjectName, `%${query}%`),
      ilike(cards.cardNumber, `%${query}%`)
    );

    const categoryFilter = parsed.data.category ? eq(cards.categorySlug, parsed.data.category) : undefined;
    const whereFilter = categoryFilter ? and(searchFilter, categoryFilter) : searchFilter;

    const rows = await db
      .select({
        id: cards.id,
        title: cards.title,
        category: cards.categorySlug,
        setName: cards.seriesName,
        year: cards.year,
        subjectName: cards.subjectName,
        cardNumber: cards.cardNumber,
        rarity: cards.rarity,
        collectorTier: cards.collectorTier,
        parallel: cards.parallel,
        variant: cards.variant,
        language: cards.language,
        franchise: cards.franchise,
        universe: cards.universe,
        team: cards.team,
        league: cards.league,
        imageUrl: cards.imageFrontUrl
      })
      .from(cards)
      .where(whereFilter)
      .limit(parsed.data.limit);

    if (rows.length === 0) {
      return featuredCards
        .filter((card) => card.title.toLowerCase().includes(query) || card.subjectName.toLowerCase().includes(query))
        .slice(0, parsed.data.limit);
    }

    return rows;
  });

  app.get("/cards/:id", async (request, reply) => {
    const params = request.params as { id: string };
    const found = await db
      .select({
        id: cards.id,
        title: cards.title,
        category: cards.categorySlug,
        setName: cards.seriesName,
        year: cards.year,
        subjectName: cards.subjectName,
        cardNumber: cards.cardNumber,
        rarity: cards.rarity,
        collectorTier: cards.collectorTier,
        parallel: cards.parallel,
        variant: cards.variant,
        language: cards.language,
        franchise: cards.franchise,
        universe: cards.universe,
        team: cards.team,
        league: cards.league,
        imageUrl: cards.imageFrontUrl
      })
      .from(cards)
      .where(eq(cards.id, params.id))
      .limit(1);

    const card = found[0] ?? featuredCards.find((entry) => entry.id === params.id);
    if (!card) {
      return reply.code(404).send({ error: "Card not found" });
    }

    return {
      ...card,
      rawEstimatedValue: 1850,
      gradedEstimatedValue: 6400,
      marketMovement: "+8.4% / 30d",
      gradingPotential: "Strong candidate if centering and surface hold under magnification.",
      notableFacts: [
        "Anchor card for serious collectors in its category.",
        "High-grade copies continue to command premium liquidity."
      ],
      moments: [
        "Card tied to a defining era of collector demand.",
        "Frequently used as a benchmark comp for adjacent grails."
      ],
      relatedCards: featuredCards.filter((entry) => entry.id !== card.id)
    };
  });

  app.get("/comps/:cardId", async (request) => {
    const params = request.params as { cardId: string };
    return {
      cardId: params.cardId,
      comps: [
        { saleDate: "2026-03-01", venue: "eBay", price: 1825, grade: "Raw" },
        { saleDate: "2026-02-21", venue: "Goldin", price: 6150, grade: "PSA 8" },
        { saleDate: "2026-02-05", venue: "PWCC", price: 6425, grade: "PSA 8" }
      ]
    };
  });

  app.post("/grading/estimate", async (request, reply) => {
    const parsed = gradingEstimateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }

    return {
      likelyGradeRange: "8-9",
      worthGradingScore: 82,
      roiEstimate: "+34%",
      centering: "Above average",
      corners: "Minor wear visible",
      edges: "Strong",
      surface: "Requires glare review",
      confidence: "moderate"
    };
  });
};
