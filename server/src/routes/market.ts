import { featuredCards } from "@vaultlore/shared";
import type { FastifyPluginAsync } from "fastify";

import { categories } from "../lib/demo-data";

export const marketRoutes: FastifyPluginAsync = async (app) => {
  app.get("/market/home", async () => ({
    topMovers: [
      { id: featuredCards[2].id, title: featuredCards[2].title, deltaPercent: 18.7, tier: "legendary" },
      { id: featuredCards[1].id, title: featuredCards[1].title, deltaPercent: 12.1, tier: "legendary" },
      { id: featuredCards[0].id, title: featuredCards[0].title, deltaPercent: 8.4, tier: "iconic" }
    ],
    categories: categories.map((category) => ({
      category: category.slug,
      trend: category.slug === "football" ? "flat" : "up",
      summary: category.pulse
    }))
  }));

  app.get("/market/trending", async () => featuredCards);
};
