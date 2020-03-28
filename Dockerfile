### Build stage
FROM node:12-alpine as builder

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./

RUN npm install

COPY . .

RUN npm run build:prod

COPY pm2-main.json ./dist


### Run stage
FROM node:12-alpine

ENV TZ 'Europe/Kiev'

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

RUN npm install -g pm2

CMD ["pm2-runtime", "dist/pm2-main.json"]
