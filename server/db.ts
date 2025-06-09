import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon WebSockets
neonConfig.webSocketConstructor = ws;

// Environment check
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL environment variable is not set. Please configure your database connection in .env file."
  );
}

// Log database connection attempt (useful for debugging)
console.log("Connecting to database...");

// Create connection pool with configuration
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 30000, // Increase timeout to 30 seconds
  max: 20,
  idleTimeoutMillis: 10000,
  keepAlive: true
});

// Initialize Drizzle with the pool
const db = drizzle({ client: pool, schema });

// Test connection immediately
pool.query('SELECT 1').then(() => {
  console.log("Database connection established successfully");
}).catch(err => {
  console.error("Failed to connect to database:", err.message);
});

// Add error handler for the pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export { pool, db };