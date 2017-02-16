"use strict";

var assert = require("chai").assert;
var path = require("path");
var fs = require("fs");

var functionName = "handler";
var timeoutMs = 3000;

var sinon = require("sinon");

var winston = require("winston");
winston.level = "error";

describe("- Testing utils.js", function () {
    var utils = require("../lib/utils.js");
    describe("* getAbsolutePath", function () {
        it("should return existing path file", function () {
            var f_path = utils.getAbsolutePath("test.js");
            assert.doesNotThrow(function(){fs.accessSync(f_path, fs.F_OK)});
        });
    });
    describe("* generateRandomHex", function () {
        it("should not return twice the same value", function () {
            var first = utils.generateRandomHex(10);
            var second = utils.generateRandomHex(10);
            assert.notEqual(first, second);
        });
    });
});
describe("- Testing lambdalocal.js Logger", function () {
    var lambdalocal = require("../lib/lambdalocal.js");
    var defaultLogger = lambdalocal.getLogger();
    describe("* Use winston logger", function () {
        it("should correctly load Logger", function () {
            lambdalocal.setLogger(winston);
            var logger = lambdalocal.getLogger();
            assert.equal(winston, logger);
        });
    });
    describe("* Use invalid logger (object)", function () {
        it("should load default Logger", function () {
            lambdalocal.setLogger(Object);
            var logger = lambdalocal.getLogger();
            assert.equal(logger, defaultLogger);
        });
    });
    describe("* Use null logger", function () {
        it("should load default Logger", function () {
            lambdalocal.setLogger(null);
            var logger = lambdalocal.getLogger();
            assert.equal(logger, defaultLogger);
        });
    });
});

describe("- Testing lambdalocal.js", function () {
    describe("* Basic Run", function () {
        var done, err;
        before(function (cb) {
            var lambdalocal = require("../lib/lambdalocal.js");
            lambdalocal.setLogger(winston);
            lambdalocal.execute({
                event: require(path.join(__dirname, "./events/test-event.js")),
                lambdaPath: path.join(__dirname, "./functs/test-func.js"),
                lambdaHandler: functionName,
                profilePath: path.join(__dirname, "./other/debug.aws"),
                callbackWaitsForEmptyEventLoop: false,
                timeoutMs: timeoutMs,
                callback: function (_err, _done) {
                    err = _err;
                    done = _done;
                    cb();
                },
                environment: {
                    "envkey1": "Environment",
                    "envkey2": {"k":"v"},
                    "envkey3": 123
                }
            });
        });
        describe("# Environment Variables", function () {
            it("should return correct environment variables", function () {
                assert.equal(process.env.envkey1, "Environment");
                assert.equal(process.env.envkey2, {"k":"v"});
                assert.equal(process.env.envkey3, 123);
            });
        });


        describe("# AWS credentials", function () {
            it("should return correct credentials", function () {
                assert.equal(process.env.AWS_ACCESS_KEY_ID, "AKIAIOSFODNN7EXAMPLE");
                assert.equal(process.env.AWS_SECRET_ACCESS_KEY, "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY");
            });
        });

        describe("# LambdaLocal", function () {
            it("should return correct testvar", function () {
                assert.equal(done.result, "testvar");
            });
        });

        describe("# Context object", function () {
            it("should contain initialized functionName", function () {
                assert.equal(done.context.functionName, functionName);
            });
            it("should contain initialized awsRequestId", function () {
                assert.equal(done.context.awsRequestId.length, 36);
            });
            it("should contain initialized getRemainingTimeInMillis", function () {
                assert.isAtMost(done.context.getRemainingTimeInMillis(), timeoutMs);
            });
            it("should contain done function", function () {
                assert.isDefined(done.context.done);
            });
            it("should contain succeed function", function () {
                assert.isDefined(done.context.succeed);
            });
            it("should contain fail function", function () {
                assert.isDefined(done.context.fail);
            });
        });
        describe("* Mocked function", function () {
            var done, err;
            before(function (cb) {
                var lambdalocal = require("../lib/lambdalocal.js");
                lambdalocal.setLogger(winston);
                var lambdaFunc = require("./functs/test-func-mocking.js");
                sinon.mock(lambdaFunc).expects("getData").returns("MockedData");
                lambdalocal.execute({
                    event: require(path.join(__dirname, "./events/test-event.js")),
                    lambdaFunc: lambdaFunc,
                    lambdaHandler: functionName,
                    callbackWaitsForEmptyEventLoop: false,
                    timeoutMs: timeoutMs,
                    callback: function (_err, _done) {
                        err = _err;
                        done = _done;
                        cb();
                    }
                });
            });
            describe("# LambdaLocal", function () {
                it("should return mocked value", function () {
                    assert.equal(done, "MockedData");
                });
            });
        });
    });
    
    describe('* Promised Run', function () {
        it('should return correct values as promise', function () {
            var lambdalocal = require("../lib/lambdalocal.js");
            lambdalocal.setLogger(winston);
            return lambdalocal.execute({
                event: require(path.join(__dirname, "./events/test-event.js")),
                lambdaPath: path.join(__dirname, "./functs/test-func.js"),
                lambdaHandler: functionName,
                callbackWaitsForEmptyEventLoop: false,
                timeoutMs: timeoutMs
            }).then(function (data) {
                assert.equal(data.result, "testvar");
            });
        });
    })
});
