# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy root workspace files
COPY package.json package-lock.json tsconfig.base.json ./

# Copy server package (full)
COPY packages/server ./packages/server

# Minimal client package.json so workspace install succeeds
COPY packages/client/package.json ./packages/client/package.json

RUN npm ci

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy root package files and node_modules from build
COPY --from=build /app/package.json /app/package-lock.json /app/tsconfig.base.json ./
COPY --from=build /app/node_modules ./node_modules

# Copy server package (including entrypoint)
COPY --from=build /app/packages/server ./packages/server

# Minimal client package.json so workspace structure exists
COPY --from=build /app/packages/client/package.json ./packages/client/package.json

RUN chmod +x /app/packages/server/docker-entrypoint.sh

USER nodejs

ENV NODE_ENV=production
EXPOSE 3000

ENTRYPOINT ["/app/packages/server/docker-entrypoint.sh"]
CMD ["npm", "start"]
