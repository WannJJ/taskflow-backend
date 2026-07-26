# ============================================
# TaskFlow Backend Dockerfile
# Multi-stage build để giảm size image
# ============================================

# -------- Stage 1: Build --------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files trước để tận dụng Docker cache
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

# Generate Prisma Client + Build NestJS
RUN npx prisma generate
RUN npm run build

# -------- Stage 2: Production --------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Chỉ copy những gì cần thiết
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

EXPOSE 3001

# Chạy migration trước khi start (tùy chọn, có thể tách ra)
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma generate && node dist/main"]
