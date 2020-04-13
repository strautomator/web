# BUILDER
FROM node:alpine AS strautomator-web-builder
WORKDIR /app
COPY . .
RUN apk update && apk upgrade && apk add --no-cache bash git openssh python make g++ && npm install
RUN node_modules/.bin/tsc

# DEPENDENCIES
FROM node:alpine AS strautomator-web-dependencies
ENV NODE_ENV=production
WORKDIR /app
COPY . .
RUN apk update && apk upgrade && apk add --no-cache bash git openssh python make g++ && npm install --production

# FINAL IMAGE
FROM node:alpine AS strautomator-web-final
ENV NODE_ENV=production
WORKDIR /app
COPY . .
COPY --from=strautomator-web-builder ./app/server ./server
COPY --from=strautomator-web-dependencies ./app/node_modules ./node_modules
EXPOSE 8080
CMD ["npm", "start"]
