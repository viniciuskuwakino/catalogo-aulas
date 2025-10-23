# FROM node:22-alpine

# WORKDIR /app

# COPY . .

# RUN npm install --quiet --no-optional --no-fund --loglevel=error

# RUN npm run build

# EXPOSE 3000

# CMD ["npm", "run", "start:prod"]

# Etapa 1 — Build
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --quiet --no-optional --no-fund --loglevel=error

COPY . .
RUN npm run build

# Etapa 2 — Produção
FROM node:22-alpine AS production

WORKDIR /app

# Copia apenas os arquivos essenciais
COPY package*.json ./
RUN npm ci --omit=dev --quiet --no-optional --no-fund --loglevel=error

# Copia o resultado do build
COPY --from=builder /app/dist ./dist

# Define a porta padrão
EXPOSE 3000

# Define a variável de ambiente
# ENV NODE_ENV=production

CMD ["node", "dist/main.js"]
