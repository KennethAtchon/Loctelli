# Dockerfile for Next.js project using pnpm
# ---- Build Stage ----
# FROM node:22-alpine AS builder
# WORKDIR /app

# # Install pnpm
# RUN corepack enable && corepack prepare pnpm@latest --activate

# # Copy only necessary files for dependency installation
# COPY package.json pnpm-lock.yaml ./

# # Install dependencies
# RUN pnpm install --frozen-lockfile

# # Copy the rest of the application code
# COPY . .

# # Build the Next.js app
# RUN pnpm build

# ---- Production Stage ----
FROM node:22-alpine AS runner
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set NODE_ENV to production
ENV NODE_ENV=production

# Copy only the necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Expose port 3000
EXPOSE 3000

# Start the Next.js production server
CMD ["pnpm", "start"]
