FROM node:20-slim

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .

# build do TypeScript
RUN npm run build

# segurança
USER node

EXPOSE 10000

CMD ["node", "dist/server.js"]