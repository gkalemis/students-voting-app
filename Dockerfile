FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY package*.json ./
RUN npm ci --omit=dev && addgroup -g 10001 app && adduser -D -u 10001 -G app app
COPY --from=build --chown=app:app /app/dist ./dist
COPY --chown=app:app server.ts ./
COPY --chown=app:app server ./server
COPY --chown=app:app fixtures ./fixtures
USER app
EXPOSE 3000
CMD ["npm", "run", "serve"]
