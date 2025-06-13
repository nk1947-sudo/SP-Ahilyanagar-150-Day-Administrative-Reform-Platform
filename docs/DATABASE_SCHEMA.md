# AhilyangarWorkflow Database Schema Documentation

This document provides detailed information about the database schema and data models used in the AhilyangarWorkflow system.

## Overview

AhilyangarWorkflow uses PostgreSQL with Drizzle ORM for data persistence. The schema is designed to support the core functionality of the municipal workflow management system, including user management, task tracking, document storage, and reporting.

## Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   Users     │       │   Teams     │       │ Departments │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id          │       │ id          │       │ id          │
│ email       │◄──┐   │ name        │   ┌───┤ name        │
│ firstName   │   │   │ description │   │   │ description │
│ lastName    │   │   │ leaderId    │◄──┘   │ headId      │◄─┐
│ role        │   └───┤ members     │       │ parentId    │  │
│ team        │       └─────────────┘       └─────────────┘  │
│ department  │◄─┐                                           │
└─────────────┘  │                                           │
                 │                                           │
┌─────────────┐  │    ┌─────────────┐       ┌─────────────┐  │
│   Tasks     │  │    │  Workflows  │       │  Documents  │  │
├─────────────┤  │    ├─────────────┤       ├─────────────┤  │
│ id          │  │    │ id          │       │ id          │  │
│ title       │  │    │ name        │       │ title       │  │
│ description │  │    │ description │       │ filename    │  │
│ status      │  │    │ steps       │       │ path        │  │
│ priority    │  │    │ createdBy   │◄──────┤ uploadedBy  │◄─┘
│ assignedTo  │◄─┘    └─────────────┘       │ department  │
│ dueDate     │                             └─────────────┘
└─────────────┘
```

## Tables

### Users

Stores user account information and authentication details.

| Column | Type | Description |
|--------|------|-------------|
| id | varchar | Primary key, unique identifier |
| email | varchar | User's email address (unique) |
| firstName | varchar | User's first name |
| lastName | varchar | User's last name |
| profileImageUrl | varchar | URL to user's profile image |
| username | varchar | Username (unique) |
| password | varchar | Hashed password |
| phone | varchar | Contact phone number |
| googleId | varchar | Google OAuth identifier |
| role | varchar | User role (sp, team_leader, member, viewer) |
| team | varchar | Team assignment |
| designation | varchar | Job title/designation |
| permissions | jsonb | Custom permissions object |
| isActive | boolean | Account status |
| lastLoginAt | timestamp | Last login timestamp |
| securityLevel | varchar | Security clearance level |
| createdAt | timestamp | Account creation timestamp |
| updatedAt | timestamp | Last update timestamp |

### Tasks

Tracks work items and assignments.

| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key, auto-incremented |
| title | varchar | Task title |
| description | text | Detailed task description |
| status | varchar | Current status (pending, in_progress, completed, etc.) |
| priority | varchar | Priority level (high, medium, low) |
| assignedTo | varchar | User ID of assignee |
| departmentId | varchar | Department ID |
| dueDate | timestamp | Task deadline |
| completedDate | timestamp | Completion timestamp |
| createdBy | varchar | User ID of creator |
| createdAt | timestamp | Task creation timestamp |
| updatedAt | timestamp | Last update timestamp |

### Teams

Organizes users into functional teams.

| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key, auto-incremented |
| name | varchar | Team name |
| description | text | Team purpose and description |
| leaderId | varchar | User ID of team leader |
| departmentId | varchar | Associated department |
| createdAt | timestamp | Team creation timestamp |
| updatedAt | timestamp | Last update timestamp |

### Documents

Stores document metadata and references to files.

| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key, auto-incremented |
| title | varchar | Document title |
| description | text | Document description |
| filename | varchar | Stored filename |
| originalName | varchar | Original uploaded filename |
| path | varchar | File storage path |
| mimeType | varchar | File MIME type |
| size | integer | File size in bytes |
| category | varchar | Document category |
| tags | jsonb | Array of tags |
| departmentId | varchar | Associated department |
| uploadedBy | varchar | User ID of uploader |
| uploadedAt | timestamp | Upload timestamp |
| updatedAt | timestamp | Last update timestamp |

### DailyReports

Tracks daily activity reports.

| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key, auto-incremented |
| date | date | Report date |
| submittedBy | varchar | User ID of submitter |
| teamId | varchar | Team ID |
| completedTasks | integer | Number of completed tasks |
| pendingTasks | integer | Number of pending tasks |
| blockers | text | Description of any blockers |
| highlights | text | Notable achievements |
| createdAt | timestamp | Report creation timestamp |
| updatedAt | timestamp | Last update timestamp |

### Workflows

Defines process templates and instances.

| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key, auto-incremented |
| name | varchar | Workflow name |
| description | text | Workflow description |
| steps | jsonb | Array of workflow steps |
| departmentId | varchar | Associated department |
| createdBy | varchar | User ID of creator |
| createdAt | timestamp | Workflow creation timestamp |
| updatedAt | timestamp | Last update timestamp |

### BudgetItems

Tracks budget allocations and expenses.

| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key, auto-incremented |
| description | text | Budget item description |
| amount | decimal | Monetary amount |
| category | varchar | Budget category |
| departmentId | varchar | Associated department |
| fiscalYear | integer | Fiscal year |
| quarter | integer | Fiscal quarter |
| status | varchar | Approval status |
| approvedBy | varchar | User ID of approver |
| createdAt | timestamp | Creation timestamp |
| updatedAt | timestamp | Last update timestamp |

### Departments

Organizes municipal departments.

| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key, auto-incremented |
| name | varchar | Department name |
| description | text | Department description |
| headId | varchar | User ID of department head |
| parentId | varchar | Parent department ID |
| createdAt | timestamp | Creation timestamp |
| updatedAt | timestamp | Last update timestamp |

### Sessions

Stores user session data (required for Replit Auth).

| Column | Type | Description |
|--------|------|-------------|
| sid | varchar | Session ID (primary key) |
| sess | jsonb | Session data |
| expire | timestamp | Expiration timestamp |

## Relationships

- Users belong to Teams
- Users belong to Departments
- Teams belong to Departments
- Tasks are assigned to Users
- Tasks belong to Departments
- Documents are uploaded by Users
- Documents belong to Departments
- Workflows are created by Users
- Workflows belong to Departments
- DailyReports are submitted by Users
- DailyReports belong to Teams

## Schema Validation

The schema uses Drizzle ORM with Zod validation to ensure data integrity. Each table has corresponding insert and update schemas that validate data before it's saved to the database.

## Indexes

- Users: Indexed on email, username, and team
- Tasks: Indexed on status, assignedTo, and dueDate
- Documents: Indexed on category and departmentId
- Sessions: Indexed on expire date

## Data Migration

Database migrations are managed through the Drizzle ORM migration system. Migration scripts are stored in the `migrations` directory and can be run using the `npm run db:push` command.
