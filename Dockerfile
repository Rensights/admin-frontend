FROM node:20-alpine AS builder
WORKDIR /app

# Accept NEXT_PUBLIC_API_URL and NEXT_PUBLIC_MAIN_BACKEND_URL as build arguments
# This allows Helm to pass the values from Kubernetes secret during build
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

ARG NEXT_PUBLIC_MAIN_BACKEND_URL
ENV NEXT_PUBLIC_MAIN_BACKEND_URL=$NEXT_PUBLIC_MAIN_BACKEND_URL

# Copy package files from src directory
COPY src/package*.json ./
RUN npm ci

# Copy source code from src directory
COPY src/ ./

# Build with the API URL embedded (NEXT_PUBLIC_* vars are embedded at build time)
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Runtime environment variables (set by Kubernetes)
# These are available at runtime, not build time
ENV NEXT_PUBLIC_API_URL=""
ENV NEXT_PUBLIC_MAIN_BACKEND_URL=""

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Create public directory (Next.js may not have one, but we'll create it just in case)
RUN mkdir -p ./public && chown nextjs:nodejs ./public

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3001
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]

