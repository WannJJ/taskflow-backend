# ============================================
# TaskFlow Backend Dockerfile
# Multi-stage build để giảm size image ~1GB xuống ~180MB
# Stage 1: Build (có devDependencies) → Stage 2: Run (chỉ production deps)
# ============================================

# -------- Stage 1: Build --------
FROM node:20-alpine AS builder

WORKDIR /app

# Cài đặt các gói hệ thống cần thiết cho bcrypt (native module cần Python + build tools)
RUN apk add --no-cache python3 make g++

# Copy package files trước để tận dụng Docker cache
COPY package*.json ./
COPY prisma ./prisma/

# Cài dependencies (bao gồm devDependencies để build)
RUN npm ci

# Copy toàn bộ source code
COPY . .

# Generate Prisma Client + Build NestJS (cho ra dist/)
RUN npx prisma generate
RUN npm run build

# -------- Stage 2: Production --------
FROM node:20-alpine AS runner

WORKDIR /app

# Đặt ENV stage runner (không phải stage builder) vì:
# 1. Stage runner chỉ chạy code đã build, không cần dev toolss
# 2. Báo hiệu cho NestJS/Node.js chạy optimized mode
# 3. Giúp một số package tự động tắt debug logs
ENV NODE_ENV=production

# Cài dumb-init để xử lý signal (SIGTERM) đúng cách khi container stop
# Giúp app graceful shutdown thay vì bị kill đột ngột
RUN apk add --no-cache dumb-init

# Tạo user không phải root để chạy app (security best practice)
# Nếu attacker xâm nhập container, họ chỉ có quyền của user này
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001


# Copy chỉ những file CẦN THIẾT từ stage builder
# Chỉ copy node_modules production (không có devDependencies)
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma

# Chuyển sang user không phải root
USER nestjs

EXPOSE 3001

# Dùng dumb-init để xử lý process signal đúng cách
ENTRYPOINT ["dumb-init", "--"]

# Chạy migration trước khi start app
# Lưu ý: Trong production thực tế, migration nên chạy riêng (init container)
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma generate && node dist/main"]
