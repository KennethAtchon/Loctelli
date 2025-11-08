# Multi-stage build for better bcrypt handling
FROM node:20-slim AS builder

# Install build dependencies for native modules
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install all dependencies (including dev dependencies for building)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma lead
RUN pnpm exec prisma generate

# Build the application
RUN pnpm run build

# Compile the seed script and seed data
RUN pnpm exec tsc prisma/seed.ts --outDir dist/prisma --target es2020 --module commonjs --esModuleInterop --skipLibCheck
RUN pnpm exec tsc prisma/seed-data/defaults.ts --outDir dist/prisma/seed-data --target es2020 --module commonjs --esModuleInterop --skipLibCheck

# Production stage
FROM node:20-slim AS production

# Install build dependencies for native modules (bcrypt needs to be rebuilt)
RUN apt-get update && apt-get install -y \
    curl \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install production dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy Prisma schema and migrations
COPY --from=builder /app/prisma ./prisma

# Install prisma CLI globally (needed for start.sh script)
RUN npm install -g prisma@^6.9.0

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy compiled seed script and seed data
COPY --from=builder /app/dist/prisma/seed.js ./prisma/seed.js
COPY --from=builder /app/dist/prisma/seed-data ./prisma/seed-data

# Force reinstall bcrypt to ensure native bindings are built correctly
# pnpm rebuild sometimes doesn't work properly, so we reinstall
RUN pnpm remove bcrypt && pnpm add bcrypt@^6.0.0

# Copy startup script
COPY start.sh ./
RUN chmod +x start.sh

# Expose port
EXPOSE 8000

# Start the application with migrations
CMD ["./start.sh"] 