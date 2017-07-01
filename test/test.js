"use strict";

//Move to ./test if not already in it
var path = require("path");
if (process.cwd().split(path.sep).pop() != "test"){
    process.chdir("test");
}

var assert = require("chai").assert;
var path = require("path");
var fs = require("fs");

var functionName = "handler";
var timeoutMs = 3000;

var sinon = require("sinon");

var winston = require("winston");
winston.level = "error";

//Utils
function get_shell(data){
    if (process.platform == "win32"){
        return ["cmd", ["/C", data]];
    } else {
        if (data.startsWith("node")){
            return ["node", data.slice(5).split(" ")];
        }
        return ["node", [data]];
    }
}

//Tests

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
                },
                envfile: path.join(__dirname, "./other/env")
            });
        });
        describe("# Environment Variables", function () {
            it("should return correct environment variables", function () {
                assert.equal(process.env.envkey1, "Environment");
                assert.equal(process.env.envkey2, {"k":"v"});
                assert.equal(process.env.envkey3, 123);

                // from envfile
                assert.equal(process.env.envkey4, 'foo');
                assert.equal(process.env.envkey5, 'bar');
            });
        });


        describe("# AWS credentials", function () {
            it("should return correct credentials", function () {
                assert.equal(process.env.AWS_ACCESS_KEY_ID, "AKIAIOSFODNN7EXAMPLE");
                assert.equal(process.env.AWS_SECRET_ACCESS_KEY, "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY");
                assert.equal(process.env.AWS_SESSION_TOKEN, "TOKEN44545");
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
        describe("* Test timeout", function () {
            it("should throw TimeoutError", function (cb) {
                assert.throws(function(){
                    var lambdalocal = require("../lib/lambdalocal.js");
                    lambdalocal.setLogger(winston);
                    var lambdaFunc = require("./functs/test-func-timeout.js");
                    lambdalocal.execute({
                        event: require(path.join(__dirname, "./events/test-event.js")),
                        lambdaFunc: lambdaFunc,
                        lambdaHandler: functionName,
                        callbackWaitsForEmptyEventLoop: false,
                        timeoutMs: 1000,
                        callback: function (_err, _done) {
                            cb();
                        }
                    }, utils.TimeoutError);
                })
                cb();
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

describe("- Testing bin/lambda-local", function () {
    var spawnSync = require('child_process').spawnSync;
    describe("* Basic Run", function () {
        it("should end normally", function () {
            var command = get_shell("node ../bin/lambda-local -l ./functs/test-func.js -e ./events/test-event.js");
            var r = spawnSync(command[0], command[1]);
            assert.equal(r.status, 0);
            console.log(r.output);
            console.log(r.stderr.toString('utf8'));
        });
    });
    describe("* Failing Run", function () {
        it("should fail", function () {
            var command = get_shell("node ../bin/lambda-local -l ./functs/test-func-fail.js -e ./events/test-event.js");
            var r = spawnSync(command[0], command[1]);
            assert.equal(r.status, 1);
        });
    });
    describe("* Timeout Run", function () {
        it("should end arbruptly", function () {
            var command = get_shell("node ../bin/lambda-local -l ./functs/test-func-timeout.js -e ./events/test-event.js -t 1");
            var r = spawnSync(command[0], command[1]);
            assert.equal(r.status, 1);
        });
    });
});
