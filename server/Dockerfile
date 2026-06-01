FROM node:20-alpine

WORKDIR /app

# Install build tools needed for better-sqlite3
RUN apk add --no-cache python3 make g++

COPY package.json ./
RUN npm install --omit=dev

COPY src/ ./src/

# Data directory for SQLite file
RUN mkdir -p /data
ENV DB_PATH=/data/tracker.db

EXPOSE 3001

CMD ["node", "src/index.js"]
