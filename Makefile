TYPEDOC:= ./node_modules/.bin/typedoc
TSC:= ./node_modules/.bin/tsc

# Clean compiled resources and dependencies
clean:
	rm -rf ./.nuxt
	rm -rf ./server
	rm -rf ./node_modules
	rm -f package-lock.json
	git tag | xargs git tag -d

# Generate TypeScript docs
docs:
	rm -rf ./docs/assets
	rm -rf ./docs/classes
	rm -rf ./docs/interfaces
	rm -rf ./docs/modules
	$(TYPEDOC) --disableOutputCheck

# Generate resources (Nuxt.js)
generate:
	npm run generate

# Compile and build resources
build:
	$(TSC)

# Run the app locally
run: build
	npm run start:dev

# Update dependencies and set new version
update:
	-rm -rf ./node_modules/strautomator-core
	-ncu -u
	npm version $(shell date '+%y.%-V%u.%-d%H%M') --force --allow-same-version --no-git-tag-version
	npm install

# Deploy to Google App Engine
deploy-app-engine:
	$(TSC)
	npm run build
	gcloud app deploy app.yaml

# Deploy to GIT (by creating a new tag)
deploy-git:
	npm version $(shell date '+%y.%-V%u.%-d%H%M') --force --allow-same-version
	git push
	git push --tags

.PHONY: docs
