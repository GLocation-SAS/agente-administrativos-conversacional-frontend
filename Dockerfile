FROM node:20

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY server ./server
COPY src ./src
COPY public ./public

ENV PORT=8080
EXPOSE 8080

CMD ["node", "server/server.js"]
