# check=error=true

FROM node:25-trixie

RUN npm install -g pnpm@10.12.1

WORKDIR /monorepo

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/api/package.json ./packages/api/
COPY packages/web/package.json ./packages/web/

RUN pnpm install --frozen-lockfile

COPY packages/shared ./packages/shared
COPY packages/api ./packages/api

WORKDIR /monorepo/packages/api

ENV NODE_ENV=production

CMD ["pnpm", "exec", "tsx", "src/index.ts"]
