# ==========================================
# Stage 1: Build React + Vite frontend
# ==========================================
FROM node:24-alpine AS builder

WORKDIR /app

# Copy package descriptors first to leverage layer caching
COPY package*.json ./

RUN npm ci

# Copy application source files
COPY . .

# Build argument for API base URL (defaults to /api/v1)
ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Build production bundle to dist/
RUN npm run build

# ==========================================
# Stage 2: Production Nginx web server
# ==========================================
FROM nginx:1.27-alpine AS runner

# Remove default nginx placeholder files
RUN rm -rf /usr/share/nginx/html/*

# Copy static build output from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration with SPA fallback & gzip
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
