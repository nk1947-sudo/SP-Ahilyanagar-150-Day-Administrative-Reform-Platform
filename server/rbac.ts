/**
 * AhilyangarWorkflow Role-Based Access Control System
 * 
 * This module implements the role-based access control (RBAC) functionality
 * for the AhilyangarWorkflow application. It provides permission checking,
 * role assignment, and security level enforcement.
 * 
 * @module rbac
 */
import { RequestHandler } from "express";
import { storage } from "./storage";

/**
 * Permission definitions for SP Ahilyanagar system
 * These constants define all available permissions in the system.
 * Use the format "resource:action" for consistency.
 */
export const PERMISSIONS = {
  // System administration
  SYSTEM_ADMIN: 'system:admin',      // Full system administration rights
  MANAGE_USERS: 'users:manage',      // Create, edit, delete users
  MANAGE_ROLES: 'roles:manage',      // Assign, modify roles and permissions
  VIEW_AUDIT_LOGS: 'audit:view',     // View system audit logs
  MANAGE_SETTINGS: 'settings:manage', // Modify system-wide settings
  
  // Team management
  MANAGE_TEAMS: 'teams:manage',      // Create, edit, delete teams
  VIEW_TEAMS: 'teams:view',          // View team information
  
  // Task management
  CREATE_TASKS: 'tasks:create',      // Create new tasks
  EDIT_TASKS: 'tasks:edit',          // Edit existing tasks
  DELETE_TASKS: 'tasks:delete',      // Delete tasks
  VIEW_TASKS: 'tasks:view',          // View task information
  ASSIGN_TASKS: 'tasks:assign',      // Assign tasks to users
  
  // Reports
  CREATE_REPORTS: 'reports:create',
  EDIT_REPORTS: 'reports:edit',
  VIEW_REPORTS: 'reports:view',
  
  // Budget
  MANAGE_BUDGET: 'budget:manage',
  VIEW_BUDGET: 'budget:view',
  APPROVE_BUDGET: 'budget:approve',
  
  // Documents
  UPLOAD_DOCUMENTS: 'documents:upload',
  EDIT_DOCUMENTS: 'documents:edit',
  DELETE_DOCUMENTS: 'documents:delete',
  VIEW_DOCUMENTS: 'documents:view',
  
  // Feedback
  MANAGE_FEEDBACK: 'feedback:manage',
  RESPOND_FEEDBACK: 'feedback:respond',
  VIEW_FEEDBACK: 'feedback:view',
  
  // Chat/AI assistant
  USE_AI_ASSISTANT: 'ai:use',
  ADMIN_AI_ASSISTANT: 'ai:admin',
} as const;

// Role definitions with permissions
export const DEFAULT_ROLES = {
  sp: {
    name: 'SP (Superintendent of Police)',
    description: 'Full system access for SP Ahilyanagar',
    permissions: Object.values(PERMISSIONS)
  },
  team_leader: {
    name: 'Team Leader',
    description: 'Team management and coordination access',
    permissions: [
      PERMISSIONS.VIEW_TEAMS,
      PERMISSIONS.CREATE_TASKS,
      PERMISSIONS.EDIT_TASKS,
      PERMISSIONS.VIEW_TASKS,
      PERMISSIONS.ASSIGN_TASKS,
      PERMISSIONS.CREATE_REPORTS,
      PERMISSIONS.EDIT_REPORTS,
      PERMISSIONS.VIEW_REPORTS,
      PERMISSIONS.VIEW_BUDGET,
      PERMISSIONS.UPLOAD_DOCUMENTS,
      PERMISSIONS.VIEW_DOCUMENTS,
      PERMISSIONS.RESPOND_FEEDBACK,
      PERMISSIONS.VIEW_FEEDBACK,
      PERMISSIONS.USE_AI_ASSISTANT,
    ]
  },
  member: {
    name: 'Team Member',
    description: 'Standard team member access',
    permissions: [
      PERMISSIONS.VIEW_TEAMS,
      PERMISSIONS.VIEW_TASKS,
      PERMISSIONS.CREATE_REPORTS,
      PERMISSIONS.VIEW_REPORTS,
      PERMISSIONS.VIEW_BUDGET,
      PERMISSIONS.VIEW_DOCUMENTS,
      PERMISSIONS.VIEW_FEEDBACK,
      PERMISSIONS.USE_AI_ASSISTANT,
    ]
  },
  viewer: {
    name: 'Viewer',
    description: 'Read-only access for monitoring',
    permissions: [
      PERMISSIONS.VIEW_TEAMS,
      PERMISSIONS.VIEW_TASKS,
      PERMISSIONS.VIEW_REPORTS,
      PERMISSIONS.VIEW_BUDGET,
      PERMISSIONS.VIEW_DOCUMENTS,
      PERMISSIONS.VIEW_FEEDBACK,
    ]
  }
};

