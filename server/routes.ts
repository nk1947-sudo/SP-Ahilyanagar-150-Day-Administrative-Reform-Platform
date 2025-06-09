import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupMultiAuth } from "./multiAuth";
import {
  requirePermission,
  requireSecurityLevel,
  auditLog,
  initializeDefaultRoles,
  PERMISSIONS,
  SECURITY_LEVELS,
} from "./rbac";
import { llmService } from "./llm-service";
import {
  insertTaskSchema,
  insertDailyReportSchema,
  insertBudgetItemSchema,
  insertDocumentSchema,
  insertFeedbackSchema,
  insertTeamSchema,
} from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import bcrypt from "bcrypt"; // Add bcrypt for password hashing
import jwt from "jsonwebtoken"; // Add JWT for token-based auth (optional)

// Extend session data type
declare module "express-session" {
  interface SessionData {
    otp?: string;
    otpIdentifier?: string;
    otpExpires?: number;
  }
}

// Configure multer for file uploads
const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/documents";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage_multer });

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Initialize default roles
  await initializeDefaultRoles();

  // Add GET /api/login route to handle redirect from /api/auth/google
  app.get("/api/login", (req, res) => {
    if (req.isAuthenticated()) {
      return res.json({ message: "Already logged in", user: req.user });
    }
    res.status(200).json({
      message: "Login endpoint - please use POST /api/auth/local/login or /api/auth/google",
    });
  });

  // Enhanced Authentication Routes
  app.post("/api/auth/local/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      // Check if user exists in the database
      const user = await storage.getUserByUsername(username);
      if (!user || !user.password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Compare hashed password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Optionally use JWT instead of session
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || "your-jwt-secret", {
        expiresIn: "1h",
      });

      req.login(user, (err: any) => {
        if (err) return res.status(500).json({ message: "Login failed" });

        req.session.save((saveErr) => {
          if (saveErr) console.error("Session save error:", saveErr);
          res.json({ user, token }); // Return token for frontend
        });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Authentication error" });
    }
  });

  app.post("/api/auth/local/register", async (req, res) => {
    try {
      const { username, email, password, firstName, lastName } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      // Check if user exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await storage.createUser({
        id: `local_${username}_${Date.now()}`,
        username,
        email: email || `${username}@sp-ahilyanagar.gov.in`,
        firstName: firstName || username.charAt(0).toUpperCase() + username.slice(1),
        lastName: lastName || "",
        role: "member",
        password: hashedPassword, // Store hashed password
        isActive: true,
        lastLoginAt: new Date(),
      });

      req.login(user, (err) => {
        if (err) {
          console.error("Login error after registration:", err);
          return res.status(500).json({ message: "Registration successful but login failed" });
        }
        res.status(201).json({ message: "Registration successful", user });
      });    } catch (error) {
      console.error("Registration error:", error);
      if (!res.headersSent) {
        res.status(500).json({ 
          message: "Registration failed", 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }
  });

  app.post("/api/auth/otp/request", async (req, res) => {
    try {
      const { identifier, method } = req.body;
      if (!identifier) {
        return res.status(400).json({ message: "Email or phone required" });
      }

      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      console.log(`OTP for ${identifier}: ${otp}`); // For development - log OTP

      // Store OTP in session
      req.session.otp = otp;
      req.session.otpIdentifier = identifier;
      req.session.otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes

      res.json({ message: "OTP sent successfully", otp: otp }); // Include OTP in dev response
    } catch (error) {
      res.status(500).json({ message: "Failed to send OTP" });
    }
  });

  app.post("/api/auth/otp/verify", async (req, res) => {
    try {
      const { identifier, otp, userData } = req.body;

      if (!req.session.otp || !req.session.otpIdentifier) {
        return res.status(400).json({ message: "No OTP request found" });
      }

      if (Date.now() > (req.session.otpExpires || 0)) {
        return res.status(400).json({ message: "OTP expired" });
      }

      if (req.session.otp !== otp || req.session.otpIdentifier !== identifier) {
        return res.status(400).json({ message: "Invalid OTP" });
      }      // Create user in database
      const user = await storage.createUser({
        id: `otp_${identifier.replace(/[@.]/g, "_")}_${Date.now()}`,
        email: identifier.includes("@") ? identifier : null,
        phone: identifier.includes("@") ? null : identifier,
        firstName: userData?.firstName || "User",
        lastName: userData?.lastName || "",
        role: "member",
        team: "alpha",
        isActive: true,
        lastLoginAt: new Date(),
      });

      // Clear OTP session data
      delete req.session.otp;
      delete req.session.otpIdentifier;
      delete req.session.otpExpires;

      req.login(user, (err: any) => {
        if (err) return res.status(500).json({ message: "Login failed" });

        // Ensure session is saved
        req.session.save((saveErr) => {
          if (saveErr) console.error("Session save error:", saveErr);
          res.json(user);
        });
      });
    } catch (error) {
      res.status(500).json({ message: "Verification error" });
    }
  });

  app.get("/api/auth/google", (req, res) => {
    // Redirect to /api/login
    res.redirect("/api/login");
  });

  // Auth routes - unified user endpoint
  app.get("/api/auth/user", async (req: any, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {        // Optionally check for JWT if you switch to token-based auth
        const token = req.headers.authorization?.split(" ")[1];
        if (token) {
          try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-jwt-secret");
            if (typeof decoded !== 'string' && decoded && typeof decoded === 'object' && 'id' in decoded) {
              const user = await storage.getUser(decoded.id as string);
              if (user) {
                return res.json(user);
              }
            }
          } catch (err) {
            return res.status(401).json({ message: "Invalid token" });
          }
        }
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = req.user;

      // If user has Replit claims, fetch from database
      if (user.claims && user.claims.sub) {
        try {
          const dbUser = await storage.getUser(user.claims.sub);
          if (dbUser) {
            return res.json(dbUser);
          }
        } catch (error) {
          console.error("Error fetching Replit user from database:", error);
        }
      }

      // Return user session data directly
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Health check endpoint (no auth required)
  app.get("/api/health", async (req, res) => {
    try {
      const teams = await storage.getTeams();
      const tasks = await storage.getTasks();
      const reports = await storage.getDailyReports();
      const budget = await storage.getBudgetItems();
      const documents = await storage.getDocuments();
      const feedback = await storage.getFeedback();
      const activities = await storage.getActivities(5);

      res.json({
        status: "healthy",
        database: "connected",
        endpoints: {
          teams: teams.length,
          tasks: tasks.length,
          dailyReports: reports.length,
          budgetItems: budget.length,
          documents: documents.length,
          feedback: feedback.length,
          activities: activities.length,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Health check failed:", error);
      res.status(500).json({
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  });
  // Comprehensive API test endpoint (no auth required)
  app.get("/api/test", async (req, res) => {
    try {
      const results: { timestamp: string; tests: Record<string, any> } = {
        timestamp: new Date().toISOString(),
        tests: {},
      };

      // Test each storage method
      try {
        const teams = await storage.getTeams();
        results.tests.getTeams = { status: "pass", count: teams.length, sample: teams[0] };      } catch (error) {
        results.tests.getTeams = { status: "fail", error: error instanceof Error ? error.message : String(error) };
      }

      try {
        const tasks = await storage.getTasks();
        results.tests.getTasks = { status: "pass", count: tasks.length, sample: tasks[0] };
      } catch (error) {
        results.tests.getTasks = { status: "fail", error: error instanceof Error ? error.message : String(error) };
      }

      try {
        const reports = await storage.getDailyReports();
        results.tests.getDailyReports = { status: "pass", count: reports.length, sample: reports[0] };
      } catch (error) {
        results.tests.getDailyReports = { status: "fail", error: error instanceof Error ? error.message : String(error) };
      }

      try {
        const budget = await storage.getBudgetItems();
        results.tests.getBudgetItems = { status: "pass", count: budget.length, sample: budget[0] };
      } catch (error) {
        results.tests.getBudgetItems = { status: "fail", error: error instanceof Error ? error.message : String(error) };
      }

      try {
        const documents = await storage.getDocuments();
        results.tests.getDocuments = { status: "pass", count: documents.length, sample: documents[0] };
      } catch (error) {
        results.tests.getDocuments = { status: "fail", error: error instanceof Error ? error.message : String(error) };
      }

      try {
        const feedback = await storage.getFeedback();
        results.tests.getFeedback = { status: "pass", count: feedback.length, sample: feedback[0] };
      } catch (error) {
        results.tests.getFeedback = { status: "fail", error: error instanceof Error ? error.message : String(error) };
      }

      try {
        const activities = await storage.getActivities(5);
        results.tests.getActivities = { status: "pass", count: activities.length, sample: activities[0] };
      } catch (error) {
        results.tests.getActivities = { status: "fail", error: error instanceof Error ? error.message : String(error) };
      }

      try {
        const stats = await storage.getDashboardStats();
        results.tests.getDashboardStats = { status: "pass", data: stats };
      } catch (error) {
        results.tests.getDashboardStats = { status: "fail", error: error instanceof Error ? error.message : String(error) };
      }

      try {
        const team1 = await storage.getTeam(1);
        results.tests.getTeam = { status: "pass", data: team1 };
      } catch (error) {
        results.tests.getTeam = { status: "fail", error: error instanceof Error ? error.message : String(error) };
      }

      try {
        const task1 = await storage.getTask(1);
        results.tests.getTask = { status: "pass", data: task1 };
      } catch (error) {
        results.tests.getTask = { status: "fail", error: error instanceof Error ? error.message : String(error) };
      }

      try {
        const teamTasks = await storage.getTasks({ teamId: 1 });
        results.tests.getTasksFiltered = { status: "pass", count: teamTasks.length };
      } catch (error) {
        results.tests.getTasksFiltered = { status: "fail", error: error instanceof Error ? error.message : String(error) };
      }

      res.json(results);
    } catch (error) {
      console.error("API test failed:", error);
      res.status(500).json({
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Dashboard routes
  app.get("/api/dashboard/stats", isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard statistics" });
    }
  });

  // Team routes
  app.get("/api/teams", isAuthenticated, async (req, res) => {
    try {
      const teams = await storage.getTeams();
      res.json(teams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      res.status(500).json({ message: "Failed to fetch teams" });
    }
  });

  app.post("/api/teams", isAuthenticated, async (req, res) => {
    try {
      const teamData = insertTeamSchema.parse(req.body);
      const team = await storage.createTeam(teamData);

      // Log activity
      await storage.createActivity({
        action: "team_created",
        description: `Team ${team.name} was created`,
        entityType: "team",
        entityId: team.id,
        userId: req.user?.claims?.sub,
      });

      res.status(201).json(team);
    } catch (error) {
      console.error("Error creating team:", error);
      res.status(500).json({ message: "Failed to create team" });
    }
  });

  // Task routes
  app.get("/api/tasks", isAuthenticated, async (req, res) => {
    try {
      const { teamId, status, assignedTo } = req.query;
      const filters: any = {};

      if (teamId) filters.teamId = parseInt(teamId as string);
      if (status) filters.status = status as string;
      if (assignedTo) filters.assignedTo = assignedTo as string;

      const tasks = await storage.getTasks(filters);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", async (req: any, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Invalid user session" });
      }

      const userId = req.user.claims?.sub || req.user.id;
      const userRole = req.user.role || "member";

      // Role-based authorization for task creation
      if (!["sp", "dysp", "pi", "team_lead"].includes(userRole)) {
        return res.status(403).json({ message: "Insufficient permissions to create tasks" });
      }

      const { attachments, ...restBody } = req.body;

      const taskData = insertTaskSchema.parse({
        ...restBody,
        assignedTo: req.body.assignedTo || userId,
      });
      const task = await storage.createTask(taskData);

      // Create document attachments if provided
      if (attachments && Array.isArray(attachments) && attachments.length > 0) {
        for (const attachment of attachments) {
          await storage.createDocument({
            title: attachment.title,
            description: attachment.description || `Task attachment: ${attachment.title}`,
            category: "task_attachment",
            filePath: attachment.filePath,
            fileSize: attachment.fileSize,
            fileType: attachment.fileType,
            teamId: task.teamId,
            uploadedBy: userId,
            isPublic: false,
          });
        }

        await storage.createActivity({
          action: "documents_attached",
          description: `${attachments.length} document(s) attached to task "${task.title}"`,
          entityType: "task",
          entityId: task.id,
          userId: userId,
        });
      }

      await storage.createActivity({
        action: "task_created",
        description: `Task "${task.title}" was created`,
        entityType: "task",
        entityId: task.id,
        userId: userId,
      });

      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.post("/api/tasks/:id/assign", async (req: any, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Invalid user session" });
      }

      const userId = req.user.claims?.sub || req.user.id;
      const userRole = req.user.role || "member";

      // Only senior officers can assign tasks
      if (!["sp", "dysp", "pi", "team_lead"].includes(userRole)) {
        return res.status(403).json({ message: "Insufficient permissions to assign tasks" });
      }

      const taskId = parseInt(req.params.id);
      const { assignedTo, priority, dueDate, attachments } = req.body;

      const taskData = {
        assignedTo,
        priority: priority || "medium",
        dueDate,
        updatedAt: new Date(),
      };

      const task = await storage.updateTask(taskId, taskData);

      // Create document attachments if provided
      if (attachments && attachments.length > 0) {
        for (const attachment of attachments) {
          await storage.createDocument({
            title: attachment.title,
            description: `Task attachment: ${attachment.description}`,
            category: "task_attachment",
            filePath: attachment.filePath,
            fileSize: attachment.fileSize,
            teamId: task.teamId,
            uploadedBy: userId,
            isPublic: false,
          });
        }
      }

      await storage.createActivity({
        action: "task_assigned",
        description: `Task "${task.title}" assigned to ${assignedTo}`,
        entityType: "task",
        entityId: task.id,
        userId: userId,
      });

      res.json(task);
    } catch (error) {
      console.error("Error assigning task:", error);
      res.status(500).json({ message: "Failed to assign task" });
    }
  });

  app.put("/api/tasks/:id", async (req: any, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Invalid user session" });
      }

      const userId = req.user.claims?.sub || req.user.id;
      const id = parseInt(req.params.id);
      const taskData = req.body;
      const task = await storage.updateTask(id, taskData);

      await storage.createActivity({
        action: "task_updated",
        description: `Task "${task.title}" was updated`,
        entityType: "task",
        entityId: task.id,
        userId: userId,
      });

      res.json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTask(id);

      await storage.createActivity({
        action: "task_deleted",
        description: `Task was deleted`,
        entityType: "task",
        entityId: id,
        userId: req.user?.claims?.sub,
      });

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Daily reports routes
  app.get("/api/reports", isAuthenticated, async (req, res) => {
    try {
      const { teamId, reportDate, reportTime } = req.query;
      const filters: any = {};

      if (teamId) filters.teamId = parseInt(teamId as string);
      if (reportDate) filters.reportDate = reportDate as string;
      if (reportTime) filters.reportTime = reportTime as string;

      const reports = await storage.getDailyReports(filters);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  app.get("/api/reports/daily", isAuthenticated, async (req, res) => {
    try {
      const { teamId, reportDate, reportTime } = req.query;
      const filters: any = {};

      if (teamId) filters.teamId = parseInt(teamId as string);
      if (reportDate) filters.reportDate = reportDate as string;
      if (reportTime) filters.reportTime = reportTime as string;

      const reports = await storage.getDailyReports(filters);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching daily reports:", error);
      res.status(500).json({ message: "Failed to fetch daily reports" });
    }
  });

  app.post("/api/reports", isAuthenticated, async (req, res) => {
    try {
      const reportData = insertDailyReportSchema.parse(req.body);
      const report = await storage.createDailyReport(reportData);

      await storage.createActivity({
        action: "report_submitted",
        description: `Daily report submitted for ${reportData.reportTime}`,
        entityType: "report",
        entityId: report.id,
        userId: req.user?.claims?.sub,
      });

      res.status(201).json(report);
    } catch (error) {
      console.error("Error creating report:", error);
      res.status(500).json({ message: "Failed to create report" });
    }
  });

  // Budget routes
  app.get("/api/budget", isAuthenticated, async (req, res) => {
    try {
      const { teamId } = req.query;
      const budgetItems = await storage.getBudgetItems(teamId ? parseInt(teamId as string) : undefined);
      res.json(budgetItems);
    } catch (error) {
      console.error("Error fetching budget items:", error);
      res.status(500).json({ message: "Failed to fetch budget items" });
    }
  });

  app.post("/api/budget", isAuthenticated, async (req, res) => {
    try {
      const budgetData = insertBudgetItemSchema.parse(req.body);
      const budgetItem = await storage.createBudgetItem(budgetData);

      await storage.createActivity({
        action: "budget_item_created",
        description: `Budget item "${budgetItem.category}" was created`,
        entityType: "budget",
        entityId: budgetItem.id,
        userId: req.user?.claims?.sub,
      });

      res.status(201).json(budgetItem);
    } catch (error) {
      console.error("Error creating budget item:", error);
      res.status(500).json({ message: "Failed to create budget item" });
    }
  });

  // Document routes
  app.get("/api/documents", isAuthenticated, async (req, res) => {
    try {
      const { teamId, category, isPublic } = req.query;
      const filters: any = {};

      if (teamId) filters.teamId = parseInt(teamId as string);
      if (category) filters.category = category as string;
      if (isPublic !== undefined) filters.isPublic = isPublic === "true";

      const documents = await storage.getDocuments(filters);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.post("/api/documents", isAuthenticated, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const documentData = {
        title: req.body.title,
        description: req.body.description,
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        category: req.body.category,
        teamId: req.body.teamId ? parseInt(req.body.teamId) : null,
        uploadedBy: req.user?.claims?.sub,
        isPublic: req.body.isPublic === "true",
        tags: req.body.tags ? JSON.parse(req.body.tags) : [],
      };

      const document = await storage.createDocument(documentData);

      await storage.createActivity({
        action: "document_uploaded",
        description: `Document "${document.title}" was uploaded`,
        entityType: "document",
        entityId: document.id,
        userId: req.user?.claims?.sub,
      });

      res.status(201).json(document);
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  app.delete("/api/documents/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const documentId = parseInt(id);

      // Get document info before deletion for activity log
      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      await storage.deleteDocument(documentId);

      await storage.createActivity({
        action: "document_deleted",
        description: `Document "${document.title}" was deleted`,
        entityType: "document",
        entityId: documentId,
        userId: req.user?.claims?.sub,
      });

      res.json({ message: "Document deleted successfully" });
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Feedback routes
  app.get("/api/feedback", isAuthenticated, async (req, res) => {
    try {
      const { status, type, submittedBy } = req.query;
      const filters: any = {};

      if (status) filters.status = status as string;
      if (type) filters.type = type as string;
      if (submittedBy) filters.submittedBy = submittedBy as string;

      const feedbackList = await storage.getFeedback(filters);
      res.json(feedbackList);
    } catch (error) {
      console.error("Error fetching feedback:", error);
      res.status(500).json({ message: "Failed to fetch feedback" });
    }
  });

  app.post("/api/feedback", isAuthenticated, async (req, res) => {
    try {
      const feedbackData = insertFeedbackSchema.parse({
        ...req.body,
        submittedBy: req.user?.claims?.sub,
      });
      const feedback = await storage.createFeedback(feedbackData);

      await storage.createActivity({
        action: "feedback_submitted",
        description: `Feedback submitted: "${feedback.subject}"`,
        entityType: "feedback",
        entityId: feedback.id,
        userId: req.user?.claims?.sub,
      });

      res.status(201).json(feedback);
    } catch (error) {
      console.error("Error creating feedback:", error);
      res.status(500).json({ message: "Failed to create feedback" });
    }
  });

  // Activities routes
  app.get("/api/activities", async (req: any, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Invalid user session" });
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const activities = await storage.getActivities(limit);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // Custom Field Definition routes
  app.get("/api/custom-fields", isAuthenticated, async (req: any, res) => {
    try {
      const section = req.query.section as string;
      const fields = await storage.getCustomFieldDefinitions(section);
      res.json(fields);
    } catch (error) {
      console.error("Error fetching custom fields:", error);
      res.status(500).json({ message: "Failed to fetch custom fields" });
    }
  });

  app.get("/api/custom-field-definitions", isAuthenticated, async (req: any, res) => {
    try {
      const section = req.query.section as string;
      const fields = await storage.getCustomFieldDefinitions(section);
      res.json(fields);
    } catch (error) {
      console.error("Error fetching custom field definitions:", error);
      res.status(500).json({ message: "Failed to fetch custom field definitions" });
    }
  });

  app.post("/api/custom-fields", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const fieldData = { ...req.body, createdBy: userId };
      const field = await storage.createCustomFieldDefinition(fieldData);
      res.status(201).json(field);
    } catch (error) {
      console.error("Error creating custom field:", error);
      res.status(500).json({ message: "Failed to create custom field" });
    }
  });

  app.post("/api/custom-field-definitions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const fieldData = { ...req.body, createdBy: userId };
      const field = await storage.createCustomFieldDefinition(fieldData);
      res.status(201).json(field);
    } catch (error) {
      console.error("Error creating custom field definition:", error);
      res.status(500).json({ message: "Failed to create custom field definition" });
    }
  });

  app.put("/api/custom-fields/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const field = await storage.updateCustomFieldDefinition(id, req.body);
      res.json(field);
    } catch (error) {
      console.error("Error updating custom field:", error);
      res.status(500).json({ message: "Failed to update custom field" });
    }
  });

  app.put("/api/custom-field-definitions/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const field = await storage.updateCustomFieldDefinition(id, req.body);
      res.json(field);
    } catch (error) {
      console.error("Error updating custom field definition:", error);
      res.status(500).json({ message: "Failed to update custom field definition" });
    }
  });

  app.delete("/api/custom-fields/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCustomFieldDefinition(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting custom field:", error);
      res.status(500).json({ message: "Failed to delete custom field" });
    }
  });

  app.delete("/api/custom-field-definitions/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCustomFieldDefinition(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting custom field definition:", error);
      res.status(500).json({ message: "Failed to delete custom field definition" });
    }
  });

  // Custom Field Values routes
  app.get("/api/custom-field-values/:entityType/:entityId", isAuthenticated, async (req: any, res) => {
    try {
      const { entityType, entityId } = req.params;
      const values = await storage.getCustomFieldValues(entityType, parseInt(entityId));
      res.json(values);
    } catch (error) {
      console.error("Error fetching custom field values:", error);
      res.status(500).json({ message: "Failed to fetch custom field values" });
    }
  });

  app.post("/api/custom-field-values/:entityType/:entityId", isAuthenticated, async (req: any, res) => {
    try {
      const { entityType, entityId } = req.params;
      const { values } = req.body;
      await storage.setCustomFieldValues(entityType, parseInt(entityId), values);
      res.status(201).json({ message: "Custom field values saved" });
    } catch (error) {
      console.error("Error saving custom field values:", error);
      res.status(500).json({ message: "Failed to save custom field values" });
    }
  });

  app.post("/api/custom-field-values", isAuthenticated, async (req: any, res) => {
    try {
      const { entityType, entityId, values } = req.body;
      await storage.setCustomFieldValues(entityType, entityId, values);
      res.status(201).json({ message: "Custom field values saved" });
    } catch (error) {
      console.error("Error saving custom field values:", error);
      res.status(500).json({ message: "Failed to save custom field values" });
    }
  });

  // Administrative Forms endpoints
  app.get("/api/forms", isAuthenticated, async (req, res) => {
    try {
      const { formType, status, submittedBy, teamId } = req.query;
      const filters: any = {};
      if (formType) filters.formType = formType as string;
      if (status) filters.status = status as string;
      if (submittedBy) filters.submittedBy = submittedBy as string;
      if (teamId) filters.teamId = parseInt(teamId as string);

      const forms = await storage.getAdministrativeForms(filters);
      res.json(forms);
    } catch (error) {
      console.error("Error fetching forms:", error);
      res.status(500).json({ message: "Failed to fetch forms" });
    }
  });

  app.get("/api/forms/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const form = await storage.getAdministrativeForm(id);
      if (!form) {
        return res.status(404).json({ message: "Form not found" });
      }
      res.json(form);
    } catch (error) {
      console.error("Error fetching form:", error);
      res.status(500).json({ message: "Failed to fetch form" });
    }
  });

  app.post("/api/forms", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims?.sub || req.user?.id;

      // Helper function to get SOP reference
      const getSopReference = (formType: string): string => {
        const sopMap: Record<string, string> = {
          "team-formation": "SOP-A1",
          "progress-report": "SOP-A2",
          "meeting-minutes": "SOP-A3",
          "task-assignment": "SOP-A4",
          "risk-assessment": "SOP-A5",
        };
        return sopMap[formType] || "SOP-A0";
      };

      const formData = {
        ...req.body,
        submittedBy: userId,
        title: req.body.title || `${req.body.formType} - ${new Date().toLocaleDateString()}`,
        sopReference: getSopReference(req.body.formType),
      };

      const form = await storage.createAdministrativeForm(formData);
      res.status(201).json(form);
    } catch (error) {
      console.error("Error creating form:", error);
      res.status(500).json({ message: "Failed to create form" });
    }
  });

  app.put("/api/forms/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const form = await storage.updateAdministrativeForm(id, req.body);
      res.json(form);
    } catch (error) {
      console.error("Error updating form:", error);
      res.status(500).json({ message: "Failed to update form" });
    }
  });

  app.delete("/api/forms/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteAdministrativeForm(id);
      res.json({ message: "Form deleted successfully" });
    } catch (error) {
      console.error("Error deleting form:", error);
      res.status(500).json({ message: "Failed to delete form" });
    }
  });

  app.post("/api/forms/:id/approve", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req.user as any).claims?.sub || req.user?.id;
      const { reviewNotes } = req.body;

      const form = await storage.approveAdministrativeForm(id, userId, reviewNotes);
      res.json(form);
    } catch (error) {
      console.error("Error approving form:", error);
      res.status(500).json({ message: "Failed to approve form" });
    }
  });

  app.post("/api/forms/:id/reject", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req.user as any).claims?.sub || req.user?.id;
      const { rejectionReason } = req.body;

      if (!rejectionReason) {
        return res.status(400).json({ message: "Rejection reason is required" });
      }

      const form = await storage.rejectAdministrativeForm(id, userId, rejectionReason);
      res.json(form);
    } catch (error) {
      console.error("Error rejecting form:", error);
      res.status(500).json({ message: "Failed to reject form" });
    }
  });

  // RBAC and Security Management Routes

  // Users endpoint for task assignment
  app.get("/api/users", isAuthenticated, async (req, res) => {
    try {
      const users = await storage.getUsersByRole("member");
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // User management (SP only)
  app.get(
    "/api/admin/users",
    isAuthenticated,
    requirePermission(PERMISSIONS.MANAGE_USERS),
    requireSecurityLevel(SECURITY_LEVELS.HIGH),
    async (req, res) => {
      try {
        const role = req.query.role as string;
        const users = role ? await storage.getUsersByRole(role) : await storage.getUsersByRole("member");
        res.json(users);
      } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Failed to fetch users" });
      }
    }
  );

  app.patch(
    "/api/admin/users/:id/role",
    isAuthenticated,
    requirePermission(PERMISSIONS.MANAGE_USERS),
    requireSecurityLevel(SECURITY_LEVELS.HIGH),
    auditLog("update_user_role", "user"),
    async (req, res) => {
      try {
        const { id } = req.params;
        const { role, permissions } = req.body;
        const updatedUser = await storage.updateUserRole(id, role, permissions);
        res.json(updatedUser);
      } catch (error) {
        console.error("Error updating user role:", error);
        res.status(500).json({ message: "Failed to update user role" });
      }
    }
  );

  app.patch(
    "/api/admin/users/:id/deactivate",
    isAuthenticated,
    requirePermission(PERMISSIONS.MANAGE_USERS),
    requireSecurityLevel(SECURITY_LEVELS.HIGH),
    auditLog("deactivate_user", "user"),
    async (req, res) => {
      try {
        const { id } = req.params;
        await storage.deactivateUser(id);
        res.json({ message: "User deactivated successfully" });
      } catch (error) {
        console.error("Error deactivating user:", error);
        res.status(500).json({ message: "Failed to deactivate user" });
      }
    }
  );

  // Role management
  app.get(
    "/api/admin/roles",
    isAuthenticated,
    requirePermission(PERMISSIONS.MANAGE_ROLES),
    async (req, res) => {
      try {
        const roles = await storage.getRoles();
        res.json(roles);
      } catch (error) {
        console.error("Error fetching roles:", error);
        res.status(500).json({ message: "Failed to fetch roles" });
      }
    }
  );

  // Audit logs
  app.get(
    "/api/admin/audit-logs",
    isAuthenticated,
    requirePermission(PERMISSIONS.VIEW_AUDIT_LOGS),
    requireSecurityLevel(SECURITY_LEVELS.STANDARD),
    async (req, res) => {
      try {
        const { userId, action, severity, limit } = req.query;
        const logs = await storage.getAuditLogs({
          userId: userId as string,
          action: action as string,
          severity: severity as string,
          limit: limit ? parseInt(limit as string) : 100,
        });
        res.json(logs);
      } catch (error) {
        console.error("Error fetching audit logs:", error);
        res.status(500).json({ message: "Failed to fetch audit logs" });
      }
    }
  );

  // System settings
  app.get(
    "/api/admin/settings",
    isAuthenticated,
    requirePermission(PERMISSIONS.MANAGE_SETTINGS),
    async (req, res) => {
      try {
        const category = req.query.category as string;
        const settings = await storage.getSystemSettings(category);
        res.json(settings);
      } catch (error) {
        console.error("Error fetching settings:", error);
        res.status(500).json({ message: "Failed to fetch settings" });
      }
    }
  );

  app.put(
    "/api/admin/settings/:key",
    isAuthenticated,
    requirePermission(PERMISSIONS.MANAGE_SETTINGS),
    requireSecurityLevel(SECURITY_LEVELS.HIGH),
    auditLog("update_setting", "system_setting"),
    async (req, res) => {
      try {
        const { key } = req.params;
        const { value } = req.body;
        const userId = (req as any).user?.claims?.sub;
        const setting = await storage.updateSystemSetting(key, value, userId);
        res.json(setting);
      } catch (error) {
        console.error("Error updating setting:", error);
        res.status(500).json({ message: "Failed to update setting" });
      }
    }
  );

  // LLM Chatbot Routes
  app.get("/api/chat", (req, res) => {
    res.status(405).json({ message: "Method not allowed. Use POST to send chat messages." });
  });

  app.post("/api/chat", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const { message, conversationId } = req.body;

      if (!message || message.trim().length === 0) {
        return res.status(400).json({ message: "Message cannot be empty" });
      }

      const response = await llmService.processChat({
        message: message.trim(),
        conversationId,
        userId,
      });

      res.json(response);
    } catch (error) {
      console.error("Chat error:", error);
      if (error instanceof Error && error.message === "PERPLEXITY_API_KEY not configured") {
        res.status(503).json({ message: "AI service temporarily unavailable - API key required" });
      } else {
        res.status(500).json({ message: "Failed to process chat request" });
      }
    }
  });

  app.get("/api/chat/conversations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const conversations = await llmService.getUserConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.get(
    "/api/chat/conversations/:id",
    isAuthenticated,
    requirePermission(PERMISSIONS.USE_AI_ASSISTANT),
    async (req, res) => {
      try {
        const userId = (req as any).user?.claims?.sub;
        const conversationId = parseInt(req.params.id);
        const messages = await llmService.getConversationHistory(userId, conversationId);
        res.json(messages);
      } catch (error) {
        console.error("Error fetching conversation history:", error);
        res.status(500).json({ message: "Failed to fetch conversation history" });
      }
    }
  );

  app.delete(
    "/api/chat/conversations/:id",
    isAuthenticated,
    requirePermission(PERMISSIONS.USE_AI_ASSISTANT),
    auditLog("delete_conversation", "chat_conversation"),
    async (req, res) => {
      try {
        const userId = (req as any).user?.claims?.sub;
        const conversationId = parseInt(req.params.id);
        await llmService.deleteConversation(userId, conversationId);
        res.json({ message: "Conversation deleted successfully" });
      } catch (error) {
        console.error("Error deleting conversation:", error);
        res.status(500).json({ message: "Failed to delete conversation" });
      }
    }
  );

  // Security monitoring endpoint
  app.get(
    "/api/admin/security/sessions",
    isAuthenticated,
    requirePermission(PERMISSIONS.SYSTEM_ADMIN),
    requireSecurityLevel(SECURITY_LEVELS.HIGH),
    async (req, res) => {
      try {
        const userId = req.query.userId as string;
        if (userId) {
          const sessions = await storage.getUserActiveSessions(userId);
          res.json(sessions);
        } else {
          res.status(400).json({ message: "User ID required" });
        }
      } catch (error) {
        console.error("Error fetching user sessions:", error);
        res.status(500).json({ message: "Failed to fetch user sessions" });
      }
    }
  );

  // Add catch-all route for unhandled API endpoints
  app.use("/api/*", (req, res) => {
    res.status(404).json({ message: "API endpoint not found" });
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws: WebSocket, req) => {
    console.log("WebSocket client connected");

    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());

        // Handle different message types
        switch (data.type) {
          case "ping":
            ws.send(JSON.stringify({ type: "pong" }));
            break;
          case "subscribe":
            // Handle subscription to specific channels (teams, tasks, etc.)
            break;
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });

    ws.on("close", () => {
      console.log("WebSocket client disconnected");
    });

    // Send welcome message
    ws.send(
      JSON.stringify({
        type: "welcome",
        message: "Connected to SP Ahilyanagar Dashboard",
      })
    );
  });

  // Broadcast updates to all connected clients
  app.locals.broadcast = (data: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  };

  return httpServer;
}