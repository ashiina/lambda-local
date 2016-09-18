'use strict'

var assert = require('chai').assert;
var path = require('path');
var fs = require('fs');

var functionName = 'handler';
var timeoutMs = 3000;

var winston = require("winston");
winston.level="error";

describe('- Testing utils.js', function () {
    var utils = require("../lib/utils.js");
    describe('* getAbsolutePath', function () {
        it('should return existing path file', function () {
            var path = utils.getAbsolutePath("test.js");
            assert.doesNotThrow(function(){fs.accessSync(path, fs.F_OK)});
        });
    });
    describe('* generateRandomHex', function () {
        it('should not return twice the same value', function () {
            var first = utils.generateRandomHex(10);
            var second = utils.generateRandomHex(10);
            assert.notEqual(first, second);
        });
    });
});
describe('- Testing lambdalocal.js', function () {
    describe('* Basic Run', function () {    
        var done, err;
        before(function (cb) {
            var lambdalocal = require('../lib/lambdalocal.js');
            lambdalocal.setLogger(winston);
            lambdalocal.execute({
            	event: require(path.join(__dirname, './events/test-event.js')),
            	lambdaPath: path.join(__dirname, './functs/test-func.js'),
            	lambdaHandler: functionName,
            	callbackWaitsForEmptyEventLoop: false,
            	timeoutMs: timeoutMs,
            	callback: function (_err, _done) 
                {
                    err = _err;
                    done = _done;
                    cb();
                }
            });
        });
        describe('# LambdaLocal', function () {
        	it('should return correct testvar', function () {
        		assert.equal(done.result, "testvar");
        	});
        });
        
        describe('# Context object', function () {
        	it('should contain initialized functionName', function () {
        		assert.equal(done.context.functionName, functionName);
        	});
        	it('should contain initialized awsRequestId', function () {
        		assert.equal(done.context.awsRequestId.length, 36);
        	});
        	it('should contain initialized getRemainingTimeInMillis', function () {
        		assert.isAtMost(done.context.getRemainingTimeInMillis(), timeoutMs);
        	});
        	it('should contain done function', function () {
        		assert.isDefined(done.context.done);
        	});
        	it('should contain succeed function', function () {
        		assert.isDefined(done.context.succeed);
        	});
        	it('should contain fail function', function () {
        		assert.isDefined(done.context.fail);
        	});
        });
    });
    
    describe('* AWS Profile Test Run', function () {
        var done, err;
        before(function (cb) {
            var lambdalocal = require('../lib/lambdalocal.js');
            lambdalocal.setLogger(winston);
            lambdalocal.execute({
                event: require(path.join(__dirname, './events/test-event.js')),
                lambdaPath: path.join(__dirname, './functs/test-func-awsprofile.js'),
                lambdaHandler: functionName,
                profilePath: path.join(__dirname, './other/debug.aws'),
                callbackWaitsForEmptyEventLoop: false,
                timeoutMs: timeoutMs,
                callback: function (_err, _done) 
                {
                    done = _done;
                    err = _err;
                    cb();
                }
            });
        });
        describe('# AWS credentials', function () {
            it('should return correct credentials', function () {
                assert.equal(done.key, "AKIAIOSFODNN7EXAMPLE");
                assert.equal(done.secret, "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY");
            });
        });
    });
});