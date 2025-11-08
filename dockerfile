FROM node:latest

WORKDIR /app

COPY package-lock.json package.json ./
RUN npm i

COPY ./dist ./dist

ENV NODE_PORT=8080
EXPOSE 8080

CMD ["npm", "run", "start"]