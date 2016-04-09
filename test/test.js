
var assert = require('assert');
var _context = require('../lib/context.js');

var functionName = 'index';
var awsRequestId = _context.createInvokeId;
var timeoutMs = 3000;

_context._initialize({
	functionName: functionName,
	awsRequestId: awsRequestId,
	timeoutMs: timeoutMs
});

describe('Context object', function () {
	it('should contain initialized functionName', function () {
		assert.equal(_context.functionName, functionName);
	});
	it('should contain initialized awsRequestId', function () {
		assert.equal(_context.awsRequestId, awsRequestId);
	});
	it('should contain initialized ', function () {
		assert.equal((_context.getRemainingTimeInMillis() <= timeoutMs), true);
	});

});


