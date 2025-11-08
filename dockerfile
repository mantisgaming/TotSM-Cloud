FROM node:latest

WORKDIR /app

COPY package.json package-lock.json tsconfig.json ./
COPY src ./src

RUN npm i -D
RUN npm run build

ENV NODE_PORT=8080
EXPOSE 8080

CMD ["npm", "run", "start"]