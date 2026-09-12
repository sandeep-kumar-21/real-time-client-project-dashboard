# Multi-stage Dockerfile for Velozity API Server
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (including devDependencies for TypeScript compilation)
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy source code and build config
COPY tsconfig.json ./
COPY src ./src/

# Compile TypeScript
RUN npm run build

# Stage 2: Production Runtime
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy package files and install only production dependencies
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --omit=dev && npx prisma generate

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Expose API port
EXPOSE 5000

CMD ["node", "dist/server.js"]

