FROM node:20-bookworm

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 openjdk-17-jdk-headless \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace/api

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
ENV EXECUTION_TIMEOUT_MS=3000

CMD ["node", "server.js"]
