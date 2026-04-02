import { and, eq } from "drizzle-orm";

import { db } from "./db";
import { jobsLog } from "./schema";

export async function markJobStatus(params: {
  queueName: string;
  externalJobId: string;
  status: string;
  payload?: unknown;
  errorMessage?: string;
}) {
  await db
    .update(jobsLog)
    .set({
      status: params.status,
      payload: params.payload ?? {},
      errorMessage: params.errorMessage ?? null,
      processedAt: params.status === "completed" || params.status === "failed" ? new Date() : null,
      updatedAt: new Date()
    })
    .where(
      and(
        eq(jobsLog.queueName, params.queueName),
        eq(jobsLog.externalJobId, params.externalJobId)
      )
    );
}
