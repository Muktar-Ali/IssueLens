import { integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const investigationStatus = pgEnum("investigation_status", [
  "queued",
  "running",
  "completed",
  "failed",
]);

export const investigations = pgTable("investigations", {
  id: uuid("id").defaultRandom().primaryKey(),
  repositoryOwner: text("repository_owner").notNull(),
  repositoryName: text("repository_name").notNull(),
  issueNumber: integer("issue_number").notNull(),
  status: investigationStatus("status").default("queued").notNull(),
  result: jsonb("result"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
