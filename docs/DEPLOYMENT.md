# AhilyangarWorkflow Deployment Guide

This guide provides detailed instructions for deploying the AhilyangarWorkflow system in various environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Development Environment](#development-environment)
- [Production Environment](#production-environment)
- [Docker Deployment](#docker-deployment)
- [Database Setup](#database-setup)
- [Environment Configuration](#environment-configuration)
- [System Requirements](#system-requirements)
- [Upgrading](#upgrading)
- [Backup and Recovery](#backup-and-recovery)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying AhilyangarWorkflow, ensure you have the following:

- Node.js (v18 or higher)
- npm or yarn
- Git
- Docker and Docker Compose (for containerized deployment)
- PostgreSQL or NeonDB account
- Domain name and SSL certificate (for production)

## Development Environment

### 1. Clone the Repository

```bash
git clone https://github.com/wildrex/ahilyanagar-workflow.git
cd AhilyangarWorkflow
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

```bash
cp .env.example .env
# Edit .env file with your settings
```

Required variables:
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret for session encryption
- `NODE_ENV`: Set to "development"
- `PORT`: Port to run the server on (default: 3000)

### 4. Start the Development Server

```bash
npm run dev
```

The development server will run on http://localhost:3000 (or your configured port).

## Production Environment

### 1. Clone the Repository

```bash
git clone https://github.com/wildrex/ahilyanagar-workflow.git
cd AhilyangarWorkflow
```

### 2. Install Dependencies

```bash
npm install --production
```

### 3. Configure Environment Variables

```bash
cp .env.example .env
# Edit .env file with production settings
```

Important production settings:
- `NODE_ENV=production`
- Use strong `SESSION_SECRET` value
- Configure production database URL
- Set appropriate port (typically 80 or 443 with SSL)

### 4. Build the Application

```bash
npm run build
```

### 5. Start the Server

```bash
npm run start
```

For better reliability, use a process manager like PM2:

```bash
npm install -g pm2
pm2 start dist/index.js --name "ahilyangar-workflow"
```

### 6. Configure Reverse Proxy (Optional)

For production, it's recommended to use Nginx as a reverse proxy:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:5000; # Your app port
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Docker Deployment

### 1. Clone the Repository

```bash
git clone https://github.com/wildrex/ahilyanagar-workflow.git
cd AhilyangarWorkflow
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
# Edit .env file with production settings
```

### 3. Build and Start Docker Containers

```bash
docker-compose up -d
```

This will start the following containers:
- Web application
- PostgreSQL database (if not using external database)

### 4. Verify Deployment

```bash
docker-compose ps
```

The application should be available at http://localhost:5000 or your configured port.

## Database Setup

### Option 1: NeonDB (Recommended for Production)

1. Create a NeonDB account and project at https://neon.tech
2. Create a new database
3. Get your connection string from the dashboard
4. Set the `DATABASE_URL` in your .env file:
   ```
   DATABASE_URL=postgresql://username:password@endpoint/database?sslmode=require
   ```

### Option 2: Local PostgreSQL

1. Install PostgreSQL on your server
2. Create a new database:
   ```sql
   CREATE DATABASE ahilyangar_workflow;
   CREATE USER ahilyangar_user WITH ENCRYPTED PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE ahilyangar_workflow TO ahilyangar_user;
   ```
3. Set the `DATABASE_URL` in your .env file:
   ```
   DATABASE_URL=postgresql://ahilyangar_user:your_password@localhost:5432/ahilyangar_workflow
   ```

### Database Migrations

To initialize the database schema:

```bash
npm run db:push
```

## Environment Configuration

The `.env` file contains important configuration options. Here's a complete list of supported variables:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode (development, production) | development | Yes |
| `PORT` | HTTP server port | 3000 | Yes |
| `DATABASE_URL` | PostgreSQL connection string | - | Yes |
| `SESSION_SECRET` | Secret for session encryption | - | Yes |
| `REPLIT_DOMAINS` | Allowed domains for Replit Auth | - | No |
| `PERPLEXITY_API_KEY` | API key for LLM service | - | No |

## System Requirements

### Minimum Requirements

- **Server**:
  - 2 CPU cores
  - 4GB RAM
  - 20GB storage
  - 1GB/s network connection

### Recommended Requirements

- **Server**:
  - 4+ CPU cores
  - 8GB+ RAM
  - 40GB+ SSD storage
  - 1GB/s network connection

### Scaling Considerations

For large deployments (100+ users):
- Consider using a load balancer
- Increase database connection pool size
- Implement caching layer with Redis
- Use a CDN for static assets

## Upgrading

To upgrade to a newer version:

### Manual Upgrade

1. Pull the latest changes:
   ```bash
   git pull origin main
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Apply database migrations:
   ```bash
   npm run db:push
   ```

4. Rebuild and restart:
   ```bash
   npm run build
   npm run start  # or restart your process manager
   ```

### Docker Upgrade

1. Pull the latest changes:
   ```bash
   git pull origin main
   ```

2. Rebuild and restart containers:
   ```bash
   docker-compose down
   docker-compose build
   docker-compose up -d
   ```

## Backup and Recovery

### Database Backup

For NeonDB:
- Use the automated backup features provided by NeonDB
- Schedule regular backups through their dashboard

For local PostgreSQL:
```bash
pg_dump -U username -d ahilyangar_workflow > backup.sql
```

### Application Data Backup

Backup uploaded documents and other files:
```bash
tar -czf uploads_backup.tar.gz uploads/
```

### Recovery Process

1. Restore database:
   ```bash
   psql -U username -d ahilyangar_workflow < backup.sql
   ```

2. Restore files:
   ```bash
   tar -xzf uploads_backup.tar.gz
   ```

## Troubleshooting

### Common Issues

#### Database Connection Errors

- Check if the database server is running
- Verify `DATABASE_URL` in the .env file
- Ensure firewall allows connections to database port

#### Application Startup Failures

- Check logs with `docker-compose logs` or in the server logs
- Verify all environment variables are set correctly
- Check disk space and permissions

#### Performance Issues

- Monitor resource usage with `top` or Docker monitoring tools
- Check database query performance
- Consider adding indexes to frequently queried fields

### Getting Help

If you encounter issues not covered here, please:

1. Check the project's GitHub issues
2. Contact support at support@wildrexsolutions.com
