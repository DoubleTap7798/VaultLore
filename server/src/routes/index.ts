import type { FastifyPluginAsync } from "fastify";

import { authRoutes } from "./auth";
import { cardRoutes } from "./cards";
import { catalogRoutes } from "./catalog";
import { healthRoutes } from "./health";
import { marketRoutes } from "./market";
import { platformRoutes } from "./platform";
import { uploadRoutes } from "./uploads";
import { userRoutes } from "./users";
import { vaultRoutes } from "./vault";

export const apiRoutes: FastifyPluginAsync = async (app) => {
  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(userRoutes);
  await app.register(cardRoutes);
  await app.register(catalogRoutes);
  await app.register(vaultRoutes);
  await app.register(marketRoutes);
  await app.register(platformRoutes);
  await app.register(uploadRoutes);
};
