# --- deps: instala TODAS las deps (incluye dev) para poder compilar ---
FROM node:20-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json ./
COPY package-lock.json* yarn.lock* pnpm-lock.yaml* ./
# Instala respetando lock; con dev deps presentes para build
RUN \
  if [ -f package-lock.json ]; then npm ci; \
  elif [ -f yarn.lock ]; then corepack enable && yarn install --frozen-lockfile; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable && pnpm i --frozen-lockfile; \
  else npm install; fi

# --- builder: compila Next con las dev deps disponibles ---
FROM node:20-bookworm-slim AS builder
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Si algo trae binarios nativos, puedes forzar reconstrucción:
# RUN npm rebuild
RUN npm run build

# --- prod-deps: solo dependencias de producción para el runtime ---
FROM node:20-bookworm-slim AS prod-deps
WORKDIR /app
COPY package.json ./
COPY package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN \
  if [ -f package-lock.json ]; then npm ci --omit=dev; \
  elif [ -f yarn.lock ]; then corepack enable && yarn workspaces focus --all --production; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable && pnpm i --prod --frozen-lockfile; \
  else npm install --omit=dev; fi

# --- runner: imagen final mínima ---
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY package.json .
EXPOSE 3000
CMD ["npm", "run", "start"]
