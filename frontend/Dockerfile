# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm and dependencies for native modules
RUN apk add --no-cache python3 build-base g++ make \
    && npm install -g pnpm

# Copy package files and install dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

# Copy source code
COPY . .

ARG NEXT_PUBLIC_API_URL
ARG ADMIN_AUTH_CODE
ARG API_KEY
ARG BACKEND_URL
ARG DEBUG

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV ADMIN_AUTH_CODE=$ADMIN_AUTH_CODE
ENV API_KEY=$API_KEY
ENV BACKEND_URL=$BACKEND_URL
ENV DEBUG=$DEBUG

# Build the Next.js app
RUN pnpm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Install pnpm and runtime dependencies
RUN apk add --no-cache libc6-compat \
    && npm install -g pnpm

# Copy package files
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml

# Install production dependencies
RUN pnpm install --prod

# Copy built application
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

ARG NEXT_PUBLIC_API_URL
ARG ADMIN_AUTH_CODE
ARG API_KEY
ARG BACKEND_URL
ARG DEBUG

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV ADMIN_AUTH_CODE=$ADMIN_AUTH_CODE
ENV API_KEY=$API_KEY
ENV BACKEND_URL=$BACKEND_URL
ENV DEBUG=$DEBUG

# Expose port
EXPOSE 3000

# Start the app
CMD ["pnpm", "start"]