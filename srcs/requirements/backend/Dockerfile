FROM node:20-slim

WORKDIR /app

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json* ./
RUN npm install 
RUN npm install bcrypt 
RUN npm i @fastify/websocket
RUN npm i @types/ws -D

COPY . .

EXPOSE 3000

CMD ["npm", "start"]