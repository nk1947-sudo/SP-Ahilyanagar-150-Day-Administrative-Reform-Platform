# AhilyangarWorkflow API Documentation

This document provides detailed information about the API endpoints available in the AhilyangarWorkflow system.

## Table of Contents

- [Authentication](#authentication)
- [Users](#users)
- [Tasks](#tasks)
- [Documents](#documents)
- [Teams](#teams)
- [Reports](#reports)
- [Workflows](#workflows)
- [Budget Items](#budget-items)

## Authentication

### Login

**URL**: `/api/auth/login`
**Method**: `POST`
**Authentication required**: No

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

**Success Response**:
```json
{
  "success": true,
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "member"
  },
  "token": "jwt-token"
}
```

### Logout

**URL**: `/api/auth/logout`
**Method**: `POST`
**Authentication required**: Yes

**Success Response**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Users

### Get Current User

**URL**: `/api/users/me`
**Method**: `GET`
**Authentication required**: Yes

**Success Response**:
```json
{
  "id": "user-id",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "member",
  "team": "alpha",
  "designation": "Officer",
  "securityLevel": "standard"
}
```

### Get All Users

**URL**: `/api/users`
**Method**: `GET`
**Authentication required**: Yes
**Required Permissions**: `MANAGE_USERS`

**Success Response**:
```json
{
  "users": [
    {
      "id": "user-id-1",
      "email": "user1@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "member",
      "team": "alpha"
    },
    {
      "id": "user-id-2",
      "email": "user2@example.com",
      "firstName": "Jane",
      "lastName": "Smith",
      "role": "team_leader",
      "team": "bravo"
    }
  ]
}
```

### Create User

**URL**: `/api/users`
**Method**: `POST`
**Authentication required**: Yes
**Required Permissions**: `MANAGE_USERS`

**Request Body**:
```json
{
  "email": "new.user@example.com",
  "firstName": "New",
  "lastName": "User",
  "password": "securepassword",
  "role": "member",
  "team": "alpha",
  "designation": "Clerk",
  "securityLevel": "standard"
}
```

**Success Response**:
```json
{
  "id": "new-user-id",
  "email": "new.user@example.com",
  "firstName": "New",
  "lastName": "User",
  "role": "member"
}
```

## Tasks

### Get Tasks

**URL**: `/api/tasks`
**Method**: `GET`
**Authentication required**: Yes

**Query Parameters**:
- `status` (optional): Filter by status (pending, in_progress, completed, etc.)
- `priority` (optional): Filter by priority (high, medium, low)
- `assignee` (optional): Filter by assignee user ID

**Success Response**:
```json
{
  "tasks": [
    {
      "id": "task-id-1",
      "title": "Review building permit application",
      "description": "Review the building permit application for 123 Main St",
      "status": "pending",
      "priority": "high",
      "assignedTo": "user-id",
      "dueDate": "2025-06-30T00:00:00Z",
      "createdAt": "2025-06-13T10:00:00Z"
    }
  ]
}
```

### Create Task

**URL**: `/api/tasks`
**Method**: `POST`
**Authentication required**: Yes
**Required Permissions**: `CREATE_TASKS`

**Request Body**:
```json
{
  "title": "Process tax document",
  "description": "Process the tax exemption document for ABC Corp",
  "priority": "medium",
  "assignedTo": "user-id",
  "dueDate": "2025-06-20T00:00:00Z",
  "departmentId": "dept-id"
}
```

**Success Response**:
```json
{
  "id": "new-task-id",
  "title": "Process tax document",
  "description": "Process the tax exemption document for ABC Corp",
  "status": "pending",
  "priority": "medium",
  "assignedTo": "user-id",
  "dueDate": "2025-06-20T00:00:00Z",
  "createdAt": "2025-06-13T11:00:00Z"
}
```

## Documents

### Upload Document

**URL**: `/api/documents`
**Method**: `POST`
**Authentication required**: Yes
**Content-Type**: `multipart/form-data`

**Form Data**:
- `file`: The document file to upload
- `title`: Document title
- `description`: Document description
- `category`: Document category
- `departmentId`: ID of the department the document belongs to

**Success Response**:
```json
{
  "id": "doc-id",
  "title": "Building Permit",
  "filename": "document-12345.pdf",
  "fileUrl": "/uploads/documents/document-12345.pdf",
  "category": "permits",
  "uploadedBy": "user-id",
  "uploadedAt": "2025-06-13T12:00:00Z"
}
```

### Get Documents

**URL**: `/api/documents`
**Method**: `GET`
**Authentication required**: Yes

**Query Parameters**:
- `category` (optional): Filter by document category
- `department` (optional): Filter by department ID

**Success Response**:
```json
{
  "documents": [
    {
      "id": "doc-id",
      "title": "Building Permit",
      "filename": "document-12345.pdf",
      "fileUrl": "/uploads/documents/document-12345.pdf",
      "category": "permits",
      "uploadedBy": "user-id",
      "uploadedAt": "2025-06-13T12:00:00Z"
    }
  ]
}
```

## Teams

### Get Teams

**URL**: `/api/teams`
**Method**: `GET`
**Authentication required**: Yes

**Success Response**:
```json
{
  "teams": [
    {
      "id": "team-id-1",
      "name": "Alpha",
      "description": "Primary processing team",
      "leaderId": "leader-user-id",
      "memberCount": 5
    },
    {
      "id": "team-id-2",
      "name": "Bravo",
      "description": "Secondary processing team",
      "leaderId": "leader-user-id-2",
      "memberCount": 4
    }
  ]
}
```

### Create Team

**URL**: `/api/teams`
**Method**: `POST`
**Authentication required**: Yes
**Required Permissions**: `MANAGE_TEAMS`

**Request Body**:
```json
{
  "name": "Charlie",
  "description": "Special projects team",
  "leaderId": "user-id"
}
```

**Success Response**:
```json
{
  "id": "new-team-id",
  "name": "Charlie",
  "description": "Special projects team",
  "leaderId": "user-id",
  "memberCount": 1
}
```

## Reports

### Get Daily Reports

**URL**: `/api/reports/daily`
**Method**: `GET`
**Authentication required**: Yes

**Query Parameters**:
- `startDate` (optional): Filter reports from this date
- `endDate` (optional): Filter reports until this date
- `teamId` (optional): Filter by team ID

**Success Response**:
```json
{
  "reports": [
    {
      "id": "report-id-1",
      "date": "2025-06-12",
      "submittedBy": "user-id",
      "teamId": "team-id",
      "completedTasks": 5,
      "pendingTasks": 3,
      "blockers": "Waiting for approval from legal department",
      "highlights": "Completed all high-priority permit applications"
    }
  ]
}
```

## Workflows

### Get Workflows

**URL**: `/api/workflows`
**Method**: `GET`
**Authentication required**: Yes

**Success Response**:
```json
{
  "workflows": [
    {
      "id": "workflow-id-1",
      "name": "Building Permit Approval",
      "description": "Process for approving building permits",
      "steps": [
        {
          "id": "step-id-1",
          "name": "Initial Review",
          "order": 1,
          "assignedRole": "member"
        },
        {
          "id": "step-id-2",
          "name": "Technical Assessment",
          "order": 2,
          "assignedRole": "engineer"
        },
        {
          "id": "step-id-3",
          "name": "Final Approval",
          "order": 3,
          "assignedRole": "supervisor"
        }
      ],
      "createdAt": "2025-05-01T00:00:00Z"
    }
  ]
}
```

## Budget Items

### Get Budget Items

**URL**: `/api/budget`
**Method**: `GET`
**Authentication required**: Yes
**Required Permissions**: `VIEW_BUDGET`

**Success Response**:
```json
{
  "budgetItems": [
    {
      "id": "budget-id-1",
      "description": "Office supplies",
      "amount": 5000.00,
      "category": "operational",
      "fiscalYear": 2025,
      "quarter": 2,
      "approvedBy": "approver-id",
      "status": "approved"
    }
  ]
}
```

### Create Budget Item

**URL**: `/api/budget`
**Method**: `POST`
**Authentication required**: Yes
**Required Permissions**: `MANAGE_BUDGET`

**Request Body**:
```json
{
  "description": "IT equipment",
  "amount": 10000.00,
  "category": "capital",
  "fiscalYear": 2025,
  "quarter": 3
}
```

**Success Response**:
```json
{
  "id": "new-budget-id",
  "description": "IT equipment",
  "amount": 10000.00,
  "category": "capital",
  "fiscalYear": 2025,
  "quarter": 3,
  "status": "pending"
}
```
