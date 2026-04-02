import "dotenv/config";

import { Worker } from "bullmq";
import IORedis from "ioredis";

import { processAlertNotification, processCardScan, processCompRefresh } from "./jobs/processors";
import { markJobStatus } from "./lib/job-status";
import { captureWorkerError, initWorkerMonitoring } from "./lib/monitoring";
import { queueNames } from "./lib/queues";

initWorkerMonitoring();

const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null
});

const workers = [
  new Worker(queueNames.cardScan, processCardScan, { connection }),
  new Worker(queueNames.compRefresh, processCompRefresh, { connection }),
  new Worker(queueNames.alertNotification, processAlertNotification, { connection })
];

for (const worker of workers) {
  worker.on("completed", (job) => {
    console.log(`[worker] ${worker.name} completed job ${job.id}`);
  });

  worker.on("failed", (job, error) => {
    captureWorkerError(error, {
      queue: worker.name,
      jobId: job?.id,
      jobName: job?.name
    });

    if (job?.id) {
      void markJobStatus({
        queueName: worker.name,
        externalJobId: String(job.id),
        status: "failed",
        errorMessage: error.message,
        payload: {
          stack: error.stack ?? null
        }
      });
    }

    console.error(`[worker] ${worker.name} failed job ${job?.id ?? "unknown"}:`, error);
  });
}

console.log("VaultLore worker online", Object.values(queueNames));