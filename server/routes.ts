import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
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

// Configure multer for file uploads
const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/documents';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage_multer });

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Health check endpoint (no auth required)
  app.get('/api/health', async (req, res) => {
    try {
      const teams = await storage.getTeams();
      const tasks = await storage.getTasks();
      const reports = await storage.getDailyReports();
      const budget = await storage.getBudgetItems();
      const documents = await storage.getDocuments();
      const feedback = await storage.getFeedback();
      const activities = await storage.getActivities(5);
      
      res.json({
        status: 'healthy',
        database: 'connected',
        endpoints: {
          teams: teams.length,
          tasks: tasks.length,
          dailyReports: reports.length,
          budgetItems: budget.length,
          documents: documents.length,
          feedback: feedback.length,
          activities: activities.length
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Health check failed:", error);
      res.status(500).json({ 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/stats', isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard statistics" });
    }
  });

  // Team routes
  app.get('/api/teams', isAuthenticated, async (req, res) => {
    try {
      const teams = await storage.getTeams();
      res.json(teams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      res.status(500).json({ message: "Failed to fetch teams" });
    }
  });

  app.post('/api/teams', isAuthenticated, async (req, res) => {
    try {
      const teamData = insertTeamSchema.parse(req.body);
      const team = await storage.createTeam(teamData);
      
      // Log activity
      await storage.createActivity({
        action: 'team_created',
        description: `Team ${team.name} was created`,
        entityType: 'team',
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
  app.get('/api/tasks', isAuthenticated, async (req, res) => {
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

  app.post('/api/tasks', isAuthenticated, async (req, res) => {
    try {
      const taskData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(taskData);
      
      await storage.createActivity({
        action: 'task_created',
        description: `Task "${task.title}" was created`,
        entityType: 'task',
        entityId: task.id,
        userId: req.user?.claims?.sub,
      });
      
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.put('/api/tasks/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const taskData = req.body;
      const task = await storage.updateTask(id, taskData);
      
      await storage.createActivity({
        action: 'task_updated',
        description: `Task "${task.title}" was updated`,
        entityType: 'task',
        entityId: task.id,
        userId: req.user?.claims?.sub,
      });
      
      res.json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete('/api/tasks/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTask(id);
      
      await storage.createActivity({
        action: 'task_deleted',
        description: `Task was deleted`,
        entityType: 'task',
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
  app.get('/api/reports', isAuthenticated, async (req, res) => {
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

  app.post('/api/reports', isAuthenticated, async (req, res) => {
    try {
      const reportData = insertDailyReportSchema.parse(req.body);
      const report = await storage.createDailyReport(reportData);
      
      await storage.createActivity({
        action: 'report_submitted',
        description: `Daily report submitted for ${reportData.reportTime}`,
        entityType: 'report',
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
  app.get('/api/budget', isAuthenticated, async (req, res) => {
    try {
      const { teamId } = req.query;
      const budgetItems = await storage.getBudgetItems(teamId ? parseInt(teamId as string) : undefined);
      res.json(budgetItems);
    } catch (error) {
      console.error("Error fetching budget items:", error);
      res.status(500).json({ message: "Failed to fetch budget items" });
    }
  });

  app.post('/api/budget', isAuthenticated, async (req, res) => {
    try {
      const budgetData = insertBudgetItemSchema.parse(req.body);
      const budgetItem = await storage.createBudgetItem(budgetData);
      
      await storage.createActivity({
        action: 'budget_item_created',
        description: `Budget item "${budgetItem.category}" was created`,
        entityType: 'budget',
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
  app.get('/api/documents', isAuthenticated, async (req, res) => {
    try {
      const { teamId, category, isPublic } = req.query;
      const filters: any = {};
      
      if (teamId) filters.teamId = parseInt(teamId as string);
      if (category) filters.category = category as string;
      if (isPublic !== undefined) filters.isPublic = isPublic === 'true';
      
      const documents = await storage.getDocuments(filters);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.post('/api/documents', isAuthenticated, upload.single('file'), async (req, res) => {
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
        isPublic: req.body.isPublic === 'true',
        tags: req.body.tags ? JSON.parse(req.body.tags) : [],
      };

      const document = await storage.createDocument(documentData);
      
      await storage.createActivity({
        action: 'document_uploaded',
        description: `Document "${document.title}" was uploaded`,
        entityType: 'document',
        entityId: document.id,
        userId: req.user?.claims?.sub,
      });
      
      res.status(201).json(document);
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  // Feedback routes
  app.get('/api/feedback', isAuthenticated, async (req, res) => {
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

  app.post('/api/feedback', isAuthenticated, async (req, res) => {
    try {
      const feedbackData = insertFeedbackSchema.parse({
        ...req.body,
        submittedBy: req.user?.claims?.sub,
      });
      const feedback = await storage.createFeedback(feedbackData);
      
      await storage.createActivity({
        action: 'feedback_submitted',
        description: `Feedback submitted: "${feedback.subject}"`,
        entityType: 'feedback',
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
  app.get('/api/activities', isAuthenticated, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const activities = await storage.getActivities(limit);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req) => {
    console.log('WebSocket client connected');

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle different message types
        switch (data.type) {
          case 'ping':
            ws.send(JSON.stringify({ type: 'pong' }));
            break;
          case 'subscribe':
            // Handle subscription to specific channels (teams, tasks, etc.)
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });

    // Send welcome message
    ws.send(JSON.stringify({ 
      type: 'welcome', 
      message: 'Connected to SP Ahilyanagar Dashboard' 
    }));
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
