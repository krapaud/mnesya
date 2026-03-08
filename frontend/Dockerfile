# Frontend Dockerfile for Mnesya React Native/Expo App

# Use Node.js 20 LTS Alpine for smaller image size
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install system dependencies for Expo/React Native
RUN apk add --no-cache \
    git \
    curl \
    bash \
    && rm -rf /var/cache/apk/*

# Copy package files first for better caching
COPY package*.json ./
COPY app.json ./

# Install dependencies (including devDependencies for Expo dev server)
# Use --legacy-peer-deps to resolve React version conflicts
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S expo -u 1001

# Change ownership of the app directory
RUN chown -R expo:nodejs /app
USER expo

# Expose Expo development port
EXPOSE 19000 19001 19002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:19000/status || exit 1

# Start Expo development server
CMD ["npm", "start"]