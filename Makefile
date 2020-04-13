TYPEDOC:= ./node_modules/.bin/typedoc
TSC:= ./node_modules/.bin/tsc

build:
	-cd ../core && make build
	$(TSC)

clean:
	rm -rf ./server
	rm -rf ./node_modules
	rm -f package-lock.json

docs:
	rm -rf ./docs/assets
	rm -rf ./docs/classes
	rm -rf ./docs/interfaces
	rm -rf ./docs/modules
	$(TYPEDOC) --disableOutputCheck

generate:
	npm run generate

run:
	npm run start:dev

update:
	-ncu -u
	npm version $(shell date '+%y.%-V.%u%H') --force --allow-same-version --no-git-tag-version
	npm install

publish:
	npm version $(shell date '+%y.%-V.%u%H') --force --allow-same-version
	git push --tags

.PHONY: docs
