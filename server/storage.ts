import {
  users,
  teams,
  tasks,
  dailyReports,
  budgetItems,
  documents,
  feedback,
  activities,
  roles,
  userSessions,
  auditLogs,
  systemSettings,
  chatConversations,
  chatMessages,
  administrativeForms,
  type User,
  type UpsertUser,
  type Team,
  type InsertTeam,
  type Task,
  type InsertTask,
  type DailyReport,
  type InsertDailyReport,
  type BudgetItem,
  type InsertBudgetItem,
  type Document,
  type InsertDocument,
  type Feedback,
  type InsertFeedback,
  type Activity,
  type InsertActivity,
  type Role,
  type InsertRole,
  type UserSession,
  type InsertUserSession,
  type AuditLog,
  type InsertAuditLog,
  type SystemSetting,
  type InsertSystemSetting,
  type ChatConversation,
  type InsertChatConversation,
  type ChatMessage,
  type InsertChatMessage,
  type AdministrativeForm,
  type InsertAdministrativeForm,
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, desc, and, gte, lte, ilike, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserLastLogin(id: string): Promise<void>;
  getUsersByRole(role: string): Promise<User[]>;
  updateUserRole(id: string, role: string, permissions?: any): Promise<User>;
  deactivateUser(id: string): Promise<void>;
  
  // Additional authentication methods
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(userData: any): Promise<User>;
  
  // Session store
  sessionStore: any;
  
  // RBAC operations
  getRoles(): Promise<Role[]>;
  createRole(role: InsertRole): Promise<Role>;
  updateRole(id: number, role: Partial<InsertRole>): Promise<Role>;
  deleteRole(id: number): Promise<void>;
  
  // Security and audit operations
  createUserSession(session: InsertUserSession): Promise<UserSession>;
  getUserActiveSessions(userId: string): Promise<UserSession[]>;
  endUserSession(sessionId: string): Promise<void>;
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(filters?: { userId?: string; action?: string; severity?: string; limit?: number }): Promise<AuditLog[]>;
  
  // System settings operations
  getSystemSettings(category?: string): Promise<SystemSetting[]>;
  getSystemSetting(key: string): Promise<SystemSetting | undefined>;
  updateSystemSetting(key: string, value: any, updatedBy: string): Promise<SystemSetting>;
  
  // Chat operations
  getChatConversations(userId: string): Promise<ChatConversation[]>;
  createChatConversation(conversation: InsertChatConversation): Promise<ChatConversation>;
  getChatMessages(conversationId: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  updateConversationTitle(id: number, title: string): Promise<ChatConversation>;
  
  // Team operations
  getTeams(): Promise<Team[]>;
  getTeam(id: number): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: number, team: Partial<InsertTeam>): Promise<Team>;
  
  // Task operations
  getTasks(filters?: { teamId?: number; status?: string; assignedTo?: string }): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task>;
  deleteTask(id: number): Promise<void>;
  
  // Daily report operations
  getDailyReports(filters?: { teamId?: number; reportDate?: string; reportTime?: string }): Promise<DailyReport[]>;
  createDailyReport(report: InsertDailyReport): Promise<DailyReport>;
  updateDailyReport(id: number, report: Partial<InsertDailyReport>): Promise<DailyReport>;
  
  // Budget operations
  getBudgetItems(teamId?: number): Promise<BudgetItem[]>;
  createBudgetItem(item: InsertBudgetItem): Promise<BudgetItem>;
  updateBudgetItem(id: number, item: Partial<InsertBudgetItem>): Promise<BudgetItem>;
  
  // Document operations
  getDocuments(filters?: { teamId?: number; category?: string; isPublic?: boolean }): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, document: Partial<InsertDocument>): Promise<Document>;
  deleteDocument(id: number): Promise<void>;
  
  // Feedback operations
  getFeedback(filters?: { status?: string; type?: string; submittedBy?: string }): Promise<Feedback[]>;
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
  updateFeedback(id: number, feedback: Partial<InsertFeedback>): Promise<Feedback>;
  
  // Activity operations
  getActivities(limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Administrative Forms operations
  getAdministrativeForms(filters?: { formType?: string; status?: string; submittedBy?: string; teamId?: number }): Promise<AdministrativeForm[]>;
  getAdministrativeForm(id: number): Promise<AdministrativeForm | undefined>;
  createAdministrativeForm(form: InsertAdministrativeForm): Promise<AdministrativeForm>;
  updateAdministrativeForm(id: number, form: Partial<InsertAdministrativeForm>): Promise<AdministrativeForm>;
  deleteAdministrativeForm(id: number): Promise<void>;
  approveAdministrativeForm(id: number, approvedBy: string, reviewNotes?: string): Promise<AdministrativeForm>;
  rejectAdministrativeForm(id: number, rejectedBy: string, rejectionReason: string): Promise<AdministrativeForm>;
  
  // Dashboard statistics
  getDashboardStats(): Promise<{
    overallProgress: number;
    tasksCompleted: number;
    totalTasks: number;
    budgetUtilized: number;
    budgetAllocated: number;
    teamPerformance: string;
  }>;
}

