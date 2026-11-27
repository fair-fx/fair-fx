# The collector: one run per start, then the container exits.
# Build from the repo root, which is the build context:
#   docker build --platform linux/amd64 --file deploy/collector/Dockerfile --tag fairfx-collector .

FROM node:26-slim AS build
WORKDIR /app
# CI=true lets pnpm replace node_modules without asking.
ENV CI=true
RUN npm install --global pnpm@12.23.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/core/package.json packages/core/
COPY packages/venues/package.json packages/venues/
COPY packages/db/package.json packages/db/
COPY apps/collector/package.json apps/collector/
RUN pnpm install --frozen-lockfile

COPY packages packages
COPY apps apps
RUN pnpm build

# Keep only what a run needs: the compiled packages and their runtime dependencies.
RUN pnpm install --frozen-lockfile --prod \
  && rm -rf packages/*/src apps/*/src

FROM node:26-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/packages packages
COPY --from=build /app/apps apps
# The collector finds config/ four folders above apps/collector/dist/env, so the layout of the repo is kept.
COPY config config

USER node
CMD ["node", "apps/collector/dist/main.js"]
