install: build

test: install
	cd test && ../node_modules/mocha/bin/mocha test.js

clean:
	rm -rf $(deadwood)

node_modules: package.json
	npm install

build: tsconfig.json node_modules
	npm install --only=dev
	npm run build

.PHONY: test install clean build
deadwood := node_modules package-lock.json build
