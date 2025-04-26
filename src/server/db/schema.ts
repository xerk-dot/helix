import { relations, sql } from "drizzle-orm";
import {
  index,
  pgTableCreator,
  text,
  timestamp,
  varchar,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM.
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `frontend_react_new_${name}`);

// Enums
export const userRoleEnum = pgEnum("user_role", [
  "recruiter",
  "hiring_manager",
  "admin",
]);

export const workflowStatusEnum = pgEnum("workflow_status", [
  "draft",
  "active",
  "completed",
]);

export const stepStatusEnum = pgEnum("step_status", [
  "not_started",
  "in_progress",
  "done",
]);

// Tables
export const users = createTable("user", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  role: userRoleEnum("role").notNull().default("recruiter"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const workflows = createTable("workflow", {
  id: varchar("id", { length: 255 }).primaryKey(),
  owner_user_id: varchar("owner_user_id", { length: 255 })
    .notNull()
    .references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  status: workflowStatusEnum("status").notNull().default("draft"),
});

export const workflowSteps = createTable("workflow_step", {
  id: varchar("id", { length: 255 }).primaryKey(),
  workflow_id: varchar("workflow_id", { length: 255 })
    .notNull()
    .references(() => workflows.id),
  type: varchar("type", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  assigned_to: varchar("assigned_to", { length: 255 }).notNull(),
  due_date: timestamp("due_date").notNull(),
  status: stepStatusEnum("status").notNull().default("not_started"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const chatMessages = createTable("chat_message", {
  id: varchar("id", { length: 255 }).primaryKey(),
  user_id: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id),
  workflow_id: varchar("workflow_id", { length: 255 })
    .notNull()
    .references(() => workflows.id),
  message: text("message").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  parsed: boolean("parsed").notNull().default(false),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  workflows: many(workflows),
  chatMessages: many(chatMessages),
}));

export const workflowsRelations = relations(workflows, ({ one, many }) => ({
  owner: one(users, {
    fields: [workflows.owner_user_id],
    references: [users.id],
  }),
  steps: many(workflowSteps),
  chatMessages: many(chatMessages),
}));

export const workflowStepsRelations = relations(workflowSteps, ({ one }) => ({
  workflow: one(workflows, {
    fields: [workflowSteps.workflow_id],
    references: [workflows.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  user: one(users, {
    fields: [chatMessages.user_id],
    references: [users.id],
  }),
  workflow: one(workflows, {
    fields: [chatMessages.workflow_id],
    references: [workflows.id],
  }),
})); 