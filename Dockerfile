# DEPENDENCIES
FROM node:alpine AS strautomator-dependencies
WORKDIR /app
COPY . .
RUN apk update && apk upgrade && npm install --production

# FINAL IMAGE
FROM node:alpine AS strautomator-final
ENV NODE_ENV=production
WORKDIR /app
COPY . .
COPY --from=strautomator-dependencies ./app/node_modules ./node_modules
EXPOSE 8090
CMD ["npm", "start"]
