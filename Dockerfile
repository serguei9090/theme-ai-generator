# Use the official Bun image
FROM oven/bun:1.1 AS base
WORKDIR /usr/src/app

# Install dependencies into temp directory
# This will cache them and speed up future builds
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
COPY apps/web/package.json /temp/dev/apps/web/
COPY packages/core/package.json /temp/dev/packages/core/
COPY packages/mcp-server/package.json /temp/dev/packages/mcp-server/

RUN cd /temp/dev && bun install --frozen-lockfile

# Copy node_modules from install stage
# Then copy all source files and build
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# Set environment variables for build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build the webapp
# Note: apps/web depends on @theme-ai/core and @theme-ai/mcp-server
RUN bun run build

# Final production image
FROM base AS release
COPY --from=install /temp/dev/node_modules node_modules
COPY --from=prerelease /usr/src/app/apps/web/.next apps/web/.next
COPY --from=prerelease /usr/src/app/apps/web/public apps/web/public
COPY --from=prerelease /usr/src/app/apps/web/package.json apps/web/package.json
COPY --from=prerelease /usr/src/app/package.json .

# Expose the port Next.js runs on
EXPOSE 3000

# Start the webapp
CMD ["bun", "run", "start"]
