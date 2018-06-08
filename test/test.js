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

function process_outputs(r){
    r.output = r.output.toString('utf8').slice(1, -1);
    r.stderr = r.stderr.toString('utf8').slice(1, -1);
}

function get_node_major_version(){
    return parseInt(process.version.slice(1).split('.')[0]);
}

//Tests

describe("- Testing utils.js", function () {
    var utils = require("../lib/utils.js");
    describe("* getAbsolutePath", function () {
        it("should return existing path file", function () {
            var f_path = utils.getAbsolutePath("./test.js");
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

var firstawsRequestId;

describe("- Testing lambdalocal.js", function () {
    describe("* Basic Run", function () {
        var done, err;
        before(function (cb) {
            //For this test: set an environment var which should not be overwritten by lambda-local
            process.env["AWS_REGION"] = "unicorn-universe";
            //
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
                envfile: path.join(__dirname, "./other/env"),
                verboseLevel: 1
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
            it("should not have overwritten already-existing env vars", function () {
                assert.equal(process.env.AWS_REGION, "unicorn-universe");
            });
            after(function (cb){
                delete process.env["AWS_REGION"];
                cb();
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
                firstawsRequestId = done.context.awsRequestId;
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

        describe("# Environment Variables (destroy)", function () {
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
                        "isnetestlambda": "I should not exist",
                    },
                    envdestroy: true,
                    envfile: path.join(__dirname, "./other/env"),
                    verboseLevel: 1
                });
            });
            it("environment should have been deleted", function () {
                assert.equal(!("isnetestlambda" in process.env), true);
            });
            it("should contain an awsRequestId different from the first one", function () {
                assert.notEqual(done.context.awsRequestId, firstawsRequestId);
            });
        });

        describe("# AWS credentials", function () {
            it("should return correct credentials", function () {
                assert.equal(process.env.AWS_REGION, "not-us-east");
                assert.equal(process.env.AWS_ACCESS_KEY_ID, "AKIAIOSFODNN7EXAMPLE");
                assert.equal(process.env.AWS_SECRET_ACCESS_KEY, "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY");
                assert.equal(process.env.AWS_SESSION_TOKEN, "TOKEN44545");
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
                    },
                    verboseLevel: 1
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
                        },
                        verboseLevel: 1
                    }, utils.TimeoutError);
                });
                cb();
            });
        });
        describe("* Return Error object", function () {
            it("should convert it to correct JSON format", function (cb) {
                var lambdalocal = require("../lib/lambdalocal.js");
                lambdalocal.setLogger(winston);
                var lambdaFunc = require("./functs/test-func-cb-error.js");
                lambdalocal.execute({
                    event: require(path.join(__dirname, "./events/test-event.js")),
                    lambdaFunc: lambdaFunc,
                    lambdaHandler: functionName,
                    callbackWaitsForEmptyEventLoop: false,
                    timeoutMs: 1000,
                    callback: function (err, _done) {
                        assert.equal(err.errorType, "Error");
                        assert.equal(err.errorMessage, "Failed for an unknown reason !");
                        cb();
                    },
                    verboseLevel: 1
                });
            });
        });
    });
    describe('* Nested Run', function () {
        it("Should handle nested calls properly (context singleton)", function (cb) {
            var lambdalocal = require("../lib/lambdalocal.js");
            lambdalocal.setLogger(winston);
            lambdalocal.execute({
                event: require(path.join(__dirname, "./events/test-event.js")),
                lambdaPath: path.join(__dirname, "./functs/test-func.js"),
                lambdaHandler: functionName,
                callbackWaitsForEmptyEventLoop: false,
                timeoutMs: timeoutMs,
                callback: function (err, done) {
                    assert.equal(done.result, "testvar");
                    //Second run
                    lambdalocal.execute({
                        event: require(path.join(__dirname, "./events/test-event.js")),
                        lambdaPath: path.join(__dirname, "./functs/test-func.js"),
                        lambdaHandler: functionName,
                        callbackWaitsForEmptyEventLoop: false,
                        timeoutMs: timeoutMs,
                        callback: function (_err, _done) {
                            assert.equal(_done.result, "testvar");
                            cb();
                        },
                        verboseLevel: 0
                    });
                },
                verboseLevel: 0
            });
        });
    });
    if (get_node_major_version() >= 2){
        describe('* Promised Run', function () {
            var opts = {
                event: require(path.join(__dirname, "./events/test-event.js")),
                lambdaPath: path.join(__dirname, "./functs/test-func.js"),
                lambdaHandler: functionName,
                callbackWaitsForEmptyEventLoop: false,
                timeoutMs: timeoutMs,
                verboseLevel: 1
            }
            it('should return correct values as promise', function () {
                var lambdalocal = require("../lib/lambdalocal.js");
                lambdalocal.setLogger(winston);
                return lambdalocal.execute(opts).then(function (data) {
                    assert.equal(data.result, "testvar");
                });
            });
            it('should be stateless', function () {
                var lambdalocal = require("../lib/lambdalocal.js");
                lambdalocal.setLogger(winston);
                return lambdalocal.execute(opts).then(function (data) {
                    assert.equal(data.result, "testvar");
                });
            });
        });
    }
    if (get_node_major_version() >= 8){
        describe('* Async Run', function () {
            it('should understand direct return in async functions', function () {
                var lambdalocal = require("../lib/lambdalocal.js");
                lambdalocal.setLogger(winston);
                return lambdalocal.execute({
                  event: require(path.join(__dirname, "./events/test-event.js")),
                  lambdaPath: path.join(__dirname, "./functs/test-func-async.js"),
                  lambdaHandler: functionName,
                  callbackWaitsForEmptyEventLoop: false,
                  timeoutMs: timeoutMs,
                  verboseLevel: 1
                }).then(function (data) {
                    assert.equal(data.result, "testvar");
                });
            });
            it('should understand Promise return in functions', function () {
                var lambdalocal = require("../lib/lambdalocal.js");
                lambdalocal.setLogger(winston);
                return lambdalocal.execute({
                  event: require(path.join(__dirname, "./events/test-event.js")),
                  lambdaPath: path.join(__dirname, "./functs/test-func-promise.js"),
                  lambdaHandler: functionName,
                  callbackWaitsForEmptyEventLoop: false,
                  timeoutMs: timeoutMs,
                  verboseLevel: 1
                }).then(function (data) {
                    assert.equal(data.result, "testvar");
                });
            });
            it('should understand Promise rejection in functions', function () {
                var lambdalocal = require("../lib/lambdalocal.js");
                lambdalocal.setLogger(winston);
                return lambdalocal.execute({
                  event: require(path.join(__dirname, "./events/test-event.js")),
                  lambdaPath: path.join(__dirname, "./functs/test-func-promise-fail.js"),
                  lambdaHandler: functionName,
                  callbackWaitsForEmptyEventLoop: false,
                  timeoutMs: timeoutMs,
                  verboseLevel: 1
                }).then(function () {
                    assert.fail('Should not happen');
                }, function (err) {
                    assert.equal(err, "Failed");
                });
            });
        });
    }
});

