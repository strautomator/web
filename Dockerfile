# BUILDER
FROM node:alpine AS strautomator-web-builder
WORKDIR /app
COPY . .
RUN apk update && apk upgrade && apk add --no-cache bash git openssh python make g++ && npm install && npm install typescript -g && npm run build
RUN cd ./node_modules/strautomator-core && tsc
RUN tsc

# DEPENDENCIES
FROM node:alpine AS strautomator-web-dependencies
ENV NODE_ENV=production
WORKDIR /app
COPY . .
RUN apk update && apk upgrade && apk add --no-cache bash git openssh python make g++ && npm install --production

# FINAL IMAGE
FROM node:alpine AS strautomator-web-final
ENV NODE_ENV=production
ENV HOST 0.0.0.0
WORKDIR /app
COPY . .
COPY --from=strautomator-web-dependencies ./app/node_modules ./node_modules
COPY --from=strautomator-web-builder ./app/node_modules/strautomator-core/lib ./node_modules/strautomator-core/lib
COPY --from=strautomator-web-builder ./app/server ./server
COPY --from=strautomator-web-builder ./app/.nuxt ./.nuxt

EXPOSE 8080
CMD ["npm", "start"]
