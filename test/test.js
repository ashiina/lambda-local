'use strict';

var assert = require('assert');
var path = require('path');

var functionName = 'handler';
var timeoutMs = 3000;

var lambdalocal = require('../lib/lambdalocal.js');
var callbackFunc = function(err, data) {
  describe('LambdaLocal', function() {
    it('err should be null', function() {
      assert.equal(err, null);
    });
    it('data should not be null', function() {
    	assert.notEqual(data, null);
    });
  });

  describe('Context object', function() {
    it('should contain initialized functionName', function() {
      assert.equal(lambdalocal.context.functionName, functionName);
    });
    it('should contain initialized awsRequestId', function() {
      assert.equal(lambdalocal.context.awsRequestId.length === 36, true);
    });
    it('should contain initialized getRemainingTimeInMillis', function() {
      assert.equal((lambdalocal.context.getRemainingTimeInMillis() <= timeoutMs), true);
    });
  });
};

lambdalocal.execute({
  event: require(path.join(__dirname, './test-event.js')),
  lambdaPath: path.join(__dirname, './test-func.js'),
  lambdaHandler: functionName,
  profilePath: path.join(__dirname, './debug.aws'),
  callbackWaitsForEmptyEventLoop: true,
  timeoutMs: timeoutMs,
  callback: callbackFunc
});
