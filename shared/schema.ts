import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("member"), // sp, team_leader, member
  team: varchar("team"), // alpha, bravo, charlie
  designation: varchar("designation"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Teams table
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  code: varchar("code").unique().notNull(), // alpha, bravo, charlie
  description: text("description"),
  focusArea: varchar("focus_area").notNull(),
  leaderId: varchar("leader_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tasks table
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  description: text("description"),
  teamId: integer("team_id").references(() => teams.id),
  assignedTo: varchar("assigned_to").references(() => users.id),
  status: varchar("status").notNull().default("pending"), // pending, in_progress, completed, overdue
  priority: varchar("priority").notNull().default("medium"), // low, medium, high, critical
  startDate: date("start_date"),
  dueDate: date("due_date"),
  completedAt: timestamp("completed_at"),
  progress: integer("progress").default(0), // 0-100
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Daily Reports table
export const dailyReports = pgTable("daily_reports", {
  id: serial("id").primaryKey(),
  reportDate: date("report_date").notNull(),
  reportTime: varchar("report_time").notNull(), // 08:00, 14:00, 18:00, 22:00
  teamId: integer("team_id").references(() => teams.id),
  submittedBy: varchar("submitted_by").references(() => users.id),
  content: text("content").notNull(),
  achievements: text("achievements").array(),
  challenges: text("challenges").array(),
  nextDayPlans: text("next_day_plans").array(),
  status: varchar("status").default("draft"), // draft, submitted, reviewed
  createdAt: timestamp("created_at").defaultNow(),
});

// Budget table
export const budgetItems = pgTable("budget_items", {
  id: serial("id").primaryKey(),
  category: varchar("category").notNull(),
  description: text("description"),
  allocatedAmount: decimal("allocated_amount", { precision: 10, scale: 2 }),
  utilizedAmount: decimal("utilized_amount", { precision: 10, scale: 2 }).default("0"),
  teamId: integer("team_id").references(() => teams.id),
  startDate: date("start_date"),
  endDate: date("end_date"),
  status: varchar("status").default("active"), // active, completed, cancelled
  createdAt: timestamp("created_at").defaultNow(),
});

// Documents table
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  description: text("description"),
  fileName: varchar("file_name").notNull(),
  filePath: varchar("file_path").notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type"),
  category: varchar("category"), // report, assessment, plan, guideline
  teamId: integer("team_id").references(() => teams.id),
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  isPublic: boolean("is_public").default(false),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Feedback table
export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  type: varchar("type").notNull(), // suggestion, issue, improvement, praise
  subject: varchar("subject").notNull(),
  content: text("content").notNull(),
  category: varchar("category"), // process, technology, management, training
  submittedBy: varchar("submitted_by").references(() => users.id),
  assignedTo: varchar("assigned_to").references(() => users.id),
  status: varchar("status").default("open"), // open, in_review, resolved, closed
  priority: varchar("priority").default("medium"),
  response: text("response"),
  respondedBy: varchar("responded_by").references(() => users.id),
  respondedAt: timestamp("responded_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Activities/Audit Log table
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  action: varchar("action").notNull(),
  description: text("description"),
  entityType: varchar("entity_type"), // task, report, document, budget
  entityId: integer("entity_id"),
  userId: varchar("user_id").references(() => users.id),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  assignedTasks: many(tasks),
  dailyReports: many(dailyReports),
  uploadedDocuments: many(documents),
  submittedFeedback: many(feedback),
  activities: many(activities),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  leader: one(users, {
    fields: [teams.leaderId],
    references: [users.id],
  }),
  tasks: many(tasks),
  dailyReports: many(dailyReports),
  budgetItems: many(budgetItems),
  documents: many(documents),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  team: one(teams, {
    fields: [tasks.teamId],
    references: [teams.id],
  }),
  assignee: one(users, {
    fields: [tasks.assignedTo],
    references: [users.id],
  }),
}));

export const dailyReportsRelations = relations(dailyReports, ({ one }) => ({
  team: one(teams, {
    fields: [dailyReports.teamId],
    references: [teams.id],
  }),
  submitter: one(users, {
    fields: [dailyReports.submittedBy],
    references: [users.id],
  }),
}));

export const budgetItemsRelations = relations(budgetItems, ({ one }) => ({
  team: one(teams, {
    fields: [budgetItems.teamId],
    references: [teams.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  team: one(teams, {
    fields: [documents.teamId],
    references: [teams.id],
  }),
  uploader: one(users, {
    fields: [documents.uploadedBy],
    references: [users.id],
  }),
}));

export const feedbackRelations = relations(feedback, ({ one }) => ({
  submitter: one(users, {
    fields: [feedback.submittedBy],
    references: [users.id],
  }),
  assignee: one(users, {
    fields: [feedback.assignedTo],
    references: [users.id],
  }),
  responder: one(users, {
    fields: [feedback.respondedBy],
    references: [users.id],
  }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
  }),
}));

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertTeam = typeof teams.$inferInsert;
export type Team = typeof teams.$inferSelect;

export type InsertTask = typeof tasks.$inferInsert;
export type Task = typeof tasks.$inferSelect;

export type InsertDailyReport = typeof dailyReports.$inferInsert;
export type DailyReport = typeof dailyReports.$inferSelect;

export type InsertBudgetItem = typeof budgetItems.$inferInsert;
export type BudgetItem = typeof budgetItems.$inferSelect;

export type InsertDocument = typeof documents.$inferInsert;
export type Document = typeof documents.$inferSelect;

export type InsertFeedback = typeof feedback.$inferInsert;
export type Feedback = typeof feedback.$inferSelect;

export type InsertActivity = typeof activities.$inferInsert;
export type Activity = typeof activities.$inferSelect;

// Zod schemas
export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDailyReportSchema = createInsertSchema(dailyReports).omit({
  id: true,
  createdAt: true,
});

export const insertBudgetItemSchema = createInsertSchema(budgetItems).omit({
  id: true,
  createdAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
});

export const insertFeedbackSchema = createInsertSchema(feedback).omit({
  id: true,
  createdAt: true,
  respondedAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});
