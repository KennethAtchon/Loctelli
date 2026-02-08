# Stage 1: Build
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Install dependencies for native modules + Node (Next.js build workers need Node, not Bun, on Alpine)
RUN apk add --no-cache python3 build-base g++ make nodejs npm

# Copy package files and install dependencies
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_DEBUG

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_DEBUG=$NEXT_PUBLIC_DEBUG

# Build with Node to avoid Bun segfault in Next.js worker (see bun.report)
ENV NODE_ENV=production
RUN node ./node_modules/next/dist/bin/next build

# Stage 2: Production
FROM oven/bun:1-alpine

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache libc6-compat

# Copy package files
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/bun.lockb* ./bun.lockb*

# Install production dependencies
RUN bun install --frozen-lockfile --production

# Copy built application
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_DEBUG

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_DEBUG=$NEXT_PUBLIC_DEBUG

# Expose port
EXPOSE 3000

# Start the app
CMD ["bun", "run", "start"]
