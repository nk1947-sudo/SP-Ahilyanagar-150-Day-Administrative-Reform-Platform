/**
 * Database Configuration Module
 * 
 * This module sets up and exports the database connection used throughout the application.
 * It uses NeonDB (PostgreSQL) as the database provider with Drizzle ORM.
 * 
 * @module db
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema.js";

/**
 * Configure Neon WebSockets for serverless connections
 * This is required for NeonDB to work in serverless environments
 */
neonConfig.webSocketConstructor = ws;

/**
 * Validate environment variables
 * Ensure that DATABASE_URL is set before attempting to connect
 */
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL environment variable is not set. Please configure your database connection in .env file."
  );
}

// Log database connection attempt (useful for debugging)
console.log("Connecting to database...");

/**
 * Create connection pool with optimized configuration
 * 
 * - connectionTimeoutMillis: How long to wait for a connection (30s)
 * - max: Maximum number of clients in the pool (20)
 * - idleTimeoutMillis: How long a client can be idle before being removed (10s)
 * - keepAlive: Keep connections alive to prevent timeouts
 */
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 30000, 
  max: 20,
  idleTimeoutMillis: 10000,
  keepAlive: true
});

/**
 * Initialize Drizzle ORM with the connection pool and schema
 * This provides type-safe database operations throughout the application
 */
const db = drizzle({ client: pool, schema });

/**
 * Test database connection on startup
 * This helps catch configuration issues early in the application lifecycle
 */
pool.query('SELECT 1').then(() => {
  console.log("Database connection established successfully");
}).catch(err => {
  console.error("Failed to connect to database:", err.message);
});

/**
 * Add error handler for unexpected pool errors
 * These errors are often fatal and require application restart
 */
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Export the database connection and pool for use in other modules
export { pool, db };