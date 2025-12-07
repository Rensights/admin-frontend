# Stage 1: Build the application
FROM node:20-alpine AS builder
WORKDIR /app

# Accept build arguments
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

ARG NEXT_PUBLIC_MAIN_BACKEND_URL
ENV NEXT_PUBLIC_MAIN_BACKEND_URL=$NEXT_PUBLIC_MAIN_BACKEND_URL

# Copy package files first for better layer caching
COPY src/package*.json ./

# Install dependencies (this layer will be cached unless package.json changes)
RUN npm ci --prefer-offline --no-audit --quiet

# Copy source code (this layer only invalidates when code changes)
COPY src/ ./

# Build the application
RUN npm run build

# Stage 2: Runtime image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Runtime environment variables (set by Kubernetes)
ENV NEXT_PUBLIC_API_URL=""
ENV NEXT_PUBLIC_MAIN_BACKEND_URL=""

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir -p ./public && \
    chown nextjs:nodejs ./public

# Copy built files from builder
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3001
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