// Security levels
export const SECURITY_LEVELS = {
  HIGH: 'high',      // SP, critical operations
  STANDARD: 'standard', // Team leaders, regular operations  
  LIMITED: 'limited'    // Viewers, restricted access
} as const;

// Middleware to check permissions
export function requirePermission(permission: string): RequestHandler {
  return async (req: any, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: 'Invalid user session' });
      }

      const user = await storage.getUser(userId);
      if (!user || !user.isActive) {
        return res.status(403).json({ message: 'User account inactive' });
      }

      // Check if user has the required permission
      const userPermissions = user.permissions as any || {};
      const rolePermissions = DEFAULT_ROLES[user.role as keyof typeof DEFAULT_ROLES]?.permissions || [];
      
      const hasPermission = 
        rolePermissions.includes(permission) || 
        userPermissions[permission] === true ||
        user.role === 'sp'; // SP has all permissions

      if (!hasPermission) {
        // Log unauthorized access attempt
        await storage.createAuditLog({
          userId,
          action: 'access_denied',
          resource: permission,
          details: { permission, userRole: user.role },
          severity: 'medium',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });

        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      // Log successful access
      await storage.createAuditLog({
        userId,
        action: 'permission_granted',
        resource: permission,
        details: { permission, userRole: user.role },
        severity: 'info',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      req.user.dbUser = user;
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
}

// Middleware to check security level
export function requireSecurityLevel(level: string): RequestHandler {
  return async (req: any, res, next) => {
    try {
      const user = req.user?.dbUser || await storage.getUser(req.user?.claims?.sub);
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      const userSecurityLevel = user.securityLevel || SECURITY_LEVELS.LIMITED;
      
      const levelHierarchy = {
        [SECURITY_LEVELS.LIMITED]: 0,
        [SECURITY_LEVELS.STANDARD]: 1,
        [SECURITY_LEVELS.HIGH]: 2
      };

      if (levelHierarchy[userSecurityLevel] < levelHierarchy[level]) {
        await storage.createAuditLog({
          userId: user.id,
          action: 'security_level_denied',
          resource: 'security_check',
          details: { requiredLevel: level, userLevel: userSecurityLevel },
          severity: 'high',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });

        return res.status(403).json({ message: 'Insufficient security clearance' });
      }

      next();
    } catch (error) {
      console.error('Security level check error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
}

// Middleware for audit logging
export function auditLog(action: string, resource: string): RequestHandler {
  return async (req: any, res, next) => {
    try {
      const userId = req.user?.claims?.sub;
      if (userId) {
        await storage.createAuditLog({
          userId,
          action,
          resource,
          resourceId: req.params.id || req.body.id,
          details: { 
            method: req.method, 
            path: req.path,
            body: req.method !== 'GET' ? req.body : undefined
          },
          severity: 'info',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });
      }
      next();
    } catch (error) {
      console.error('Audit logging error:', error);
      next(); // Continue even if audit fails
    }
  };
}

// Function to initialize default roles in database
export async function initializeDefaultRoles() {
  try {
    for (const [roleKey, roleData] of Object.entries(DEFAULT_ROLES)) {
      await storage.createRole({
        name: roleKey,
        description: roleData.description,
        permissions: { permissions: roleData.permissions }
      }).catch(() => {
        // Role might already exist, ignore error
      });
    }
    console.log('Default roles initialized');
  } catch (error) {
    console.error('Error initializing default roles:', error);
  }
}