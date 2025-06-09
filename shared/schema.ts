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
  username: varchar("username").unique(),
  password: varchar("password"),
  phone: varchar("phone"),
  googleId: varchar("google_id"),
  role: varchar("role").notNull().default("member"), // sp, team_leader, member, viewer
  team: varchar("team"), // alpha, bravo, charlie
  designation: varchar("designation"),
  permissions: jsonb("permissions").default('{}'), // custom permissions object
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  securityLevel: varchar("security_level").default("standard"), // high, standard, limited
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Roles and permissions table
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: varchar("name").unique().notNull(),
  description: text("description"),
  permissions: jsonb("permissions").notNull().default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
});

// User sessions for security tracking
export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  sessionId: varchar("session_id").notNull(),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  loginAt: timestamp("login_at").defaultNow(),
  logoutAt: timestamp("logout_at"),
  isActive: boolean("is_active").default(true),
});

// Security audit logs
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  action: varchar("action").notNull(),
  resource: varchar("resource").notNull(),
  resourceId: varchar("resource_id"),
  details: jsonb("details"),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow(),
  severity: varchar("severity").default("info"), // critical, high, medium, low, info
});

// System settings
export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key").unique().notNull(),
  value: jsonb("value").notNull(),
  description: text("description"),
  category: varchar("category").default("general"),
  updatedBy: varchar("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat conversations with LLM
export const chatConversations = pgTable("chat_conversations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: varchar("title"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat messages
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => chatConversations.id).notNull(),
  role: varchar("role").notNull(), // user, assistant, system
  content: text("content").notNull(),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
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

// Custom Field Definitions table
export const customFieldDefinitions = pgTable("custom_field_definitions", {
  id: serial("id").primaryKey(),
  fieldName: varchar("field_name").notNull(),
  fieldLabel: varchar("field_label").notNull(),
  fieldType: varchar("field_type").notNull(), // text, number, date, select, checkbox, textarea, file, email, phone
  section: varchar("section").notNull(), // administrative, e-governance, gad-reform, tasks, teams, documents, budget, reports
  isRequired: boolean("is_required").default(false),
  defaultValue: text("default_value"),
  validationRules: jsonb("validation_rules").default('{}'), // min, max, pattern, options for select
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),
  helpText: text("help_text"),
  placeholder: varchar("placeholder"),
  groupName: varchar("group_name"), // to group related fields
  conditionalLogic: jsonb("conditional_logic"), // show/hide based on other fields
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Custom Field Values table (stores actual values)
export const customFieldValues = pgTable("custom_field_values", {
  id: serial("id").primaryKey(),
  fieldDefinitionId: integer("field_definition_id").references(() => customFieldDefinitions.id),
  entityType: varchar("entity_type").notNull(), // form, task, team, document, budget, report
  entityId: integer("entity_id").notNull(), // ID of the related entity
  value: text("value"), // stores the actual field value as text
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Administrative Forms table for Section A forms management
export const administrativeForms = pgTable("administrative_forms", {
  id: serial("id").primaryKey(),
  formType: varchar("form_type").notNull(), // team-formation, progress-report, meeting-minutes, task-assignment, risk-assessment
  title: varchar("title").notNull(),
  formData: jsonb("form_data").notNull(), // JSON structure containing all form fields
  customFieldData: jsonb("custom_field_data").default('{}'), // stores custom field values
  status: varchar("status").default("draft"), // draft, submitted, approved, rejected
  submittedBy: varchar("submitted_by").notNull().references(() => users.id),
  submittedAt: timestamp("submitted_at"),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  teamId: integer("team_id").references(() => teams.id),
  sopReference: varchar("sop_reference"), // SOP-A1, SOP-A2, etc.
  priority: varchar("priority").default("medium"), // low, medium, high, critical
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  rejectionReason: text("rejection_reason"),
  version: integer("version").default(1),
  parentFormId: integer("parent_form_id"),
  attachments: jsonb("attachments"), // array of file references
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  assignedTasks: many(tasks),
  dailyReports: many(dailyReports),
  uploadedDocuments: many(documents),
  submittedFeedback: many(feedback),
  activities: many(activities),
  sessions: many(userSessions),
  conversations: many(chatConversations),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  // Additional relations can be added here
}));

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export const systemSettingsRelations = relations(systemSettings, ({ one }) => ({
  updatedByUser: one(users, {
    fields: [systemSettings.updatedBy],
    references: [users.id],
  }),
}));

export const chatConversationsRelations = relations(chatConversations, ({ one, many }) => ({
  user: one(users, {
    fields: [chatConversations.userId],
    references: [users.id],
  }),
  messages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  conversation: one(chatConversations, {
    fields: [chatMessages.conversationId],
    references: [chatConversations.id],
  }),
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

export const customFieldDefinitionsRelations = relations(customFieldDefinitions, ({ one, many }) => ({
  creator: one(users, {
    fields: [customFieldDefinitions.createdBy],
    references: [users.id],
  }),
  values: many(customFieldValues),
}));

export const customFieldValuesRelations = relations(customFieldValues, ({ one }) => ({
  fieldDefinition: one(customFieldDefinitions, {
    fields: [customFieldValues.fieldDefinitionId],
    references: [customFieldDefinitions.id],
  }),
}));

export const administrativeFormsRelations = relations(administrativeForms, ({ one }) => ({
  submitter: one(users, {
    fields: [administrativeForms.submittedBy],
    references: [users.id],
  }),
  approver: one(users, {
    fields: [administrativeForms.approvedBy],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [administrativeForms.teamId],
    references: [teams.id],
  }),
  parentForm: one(administrativeForms, {
    fields: [administrativeForms.parentFormId],
    references: [administrativeForms.id],
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

export type InsertCustomFieldDefinition = typeof customFieldDefinitions.$inferInsert;
export type CustomFieldDefinition = typeof customFieldDefinitions.$inferSelect;

export type InsertCustomFieldValue = typeof customFieldValues.$inferInsert;
export type CustomFieldValue = typeof customFieldValues.$inferSelect;

export type InsertAdministrativeForm = typeof administrativeForms.$inferInsert;
export type AdministrativeForm = typeof administrativeForms.$inferSelect;

export type InsertRole = typeof roles.$inferInsert;
export type Role = typeof roles.$inferSelect;

export type InsertUserSession = typeof userSessions.$inferInsert;
export type UserSession = typeof userSessions.$inferSelect;

export type InsertAuditLog = typeof auditLogs.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;

export type InsertSystemSetting = typeof systemSettings.$inferInsert;
export type SystemSetting = typeof systemSettings.$inferSelect;

export type InsertChatConversation = typeof chatConversations.$inferInsert;
export type ChatConversation = typeof chatConversations.$inferSelect;

export type InsertChatMessage = typeof chatMessages.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;

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

export const insertCustomFieldDefinitionSchema = createInsertSchema(customFieldDefinitions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomFieldValueSchema = createInsertSchema(customFieldValues).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
