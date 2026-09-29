# One container, two processes (API + Next), non-root. Next 'standalone' output keeps it small.
FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY apps/api/package*.json apps/api/
COPY apps/web/package*.json apps/web/
RUN npm install --no-audit --no-fund --include=dev
COPY . .
RUN npm run build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app
# Web: Next standalone bundle. In a WORKSPACES monorepo the traced output nests the app:
# server.js lives at .next/standalone/apps/web/server.js, so the whole standalone tree is
# copied to the image ROOT, landing the server at /app/apps/web/server.js (where start.js
# runs it). Copying it under ./apps/web/ would bury it at apps/web/apps/web/server.js and
# the container crash-loops with MODULE_NOT_FOUND. static/ and public/ sit NEXT TO the
# server inside that tree, because that's where the standalone server serves them from.
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public
# API: compiled output + the full production node_modules (a superset of the standalone
# tree's minimal set: same install, so overwriting is safe).
COPY --from=build /app/apps/api/dist ./apps/api/dist
# The API's boot migrations. Without them in the image the migration loader finds an
# empty dir and skips silently, and every data endpoint 500s on missing tables.
COPY --from=build /app/apps/api/sql ./apps/api/sql
COPY --from=build /app/node_modules ./node_modules
COPY scripts/start.js ./scripts/start.js
# Next writes its prerender/ISR cache to .next/cache AT RUNTIME. Everything above was copied in
# as root, so the non-root user we drop to below cannot create it, and every server render then
# fails with "EACCES: permission denied, mkdir '/app/apps/web/.next/cache'". The page still
# renders (so health checks pass and nobody notices), but NOTHING is ever cached: every request
# re-renders from scratch and re-fetches the API. Create it, and hand the app its own tree.
RUN mkdir -p apps/web/.next/cache && chown -R app:app apps/web/.next
USER app
EXPOSE 3000
CMD ["node", "scripts/start.js"]
