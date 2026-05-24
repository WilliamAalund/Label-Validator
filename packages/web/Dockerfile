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
COPY packages/web ./packages/web

WORKDIR /monorepo/packages/web

ARG PORT=5173
ENV PORT=${PORT}
ENV NODE_ENV=development

EXPOSE 5173

CMD ["pnpm", "dev"]
