TYPEDOC:= ./node_modules/.bin/typedoc
TSC:= ./node_modules/.bin/tsc

# Clean compiled resources and dependencies
clean:
	rm -rf ./.nuxt
	rm -rf ./server
	rm -rf ./node_modules
	rm -f package-lock.json

# Clean GIT tags.
clean-tags:
	git tag | xargs git tag -d
	git fetch -t

# Generate TypeScript docs
docs:
	rm -rf ./docs/assets
	rm -rf ./docs/classes
	rm -rf ./docs/interfaces
	rm -rf ./docs/modules
	$(TYPEDOC) --disableOutputCheck

# Compile and build resources
build:
	$(TSC)

# Run the app locally
run: build
	-cp -r ../core/settings*.json ./node_modules/strautomator-core/
	-cp -r ../core/lib/. ./node_modules/strautomator-core/lib/
	npm run start:dev

# Run the app locally as Beta
run-beta: build
	-cp -r ../core/settings*.json ./node_modules/strautomator-core/
	-cp -r ../core/lib/. ./node_modules/strautomator-core/lib/
	SMU_beta_enabled=1 npm run start:dev

# Update dependencies and set new version
update:
	-rm -rf ./node_modules/strautomator-core
	-ncu -u --target minor
	npm version $(shell date '+%y.%-V%u.1%H%M') --force --allow-same-version --no-git-tag-version
	npm install --prefer-online

# Deploy to Google App Engine
deploy-app-engine:
	$(TSC)
	npm run build
	gcloud app deploy app.yaml

# Deploy to GIT (by creating a new tag)
deploy-git:
	npm version $(shell date '+%y.%-V%u.1%H%M') --force --allow-same-version
	git push
	git push --tags

.PHONY: docs
