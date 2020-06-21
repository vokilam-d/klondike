FROM node:12-alpine

RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      freetype-dev \
      harfbuzz \
      ca-certificates \
      ttf-freefont


ENV TZ 'Europe/Kiev'
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./

RUN npm install --verbose

COPY . .

RUN npm run build:prod

CMD ["./node_modules/.bin/pm2-runtime", "pm2-main.json"]
