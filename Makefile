install: node_modules

test: node_modules
	cd test && ../node_modules/mocha/bin/mocha test.js

clean:
	rm -rf $(deadwood)

node_modules: package.json
	npm install

.PHONY: test install clean
deadwood := node_modules package-lock.json
