# BUILDER
FROM node:24-alpine AS strautomator-web-builder
ENV NODE_ENV=production
WORKDIR /app
COPY . .
RUN apk add bash git openssh && git config --global init.defaultBranch master && npm install --prefer-online && ./node_modules/.bin/tsc && npm run build

# DEPENDENCIES
FROM node:24-alpine AS strautomator-web-dependencies
ENV NODE_ENV=production
WORKDIR /app
COPY . .
RUN apk add bash git openssh && git config --global init.defaultBranch master && npm install --prefer-online --production && rm -rf ./node_modules/typescript

# FINAL IMAGE
FROM node:24-alpine AS strautomator-web-final
ENV NODE_ENV=production
ENV JSON_LOGGING=true
ENV HOST 0.0.0.0
WORKDIR /app
COPY . .
COPY --from=strautomator-web-dependencies ./app/node_modules ./node_modules
COPY --from=strautomator-web-builder ./app/node_modules/strautomator-core/lib ./node_modules/strautomator-core/lib
COPY --from=strautomator-web-builder ./app/server ./server
COPY --from=strautomator-web-builder ./app/.nuxt ./.nuxt

CMD ["npm", "start"]