export class DatabaseStorage implements IStorage {
  public sessionStore: any;

  constructor() {
    // Initialize session store for authentication
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
      tableName: 'sessions'
    });
  }

  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserLastLogin(id: string): Promise<void> {
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, id));
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role));
  }

  async updateUserRole(id: string, role: string, permissions?: any): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        role, 
        permissions: permissions || {},
        updatedAt: new Date() 
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deactivateUser(id: string): Promise<void> {
    await db
      .update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user;
  }

  async createUser(userData: any): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        id: userData.id || crypto.randomUUID(),
        email: userData.email,
        username: userData.username,
        password: userData.password,
        phone: userData.phone,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role || 'user',
        team: userData.team || null,
        securityLevel: userData.securityLevel || 'standard',
        permissions: userData.permissions || {},
        isActive: true,
      })
      .returning();
    return user;
  }

  // RBAC operations
  async getRoles(): Promise<Role[]> {
    return await db.select().from(roles);
  }

  async createRole(roleData: InsertRole): Promise<Role> {
    const [role] = await db.insert(roles).values(roleData).returning();
    return role;
  }

  async updateRole(id: number, roleData: Partial<InsertRole>): Promise<Role> {
    const [role] = await db
      .update(roles)
      .set(roleData)
      .where(eq(roles.id, id))
      .returning();
    return role;
  }

  async deleteRole(id: number): Promise<void> {
    await db.delete(roles).where(eq(roles.id, id));
  }

  // Security and audit operations
  async createUserSession(sessionData: InsertUserSession): Promise<UserSession> {
    const [session] = await db.insert(userSessions).values(sessionData).returning();
    return session;
  }

  async getUserActiveSessions(userId: string): Promise<UserSession[]> {
    return await db
      .select()
      .from(userSessions)
      .where(and(eq(userSessions.userId, userId), eq(userSessions.isActive, true)));
  }

  async endUserSession(sessionId: string): Promise<void> {
    await db
      .update(userSessions)
      .set({ isActive: false, logoutAt: new Date() })
      .where(eq(userSessions.sessionId, sessionId));
  }

  async createAuditLog(logData: InsertAuditLog): Promise<AuditLog> {
    const [log] = await db.insert(auditLogs).values(logData).returning();
    return log;
  }

  async getAuditLogs(filters?: { userId?: string; action?: string; severity?: string; limit?: number }): Promise<AuditLog[]> {
    let query = db.select().from(auditLogs);
    
    if (filters?.userId) {
      query = query.where(eq(auditLogs.userId, filters.userId));
    }
    if (filters?.action) {
      query = query.where(eq(auditLogs.action, filters.action));
    }
    if (filters?.severity) {
      query = query.where(eq(auditLogs.severity, filters.severity));
    }
    
    query = query.orderBy(desc(auditLogs.timestamp));
    
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    return await query;
  }

  // System settings operations
  async getSystemSettings(category?: string): Promise<SystemSetting[]> {
    if (category) {
      return await db.select().from(systemSettings).where(eq(systemSettings.category, category));
    }
    return await db.select().from(systemSettings);
  }

  async getSystemSetting(key: string): Promise<SystemSetting | undefined> {
    const [setting] = await db.select().from(systemSettings).where(eq(systemSettings.key, key));
    return setting;
  }

  async updateSystemSetting(key: string, value: any, updatedBy: string): Promise<SystemSetting> {
    const [setting] = await db
      .insert(systemSettings)
      .values({ key, value, updatedBy, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: { value, updatedBy, updatedAt: new Date() }
      })
      .returning();
    return setting;
  }

  // Chat operations
  async getChatConversations(userId: string): Promise<ChatConversation[]> {
    return await db
      .select()
      .from(chatConversations)
      .where(and(eq(chatConversations.userId, userId), eq(chatConversations.isActive, true)))
      .orderBy(desc(chatConversations.updatedAt));
  }

  async createChatConversation(conversationData: InsertChatConversation): Promise<ChatConversation> {
    const [conversation] = await db.insert(chatConversations).values(conversationData).returning();
    return conversation;
  }

  async getChatMessages(conversationId: number): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, conversationId))
      .orderBy(chatMessages.createdAt);
  }

  async createChatMessage(messageData: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db.insert(chatMessages).values(messageData).returning();
    
    // Update conversation timestamp
    await db
      .update(chatConversations)
      .set({ updatedAt: new Date() })
      .where(eq(chatConversations.id, messageData.conversationId));
    
    return message;
  }

  async updateConversationTitle(id: number, title: string): Promise<ChatConversation> {
    const [conversation] = await db
      .update(chatConversations)
      .set({ title, updatedAt: new Date() })
      .where(eq(chatConversations.id, id))
      .returning();
    return conversation;
  }

  // Team operations
  async getTeams(): Promise<Team[]> {
    return await db.select().from(teams);
  }

  async getTeam(id: number): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team;
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const [newTeam] = await db.insert(teams).values(team).returning();
    return newTeam;
  }

  async updateTeam(id: number, team: Partial<InsertTeam>): Promise<Team> {
    const [updatedTeam] = await db
      .update(teams)
      .set(team)
      .where(eq(teams.id, id))
      .returning();
    return updatedTeam;
  }

  // Task operations
  async getTasks(filters?: { teamId?: number; status?: string; assignedTo?: string }): Promise<Task[]> {
    let query = db.select().from(tasks);
    
    if (filters?.teamId) {
      query = query.where(eq(tasks.teamId, filters.teamId));
    }
    if (filters?.status) {
      query = query.where(eq(tasks.status, filters.status));
    }
    if (filters?.assignedTo) {
      query = query.where(eq(tasks.assignedTo, filters.assignedTo));
    }
    
    return await query.orderBy(desc(tasks.createdAt));
  }

  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }

  async updateTask(id: number, task: Partial<InsertTask>): Promise<Task> {
    const [updatedTask] = await db
      .update(tasks)
      .set({ ...task, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return updatedTask;
  }

  async deleteTask(id: number): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  // Daily report operations
  async getDailyReports(filters?: { teamId?: number; reportDate?: string; reportTime?: string }): Promise<DailyReport[]> {
    let query = db.select().from(dailyReports);
    
    if (filters?.teamId) {
      query = query.where(eq(dailyReports.teamId, filters.teamId));
    }
    if (filters?.reportDate) {
      query = query.where(eq(dailyReports.reportDate, filters.reportDate));
    }
    if (filters?.reportTime) {
      query = query.where(eq(dailyReports.reportTime, filters.reportTime));
    }
    
    return await query.orderBy(desc(dailyReports.createdAt));
  }

  async createDailyReport(report: InsertDailyReport): Promise<DailyReport> {
    const [newReport] = await db.insert(dailyReports).values(report).returning();
    return newReport;
  }

  async updateDailyReport(id: number, report: Partial<InsertDailyReport>): Promise<DailyReport> {
    const [updatedReport] = await db
      .update(dailyReports)
      .set(report)
      .where(eq(dailyReports.id, id))
      .returning();
    return updatedReport;
  }

  // Budget operations
  async getBudgetItems(teamId?: number): Promise<BudgetItem[]> {
    let query = db.select().from(budgetItems);
    
    if (teamId) {
      query = query.where(eq(budgetItems.teamId, teamId));
    }
    
    return await query;
  }

  async createBudgetItem(item: InsertBudgetItem): Promise<BudgetItem> {
    const [newItem] = await db.insert(budgetItems).values(item).returning();
    return newItem;
  }

  async updateBudgetItem(id: number, item: Partial<InsertBudgetItem>): Promise<BudgetItem> {
    const [updatedItem] = await db
      .update(budgetItems)
      .set(item)
      .where(eq(budgetItems.id, id))
      .returning();
    return updatedItem;
  }

  // Document operations
  async getDocuments(filters?: { teamId?: number; category?: string; isPublic?: boolean }): Promise<Document[]> {
    let query = db.select().from(documents);
    
    if (filters?.teamId) {
      query = query.where(eq(documents.teamId, filters.teamId));
    }
    if (filters?.category) {
      query = query.where(eq(documents.category, filters.category));
    }
    if (filters?.isPublic !== undefined) {
      query = query.where(eq(documents.isPublic, filters.isPublic));
    }
    
    return await query.orderBy(desc(documents.createdAt));
  }

  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document;
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const [newDocument] = await db.insert(documents).values(document).returning();
    return newDocument;
  }

  async updateDocument(id: number, document: Partial<InsertDocument>): Promise<Document> {
    const [updatedDocument] = await db
      .update(documents)
      .set(document)
      .where(eq(documents.id, id))
      .returning();
    return updatedDocument;
  }

  async deleteDocument(id: number): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  // Feedback operations
  async getFeedback(filters?: { status?: string; type?: string; submittedBy?: string }): Promise<Feedback[]> {
    let query = db.select().from(feedback);
    
    if (filters?.status) {
      query = query.where(eq(feedback.status, filters.status));
    }
    if (filters?.type) {
      query = query.where(eq(feedback.type, filters.type));
    }
    if (filters?.submittedBy) {
      query = query.where(eq(feedback.submittedBy, filters.submittedBy));
    }
    
    return await query.orderBy(desc(feedback.createdAt));
  }

  async createFeedback(feedbackData: InsertFeedback): Promise<Feedback> {
    const [newFeedback] = await db.insert(feedback).values(feedbackData).returning();
    return newFeedback;
  }

  async updateFeedback(id: number, feedbackData: Partial<InsertFeedback>): Promise<Feedback> {
    const [updatedFeedback] = await db
      .update(feedback)
      .set(feedbackData)
      .where(eq(feedback.id, id))
      .returning();
    return updatedFeedback;
  }

  // Activity operations
  async getActivities(limit: number = 50): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .orderBy(desc(activities.createdAt))
      .limit(limit);
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db.insert(activities).values(activity).returning();
    return newActivity;
  }

  // Dashboard statistics
  async getDashboardStats(): Promise<{
    overallProgress: number;
    tasksCompleted: number;
    totalTasks: number;
    budgetUtilized: number;
    budgetAllocated: number;
    teamPerformance: string;
  }> {
    // Get task statistics
    const taskStats = await db
      .select({
        total: sql<number>`count(*)::int`,
        completed: sql<number>`count(*) FILTER (WHERE status = 'completed')::int`,
        avgProgress: sql<number>`avg(progress)::int`,
      })
      .from(tasks);

    // Get budget statistics
    const budgetStats = await db
      .select({
        allocated: sql<number>`sum(allocated_amount)::numeric`,
        utilized: sql<number>`sum(utilized_amount)::numeric`,
      })
      .from(budgetItems);

    const stats = taskStats[0];
    const budget = budgetStats[0];

    // Calculate team performance based on task completion rate
    const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
    let teamPerformance = "C";
    if (completionRate >= 90) teamPerformance = "A+";
    else if (completionRate >= 80) teamPerformance = "A";
    else if (completionRate >= 70) teamPerformance = "B+";
    else if (completionRate >= 60) teamPerformance = "B";

    return {
      overallProgress: stats.avgProgress || 0,
      tasksCompleted: stats.completed || 0,
      totalTasks: stats.total || 0,
      budgetUtilized: parseFloat(budget.utilized || "0"),
      budgetAllocated: parseFloat(budget.allocated || "0"),
      teamPerformance,
    };
  }

  // Administrative Forms operations
  async getAdministrativeForms(filters?: { formType?: string; status?: string; submittedBy?: string; teamId?: number }): Promise<AdministrativeForm[]> {
    let query = db.select().from(administrativeForms);
    
    if (filters) {
      const conditions = [];
      if (filters.formType) conditions.push(eq(administrativeForms.formType, filters.formType));
      if (filters.status) conditions.push(eq(administrativeForms.status, filters.status));
      if (filters.submittedBy) conditions.push(eq(administrativeForms.submittedBy, filters.submittedBy));
      if (filters.teamId) conditions.push(eq(administrativeForms.teamId, filters.teamId));
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }
    
    return await query.orderBy(desc(administrativeForms.createdAt));
  }

  async getAdministrativeForm(id: number): Promise<AdministrativeForm | undefined> {
    const [form] = await db.select().from(administrativeForms).where(eq(administrativeForms.id, id));
    return form;
  }

  async createAdministrativeForm(formData: InsertAdministrativeForm): Promise<AdministrativeForm> {
    const [form] = await db.insert(administrativeForms).values({
      ...formData,
      submittedAt: new Date(),
    }).returning();
    
    // Log activity
    await this.createActivity({
      action: "form_submitted",
      description: `Administrative form ${formData.formType} submitted`,
      entityType: "form",
      entityId: form.id,
      userId: formData.submittedBy,
      metadata: { formType: formData.formType, sopReference: formData.sopReference },
    });
    
    return form;
  }

  async updateAdministrativeForm(id: number, formData: Partial<InsertAdministrativeForm>): Promise<AdministrativeForm> {
    const [form] = await db.update(administrativeForms)
      .set({ ...formData, updatedAt: new Date() })
      .where(eq(administrativeForms.id, id))
      .returning();
    return form;
  }

  async deleteAdministrativeForm(id: number): Promise<void> {
    await db.delete(administrativeForms).where(eq(administrativeForms.id, id));
  }

  async approveAdministrativeForm(id: number, approvedBy: string, reviewNotes?: string): Promise<AdministrativeForm> {
    const [form] = await db.update(administrativeForms)
      .set({
        status: "approved",
        approvedBy,
        approvedAt: new Date(),
        reviewNotes,
        updatedAt: new Date(),
      })
      .where(eq(administrativeForms.id, id))
      .returning();
    
    // Log activity
    await this.createActivity({
      action: "form_approved",
      description: `Administrative form approved`,
      entityType: "form",
      entityId: id,
      userId: approvedBy,
      metadata: { reviewNotes },
    });
    
    return form;
  }

  async rejectAdministrativeForm(id: number, rejectedBy: string, rejectionReason: string): Promise<AdministrativeForm> {
    const [form] = await db.update(administrativeForms)
      .set({
        status: "rejected",
        rejectionReason,
        updatedAt: new Date(),
      })
      .where(eq(administrativeForms.id, id))
      .returning();
    
    // Log activity
    await this.createActivity({
      action: "form_rejected",
      description: `Administrative form rejected`,
      entityType: "form",
      entityId: id,
      userId: rejectedBy,
      metadata: { rejectionReason },
    });
    
    return form;
  }
}

export const storage = new DatabaseStorage();
