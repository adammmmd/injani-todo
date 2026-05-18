FROM node:20-alpine

# Install Python dan build tools untuk better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN node migrate.mjs
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]