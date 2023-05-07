FROM node:latest

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY facade-service/package.json /usr/src/app/package.json

RUN yarn install && yarn cache clean

COPY . /usr/src/app