FROM node:20-alpine

# Install Apache Bench (required for load testing)
RUN apk add --no-cache apache2-utils

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
COPY tsconfig.json ./
RUN npm install

# Copy source code
COPY src ./src

# Default entrypoint runs ts-node
ENTRYPOINT ["npx", "ts-node", "src/index.ts"]

# Default args: help
CMD ["--help"]
