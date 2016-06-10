
var assert = require('assert');

var functionName = 'handler';
var timeoutMs = 3000;

var lambdalocal = require('../lib/lambdalocal.js');
var callbackFunc = function (result) {
	describe('LambdaLocal', function () {
		it('should return true', function () {
			assert.equal(result, true);
		});
	});

	describe('Context object', function () {
		it('should contain initialized functionName', function () {
			assert.equal(lambdalocal.context.functionName, functionName);
		});
		it('should contain initialized awsRequestId', function () {
			assert.equal(lambdalocal.context.awsRequestId.length == 36, true);
		});
		it('should contain initialized getRemainingTimeInMillis', function () {
			assert.equal((lambdalocal.context.getRemainingTimeInMillis() <= timeoutMs), true);
		});
	});
};

lambdalocal.execute({
	eventPath: './test-event.js',
	lambdaPath: './test-func.js',
	lambdaHandler: functionName,
	profilePath: './debug.aws',
	callbackWaitsForEmptyEventLoop: false,
	timeoutMs: timeoutMs,
	callback: callbackFunc
});


