import { jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const notificationDevices = pgTable("notification_devices", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  platform: varchar("platform", { length: 32 }).notNull(),
  token: text("token").notNull()
});

export const jobsLog = pgTable("jobs_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  externalJobId: varchar("external_job_id", { length: 128 }),
  queueName: varchar("queue_name", { length: 64 }).notNull(),
  jobType: varchar("job_type", { length: 64 }).notNull(),
  status: varchar("status", { length: 32 }).notNull(),
  payload: jsonb("payload").default({}).notNull(),
  errorMessage: text("error_message"),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});
