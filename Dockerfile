# Use the official Bun image
FROM oven/bun:1 AS base
WORKDIR /usr/src/app

# Stage 1: Install dependencies
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
COPY apps/web/package.json /temp/dev/apps/web/
COPY packages/core/package.json /temp/dev/packages/core/
COPY packages/mcp-server/package.json /temp/dev/packages/mcp-server/

# Install dependencies while ignoring scripts 
# This skips 'lefthook install' which requires git
RUN cd /temp/dev && bun install --frozen-lockfile --ignore-scripts

# Stage 2: Build the application
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# Set environment variables for build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build the webapp from the root (monorepo aware)
RUN bun run build

# Stage 3: Runner stage (Production optimized)
FROM base AS release
WORKDIR /usr/src/app

# Copy production artifacts
COPY --from=prerelease /usr/src/app/package.json .
COPY --from=prerelease /usr/src/app/node_modules node_modules
COPY --from=prerelease /usr/src/app/apps/web/package.json apps/web/package.json
COPY --from=prerelease /usr/src/app/apps/web/public apps/web/public
COPY --from=prerelease /usr/src/app/apps/web/.next apps/web/.next

# Expose the Next.js port
EXPOSE 3000

# Start the webapp via the root script
ENV NODE_ENV=production
CMD ["bun", "run", "start"]
