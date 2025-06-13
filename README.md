# AhilyangarWorkflow

Administrative workflow management system for Ahilyanagar municipal government processes.

![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)

## Project Overview

AhilyangarWorkflow is a comprehensive system designed to manage and streamline administrative processes within the Ahilyanagar municipal government. The application provides digital workflows for document processing, approval chains, and interdepartmental coordination.

## Key Features

- **Process Automation**: Digitizes paper-based administrative processes
- **Workflow Tracking**: Real-time visibility into process status
- **Document Management**: Central repository for administrative documents
- **User Role Management**: Role-based access control for different government departments
- **Integration**: Connects with other municipal systems
- **Analytics Dashboard**: Reports on process efficiency and bottlenecks

## Technology Stack

- **Frontend**: React with Radix UI components
- **Backend**: Node.js with Express
- **Database**: NeonDB (PostgreSQL)
- **ORM**: Drizzle ORM
- **Containerization**: Docker

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Docker and Docker Compose (for containerized deployment)
- PostgreSQL or NeonDB account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/wildrex/ahilyanagar-workflow.git
   cd AhilyangarWorkflow
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   # Create .env file with necessary configuration
   # See .env.example for required variables
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

### Docker Deployment

```bash
docker-compose up -d
```

## Project Structure

```
AhilyangarWorkflow/
├── client/               # Frontend React application
├── server/               # Backend Node.js services
│   ├── db.ts             # Database connection
│   ├── index.ts          # Server entry point
│   ├── llm-service.ts    # AI-assisted services
│   ├── multiAuth.ts      # Authentication methods
│   ├── rbac.ts           # Role-based access control
│   ├── routes.ts         # API endpoints
│   └── storage.ts        # File storage services
├── shared/               # Shared code between client and server
│   └── schema.ts         # Database schema
├── scripts/              # Utility scripts
├── uploads/              # Storage for uploaded documents
└── docs/                 # Project documentation
    ├── API_DOCUMENTATION.md    # API endpoints reference
    ├── ARCHITECTURE.md         # System architecture guide
    ├── DATABASE_SCHEMA.md      # Database design documentation
    ├── DEPLOYMENT.md           # Deployment instructions
    └── USER_GUIDE.md           # End-user manual
```

## Documentation

The project includes comprehensive documentation:

- [API Documentation](./docs/API_DOCUMENTATION.md) - Detailed API endpoint reference
- [Architecture Guide](./docs/ARCHITECTURE.md) - System architecture and design patterns
- [Database Schema](./docs/DATABASE_SCHEMA.md) - Database structure and relationships
- [Deployment Guide](./docs/DEPLOYMENT.md) - Instructions for various deployment scenarios
- [User Guide](./docs/USER_GUIDE.md) - End-user instructions for using the system
- [Contributing Guide](./CONTRIBUTING.md) - Guidelines for contributors

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](./LICENSE) file for details.

## Contact

Developed by Wildrex Solutions - support@wildrexsolutions.com
