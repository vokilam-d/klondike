### Build stage
FROM node:12-alpine
ENV TZ 'Europe/Kiev'

RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      freetype-dev \
      harfbuzz \
      ca-certificates \
      ttf-freefont

RUN apk add --no-cache curl

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./

RUN npm install --verbose

COPY . .

RUN npm run build:prod

CMD ["./node_modules/.bin/pm2-runtime", "pm2-main.json"]


### Run stage
#FROM node:12-alpine
#
#ENV TZ 'Europe/Kiev'
#
#WORKDIR /app
#
#COPY --from=builder /app/dist ./dist
#COPY --from=builder /app/node_modules ./node_modules
#
#RUN npm install -g pm2
#
#CMD ["pm2-runtime", "dist/pm2-main.json"]
