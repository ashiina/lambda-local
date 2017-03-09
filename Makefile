install:
	npm install

test:
	make
	cd test && ../node_modules/mocha/bin/mocha test.js

.PHONY: test
