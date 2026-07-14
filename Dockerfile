# Multi-stage build for News Aggregator

# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
COPY frontend/package*.json ./frontend/
RUN npm pkg delete scripts.prepare
RUN npm ci --workspace=frontend --include-workspace-root=false
COPY frontend/ ./frontend/
RUN npm run build --workspace=frontend

# Stage 2: Build backend
FROM node:20-alpine AS backend-builder
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package*.json ./
COPY backend/package*.json ./backend/
RUN npm pkg delete scripts.prepare
RUN npm ci --workspace=backend --include-workspace-root=false
COPY backend/ ./backend/
RUN npm run build --workspace=backend
RUN npm prune --workspace=backend --omit=dev --include-workspace-root=false

# Stage 3: Production
FROM node:20-alpine
WORKDIR /app

# Reuse the backend builder's pruned production dependencies so native modules such as
# sqlite3 do not need Python/make/g++ in the runtime image.
COPY --from=backend-builder /app/node_modules ./node_modules

# Copy built backend
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/src/config ./src/config

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist ./public

# Create data directory
RUN mkdir -p /app/data

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=/app/data/news.db

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/index.js"]
