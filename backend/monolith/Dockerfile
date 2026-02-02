FROM node:20-alpine

RUN apk add --no-cache curl

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma

RUN npm install

COPY src ./src

EXPOSE 3000

CMD ["npm", "run", "dev"]

