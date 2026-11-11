import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { IssueAnalysisResult } from "../lib/issue-analysis-schema";

export const githubInstallations = pgTable("github_installations", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  accountLogin: text("account_login").notNull(),
  accountType: text("account_type").notNull(),
  repositorySelection: text("repository_selection").notNull(),
  permissions: jsonb("permissions").$type<Record<string, string>>().default({}).notNull(),
  suspendedAt: timestamp("suspended_at", { withTimezone: true }),
  installedAt: timestamp("installed_at", { withTimezone: true }).notNull(),
  githubUpdatedAt: timestamp("github_updated_at", { withTimezone: true }).notNull(),
  syncedAt: timestamp("synced_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const githubRepositories = pgTable(
  "github_repositories",
  {
    id: bigint("id", { mode: "number" }).primaryKey(),
    installationId: bigint("installation_id", { mode: "number" })
      .notNull()
      .references(() => githubInstallations.id, { onDelete: "cascade" }),
    owner: text("owner").notNull(),
    name: text("name").notNull(),
    fullName: text("full_name").notNull(),
    private: boolean("private").notNull(),
    defaultBranch: text("default_branch").notNull(),
    archived: boolean("archived").default(false).notNull(),
    githubUpdatedAt: timestamp("github_updated_at", { withTimezone: true }),
    syncedAt: timestamp("synced_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("github_repositories_installation_id_idx").on(table.installationId),
    uniqueIndex("github_repositories_owner_name_unique").on(table.owner, table.name),
  ],
);

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
  issueTitle: text("issue_title").notNull(),
  issueBody: text("issue_body"),
  issueUrl: text("issue_url").notNull(),
  issueState: text("issue_state").notNull(),
  issueAuthor: text("issue_author"),
  issueLabels: jsonb("issue_labels").$type<string[]>().default([]).notNull(),
  issueUpdatedAt: timestamp("issue_updated_at", { withTimezone: true }).notNull(),
  status: investigationStatus("status").default("queued").notNull(),
  result: jsonb("result").$type<IssueAnalysisResult>(),
  analysisModel: text("analysis_model"),
  openaiResponseId: text("openai_response_id"),
  failureReason: text("failure_reason"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
