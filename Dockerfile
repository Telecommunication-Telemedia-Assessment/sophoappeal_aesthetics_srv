FROM node:15.5.1-alpine3.10
ENV PORT 8080
WORKDIR /home/node/app

RUN apk update && apk add python && apk add make && apk add gcc

RUN npm install -g forever
RUN npm install
ENTRYPOINT ["forever", "-w", "app.js"]