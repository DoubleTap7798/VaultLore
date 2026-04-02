import { queueNames } from "@vaultlore/shared";
import { Queue } from "bullmq";
import IORedis from "ioredis";

import { env } from "../config/env";

const connection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null
});

export const queues = {
  cardScan: new Queue(queueNames.cardScan, { connection })
};

export { connection as redisConnection };
