# Use official Node.js image as the base
FROM node:20-alpine as builder

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm install --production=false

# Copy the rest of the application code
COPY . .

# --- Production image ---
FROM node:20-alpine as production
WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server ./server
COPY --from=builder /app/client ./client
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/vite.config.ts ./vite.config.ts
# Copy .env from the build context (local root), not from builder
COPY .env .env

# Debug: Check what files we actually have
RUN ls -la . && ls -la server/ && ls -la shared/ || echo "directories missing"

# Expose port (matching your .env PORT setting)
EXPOSE 5000

# Start the app using tsx to run TypeScript directly with tsconfig path resolution
CMD ["npx", "tsx", "--tsconfig", "tsconfig.json", "server/index.ts"]
