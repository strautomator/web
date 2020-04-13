# BUILDER
FROM node:alpine AS strautomator-web-builder
WORKDIR /app
COPY . .
RUN npm install
RUN node_modules/.bin/tsc

# DEPENDENCIES
FROM node:alpine AS strautomator-web-dependencies
WORKDIR /app
COPY . .
RUN apk update && apk upgrade && npm install --production
RUN npm install strautomator/core

# FINAL IMAGE
FROM node:alpine AS strautomator-web-final
ENV NODE_ENV=production
WORKDIR /app
COPY . .
COPY --from=strautomator-web-builder ./app/lib ./lib
COPY --from=strautomator-web-dependencies ./app/node_modules ./node_modules
EXPOSE 8080
CMD ["npm", "start"]
