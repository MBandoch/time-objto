FROM node:20-alpine
WORKDIR /app

# better-sqlite3 é um módulo nativo: precisa de toolchain para compilar em musl/Alpine.
# Instalamos as build deps como pacote virtual e removemos após a instalação.
COPY package*.json ./
RUN apk add --no-cache --virtual .build-deps python3 make g++ \
  && npm ci --omit=dev \
  && apk del .build-deps

COPY src ./src
EXPOSE 3001
ENV DB_PATH=/data/objto.db
CMD ["node", "src/index.js"]