describe("- Testing bin/lambda-local", function () {
    var spawnSync = require('child_process').spawnSync;
    describe("* Basic Run", function () {
        it("should end normally", function () {
            var command = get_shell("node ../bin/lambda-local -l ./functs/test-func.js -e ./events/test-event.js");
            var r = spawnSync(command[0], command[1]);
            process_outputs(r);
            assert.equal(r.status, 0);
            console.log(r.output);
            console.log(r.stderr);
        });

        it("should end normally: callback null", function () {
            var command = get_shell("node ../bin/lambda-local -l ./functs/test-func-cb-null.js -e ./events/test-event.js");
            var r = spawnSync(command[0], command[1]);
            process_outputs(r);
            assert.equal(r.status, 0);
            console.log(r.output);
            console.log(r.stderr);
        });

        it("should end normally: callback undefined", function () {
            var command = get_shell("node ../bin/lambda-local -l ./functs/test-func-cb-undefined.js -e ./events/test-event.js");
            var r = spawnSync(command[0], command[1]);
            process_outputs(r);
            assert.equal(r.status, 0);
            console.log(r.output);
            console.log(r.stderr);
        });
    });

    describe("* Failing Run", function () {
        it("should fail: context", function () {
            var command = get_shell("node ../bin/lambda-local -l ./functs/test-func-fail.js -e ./events/test-event.js");
            var r = spawnSync(command[0], command[1]);
            process_outputs(r);
            assert.equal(r.status, 1);
            console.log(r.output);
        });

        it("should fail: callback string", function () {
            var command = get_shell("node ../bin/lambda-local -l ./functs/test-func-cb-fail.js -e ./events/test-event.js");
            var r = spawnSync(command[0], command[1]);
            process_outputs(r);
            assert.equal(r.status, 1);
            console.log(r.output);
        });

        it("should fail: callback empty string", function () {
            var command = get_shell("node ../bin/lambda-local -l ./functs/test-func-cb-empty.js -e ./events/test-event.js");
            var r = spawnSync(command[0], command[1]);
            process_outputs(r);
            assert.equal(r.status, 1);
            console.log(r.output);
        });

        it("should fail: callback false", function () {
            var command = get_shell("node ../bin/lambda-local -l ./functs/test-func-cb-false.js -e ./events/test-event.js");
            var r = spawnSync(command[0], command[1]);
            process_outputs(r);
            assert.equal(r.status, 1);
            console.log(r.output);
        });

        it("should fail: callback 0", function () {
            var command = get_shell("node ../bin/lambda-local -l ./functs/test-func-cb-0.js -e ./events/test-event.js");
            var r = spawnSync(command[0], command[1]);
            process_outputs(r);
            assert.equal(r.status, 1);
            console.log(r.output);
        });

        it("should fail: syntax error", function () {
            var command = get_shell("node ../bin/lambda-local -l ./functs/test-func-syntax-error.js -e ./events/test-event.js");
            var r = spawnSync(command[0], command[1]);
            process_outputs(r);
            assert.equal(r.status, 1);
            console.log(r.output);
        });

        it("should fail: require error", function () {
            var command = get_shell("node ../bin/lambda-local -l ./functs/test-func-require-error.js -e ./events/test-event.js");
            var r = spawnSync(command[0], command[1]);
            process_outputs(r);
            assert.equal(r.status, 1);
            console.log(r.output);
        });
    });

    describe("* Environment test run", function () {
        it("event should have used ENV while building", function () {
            var command = get_shell("node ../bin/lambda-local -l ./functs/test-func-env.js -e ./events/test-event-env.js -v 1 --envdestroy -E {\"TEST_HUBID\":\"potato\"}");
            var r = spawnSync(command[0], command[1]);
            process_outputs(r);
            assert.equal(r.status, 0);
            console.log(r.output);
            //test included in test-func-env.js
            assert.equal(!("TEST_HUBID" in process.env), true);
        });
    });

    describe("* Crashing run", function () {
        it("should fail", function () {
            var command = get_shell("node ../bin/lambda-local -l ./functs/test-func-error.js -e ./events/test-event.js");
            var r = spawnSync(command[0], command[1]);
            assert.equal(r.status, 1);
        });
    });
    describe("* Timeout Run", function () {
        it("should end arbruptly", function () {
            var command = get_shell("node ../bin/lambda-local -l ./functs/test-func-timeout.js -e ./events/test-event.js -t 1");
            var r = spawnSync(command[0], command[1]);
            process_outputs(r);
            assert.equal(r.status, 1);
            console.log(r.stderr);
        });
    });
    describe("* Verbose test", function () {
        it("should have no output", function () {
            var command = get_shell("node ../bin/lambda-local -l ./functs/test-func-print.js -e ./events/test-event.js -v 0");
            var r = spawnSync(command[0], command[1]);
            process_outputs(r);
            assert.equal(r.status, 0);
            assert.equal(r.output, "")
        });
    });
});
