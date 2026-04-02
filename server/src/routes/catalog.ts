import { categories, subjectProfiles } from "../lib/demo-data";
import type { FastifyPluginAsync } from "fastify";

export const catalogRoutes: FastifyPluginAsync = async (app) => {
  app.get("/categories", async () => categories);

  app.get("/categories/:slug", async (request, reply) => {
    const params = request.params as { slug: string };
    const category = categories.find((entry) => entry.slug === params.slug);
    if (!category) {
      return reply.code(404).send({ error: "Category not found" });
    }

    return {
      ...category,
      trendingCards: 3,
      featuredDiscoveries: 6,
      hotSets: ["Prizm", "Topps Chrome", "Base Set", "Fleer"]
    };
  });

  app.get("/subjects/search", async (request) => {
    const query = ((request.query as { query?: string }).query ?? "").toLowerCase();
    return subjectProfiles.filter((profile) => profile.subjectName.toLowerCase().includes(query));
  });

  app.get("/subjects/:id", async (request, reply) => {
    const params = request.params as { id: string };
    const subject = subjectProfiles.find((entry) => entry.id === params.id);
    if (!subject) {
      return reply.code(404).send({ error: "Subject not found" });
    }

    return {
      ...subject,
      notableCards: [
        "Primary rookie grail",
        "Most chased parallel",
        "Accessible entry card"
      ],
      marketPerformance: "+11.2% over 90 days"
    };
  });

  app.get("/subjects/:id/moments", async (request, reply) => {
    const params = request.params as { id: string };
    const subject = subjectProfiles.find((entry) => entry.id === params.id);
    if (!subject) {
      return reply.code(404).send({ error: "Subject not found" });
    }

    return {
      subjectId: params.id,
      moments: subject.lore.map((description, index) => ({
        id: `${params.id}-${index + 1}`,
        title: `Lore Moment ${index + 1}`,
        description
      }))
    };
  });
};
