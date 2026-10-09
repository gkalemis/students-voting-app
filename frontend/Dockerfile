FROM node:26.10.0-alpine3.24 AS build
WORKDIR /src
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
FROM nginx:1.30.5-alpine3.24
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /src/dist /usr/share/nginx/html

