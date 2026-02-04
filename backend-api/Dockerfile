# Multi-stage build for better bcrypt handling
FROM oven/bun:1 AS builder

# Install build dependencies for native modules
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./

# Install all dependencies (including dev dependencies for building)
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client
RUN bunx prisma generate

# Build the application
RUN bun run build

# Compile the seed script (Bun can run TS directly, but for production we compile)
RUN bun build prisma/seed.ts --outdir dist/prisma --target node

# Production stage
FROM oven/bun:1-slim AS production

# Install build dependencies for native modules (bcrypt needs to be rebuilt)
RUN apt-get update && apt-get install -y \
    curl \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./

# Install production dependencies
RUN bun install --frozen-lockfile --production

# Copy Prisma schema and migrations
COPY --from=builder /app/prisma ./prisma

# Install prisma CLI (using bunx)
# Note: bunx is built-in, no need to install globally

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy compiled seed script (bundled, includes all dependencies)
COPY --from=builder /app/dist/prisma/seed.js ./prisma/seed.js

# Force reinstall bcrypt to ensure native bindings are built correctly
RUN bun remove bcrypt && bun add bcrypt@^6.0.0

# Copy startup script
COPY start.sh ./
RUN chmod +x start.sh

# Expose port
EXPOSE 8000

# Start the application with migrations
CMD ["./start.sh"]
