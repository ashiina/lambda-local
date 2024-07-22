"use strict";

//Move to ./test if not already in it
var path = require("path");
if (process.cwd().split(path.sep).pop() != "test") {
    process.chdir("test");
}

var assert = require("chai").assert;
var path = require("path");
var fs = require("fs");

var functionName = "handler";
var timeoutMs = 3000;
var utils = require("../build/lib/utils.js");
const lambdalocal_path = "../build/lambdalocal.js"

var sinon = require("sinon");

var winston = utils.getWinstonConsole();
winston.level = "error";

//Utils
function get_shell(data) {
    if (process.platform == "win32") {
        return ["cmd", ["/C", data]];
    } else {
        if (data.startsWith("node")) {
            return ["node", data.slice(5).split(" ")];
        }
        return ["node", [data]];
    }
}

function process_outputs(r) {
    r.output = r.output.toString('utf8').slice(1, -1);
    r.stderr = r.stderr.toString('utf8').slice(1, -1);
}

function get_node_major_version() {
    return parseInt(process.version.slice(1).split('.')[0]);
}

//Tests

describe("- Testing utils.js", function () {
    describe("* getAbsolutePath", function () {
        it("should return existing path file", function () {
            var f_path = utils.getAbsolutePath("./test.js");
            assert.doesNotThrow(function () { fs.accessSync(f_path, fs.F_OK) });
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
    var lambdalocal = require(lambdalocal_path);
    describe("* Use winston logger", function () {
        it("should correctly load Logger", function () {
            lambdalocal.setLogger(winston);
            var logger = lambdalocal.getLogger();
            assert.equal(winston, logger);
        });
    });
    describe("* Use invalid logger (object)", function () {
        it("should ignore call", function () {
            lambdalocal.setLogger(Object);
            var logger = lambdalocal.getLogger();
            assert.equal(logger, winston);
        });
    });
    describe("* Use null logger", function () {
        it("should ignore call", function () {
            lambdalocal.setLogger(null);
            var logger = lambdalocal.getLogger();
            assert.equal(logger, winston);
        });
    });
});

var firstawsRequestId;

describe("- Testing lambdalocal.js", function () {
    describe("* Basic Run", function () {
        var done, err, clientContext;
        before(function (cb) {
            // For this test: set an environment var which should not be overwritten by lambda-local
            process.env["AWS_REGION"] = "unicorn-universe";
            clientContext = { "cc1": "xxx" };
            // Values that are used in context
            process.env["AWS_LAMBDA_FUNCTION_MEMORY_SIZE"] = "1024";
            //
            var lambdalocal = require(lambdalocal_path);
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
                    "envkey2": { "k": "v" },
                    "envkey3": 123
                },
                envfile: path.join(__dirname, "./other/env"),
                verboseLevel: 1,
                clientContext: JSON.stringify(clientContext),
            });
        });

        describe("# Environment Variables", function () {
            it("should have automatic env built correctly", function () {
                assert.equal(process.env._HANDLER, 'test-func.' + functionName);
                assert.equal(process.env.TZ, Intl.DateTimeFormat().resolvedOptions().timeZone);
                assert.equal(process.env.LAMBDA_TASK_ROOT, path.join(__dirname, "./functs"));
                assert.isOk(fs.existsSync(process.env.LAMBDA_RUNTIME_DIR));
            });
            it("should return correct environment variables", function () {
                assert.equal(process.env.envkey1, "Environment");
                assert.equal(process.env.envkey2, { "k": "v" });
                assert.equal(process.env.envkey3, 123);

                // from envfile
                assert.equal(process.env.envkey4, 'foo');
                assert.equal(process.env.envkey5, 'bar');
            });
            it("should not have overwritten already-existing env vars", function () {
                assert.equal(process.env.AWS_REGION, "unicorn-universe");
            });
            after(function (cb) {
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
            it("should contain initialized invokedFunctionArn", function () {
                var arn = new RegExp("arn:aws:lambda:unicorn-universe:\\d+:function:" + functionName + ":1.0");
                assert.match(done.context.invokedFunctionArn, arn);
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
            it("should contain clientContext", function () {
                assert.deepEqual(done.context.clientContext, clientContext);
            });
            it("should have populated memoryLimitInMB from env", function () {
                assert.equal(done.context.memoryLimitInMB, "1024");
            })
        });
    });
    describe("* Second run (with profile)", function () {
        var done, err, clientContext;
        before(function (cb) {
            var lambdalocal = require(lambdalocal_path);
            lambdalocal.setLogger(winston);
            clientContext = { "cc2": "yyy" };
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
                    "isnetestlambda": "I should not exist"
                },
                envdestroy: true,
                envfile: path.join(__dirname, "./other/env"),
                verboseLevel: 1,
                clientContext: clientContext,
            });
        });
        describe("# Context object", function () {
            it("should also contain clientContext", function () {
                assert.deepEqual(done.context.clientContext, clientContext);
            });
        });
        describe("# Environment Variables (destroy)", function () {
            it("environment should have been deleted", function () {
                assert.equal(("isnetestlambda" in process.env), false);
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
    });
    describe("* Mocked function", function () {
        var done, err;
        before(function (cb) {
            var lambdalocal = require(lambdalocal_path);
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
            var lambdalocal = require(lambdalocal_path);
            lambdalocal.setLogger(winston);
            var lambdaFunc = require("./functs/test-func-timeout.js");
            lambdalocal.execute({
                event: require(path.join(__dirname, "./events/test-event.js")),
                lambdaFunc: lambdaFunc,
                lambdaHandler: functionName,
                callbackWaitsForEmptyEventLoop: false,
                timeoutMs: 500,
                callback: function (err, done) {
                    assert.equal(err.errorType, "TimeoutError");
                    assert.equal(err.errorMessage, "Task timed out after 0.50 seconds");
                    cb();
                },
                verboseLevel: 1
            });
        });
    });
    describe("* Return Error object", function () {
        it("should convert it to correct JSON format", function (cb) {
            var lambdalocal = require(lambdalocal_path);
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
                    assert.ok(err.stackTrace.some(function (x) { return x.includes("test-func-cb-error.js:5"); }));
                    cb();
                },
                verboseLevel: 1
            });
        });
    });
    describe('* Context overwrite', function () {
        it("Should overwrite context", function(cb){
            var lambdalocal = require(lambdalocal_path);
            lambdalocal.execute({
                event: require(path.join(__dirname, "./events/test-event.js")),
                lambdaPath: path.join(__dirname, "./functs/test-func.js"),
                lambdaHandler: functionName,
                contextOverwrite: function (ctx){
                    ctx.awsRequestId = "test id";
                    ctx.functionName = "test function";
                },
                callback: function (err, done) {
                    assert.equal(done.result, "testvar");
                    assert.equal(done.context.awsRequestId, "test id");
                    assert.equal(done.context.functionName, "test function");
                    cb();
                }
            });
        });
    });
    describe('* Nested Run', function () {
        it("Should handle nested calls properly (context singleton)", function (cb) {
            var lambdalocal = require(lambdalocal_path);
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
    describe('* Synchronous return', function () {
        it('should return null', function () {
            var lambdalocal = require(lambdalocal_path);
            lambdalocal.setLogger(winston);
            return lambdalocal.execute({
                event: require(path.join(__dirname, "./events/test-event.js")),
                lambdaPath: path.join(__dirname, "./functs/test-func-synchronous.js"),
                lambdaHandler: functionName,
                callbackWaitsForEmptyEventLoop: false,
                timeoutMs: timeoutMs,
                verboseLevel: 1
            }).then(data => {
                assert.isNull(data)
            })
        });
    });
    if (get_node_major_version() >= 2) {
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
                var lambdalocal = require(lambdalocal_path);
                lambdalocal.setLogger(winston);
                return lambdalocal.execute(opts).then(function (data) {
                    assert.equal(data.result, "testvar");
                });
            });
            it('should call onInvocationEnd', function () {
                var lambdalocal = require(lambdalocal_path);
                lambdalocal.setLogger(winston);
                let invocationEnded = 0
                opts.onInvocationEnd = () => invocationEnded++
                return lambdalocal.execute(opts).then(function (data) {
                    assert.equal(data.result, "testvar");
                    assert.equal(invocationEnded, 1)
                });
            });
            it('should be stateless', function () {
                var lambdalocal = require(lambdalocal_path);
                lambdalocal.setLogger(winston);
                return lambdalocal.execute(opts).then(function (data) {
                    assert.equal(data.result, "testvar");
                });
            });
        });
    }
    if (get_node_major_version() >= 8) {
        describe('* Async Run', function () {
            it('should understand direct return in async functions', function () {
                var lambdalocal = require(lambdalocal_path);
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
                var lambdalocal = require(lambdalocal_path);
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
                var lambdalocal = require(lambdalocal_path);
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

        describe('* Streaming Response', function () {
            it('should return a readable stream as `body`', function () {
                var lambdalocal = require(lambdalocal_path);
                lambdalocal.setLogger(winston);
                let invocationEnded = 0
                return lambdalocal.execute({
                    event: require(path.join(__dirname, "./events/test-event.js")),
                    lambdaPath: path.join(__dirname, "./functs/test-func-streaming.js"),
                    lambdaHandler: functionName,
                    callbackWaitsForEmptyEventLoop: false,
                    timeoutMs: timeoutMs,
                    verboseLevel: 1,
                    onInvocationEnd() {
                        invocationEnded++
                    }
                }).then(function (data) {
                    assert.deepEqual(
                        data.headers,
                        { "Content-Type": "text/plain", "X-Foo": "Bar" }
                    );

                    return new Promise((resolve, reject) => {
                        const chunks = []
                        const times = []
                        data.body.on('data', (chunk) => {
                            chunks.push(chunk.toString())
                            times.push(Date.now())
                        });
                        data.body.on("end", () => {
                            assert.deepEqual(chunks, ["foo", "bar"])
                            assert.closeTo(times[1] - times[0], 100, 50)

                            assert.equal(invocationEnded, 0)

                            setTimeout(() => {
                                assert.equal(invocationEnded, 1)    
                                resolve()
                            }, 200)
                        });
                    })
                })
            });

            it('also works without calling HttpResponseStream.from', function () {
                var lambdalocal = require(lambdalocal_path);
                lambdalocal.setLogger(winston);
                return lambdalocal.execute({
                    event: require(path.join(__dirname, "./events/test-event.js")),
                    lambdaPath: path.join(__dirname, "./functs/test-func-streaming-simple.js"),
                    lambdaHandler: functionName,
                    callbackWaitsForEmptyEventLoop: false,
                    timeoutMs: timeoutMs,
                    verboseLevel: 1
                }).then(function (data) {
                    return new Promise((resolve, reject) => {
                        const chunks = []
                        const times = []
                        data.body.on('data', (chunk) => {
                            chunks.push(chunk.toString())
                            times.push(Date.now())
                        });
                        data.body.on("end", () => {
                            assert.deepEqual(chunks, ["foo", "bar"])
                            assert.closeTo(times[1] - times[0], 100, 50)
                            resolve()
                        });
                    })
                })
            });
        });
    }
    if (get_node_major_version() >= 12) {
        describe('* Loading ECMAScript module', function () {
            it('should load ECMAScript lambda module successfully', function () {
                var lambdalocal = require(lambdalocal_path);
                lambdalocal.setLogger(winston);
                return lambdalocal.execute({
                    event: require(path.join(__dirname, "./events/test-event.js")),
                    lambdaPath: path.join(__dirname, "./functs/test-func-esm.mjs"),
                    lambdaHandler: functionName,
                    esm: true,
                    callbackWaitsForEmptyEventLoop: false,
                    timeoutMs: timeoutMs,
                    verboseLevel: 1
                }).then(function (data) {
                    assert.equal(data.result, "testvar")
                })
            })
        })
    }
});
describe("- Testing cli.js", function () {
    var spawnSync = require('child_process').spawnSync;
    var spawnAsync = require('child_process').spawn;
    describe("* Basic Run", function () {
        it("should end normally", function () {
            var command = get_shell("node ../build/cli.js -l ./functs/test-func.js -e ./events/test-event.js");
            var r = spawnSync(command[0], command[1]);
            process_outputs(r);
            assert.equal(r.status, 0);
            console.log(r.output);
            console.log(r.stderr);
        });

        it("should end normally: callback null", function () {
            var command = get_shell("node ../build/cli.js -l ./functs/test-func-cb-null.js -e ./events/test-event.js");
            var r = spawnSync(command[0], command[1]);
            process_outputs(r);
            assert.equal(r.status, 0);
            console.log(r.output);
            console.log(r.stderr);
        });

        it("should end normally: callback undefined", function () {
            var command = get_shell("node ../build/cli.js -l ./functs/test-func-cb-undefined.js -e ./events/test-event.js");
            var r = spawnSync(command[0], command[1]);
            process_outputs(r);
            assert.equal(r.status, 0);
            console.log(r.output);
            console.log(r.stderr);
        });
    });

    describe("* Failing Run", function () {
        it("should fail: context", function () {
            var command = get_shell("node ../build/cli.js -l ./functs/test-func-fail.js -e ./events/test-event.js");
            var r = spawnSync(command[0], command[1]);
            process_outputs(r);
            assert.equal(r.status, 1);
            console.log(r.output);
        });

        it("should fail: callback string", function () {
            var command = get_shell("node ../build/cli.js -l ./functs/test-func-cb-fail.js -e ./events/test-event.js");
            var r = spawnSync(command[0], command[1]);
            process_outputs(r);
            assert.equal(r.status, 1);
            console.log(r.output);
        });

        it("should fail: callback empty string", function () {
            var command = get_shell("node ../build/cli.js -l ./functs/test-func-cb-empty.js -e ./events/test-event.js");
            var r = spawnSync(command[0], command[1]);
            process_outputs(r);
            assert.equal(r.status, 1);
            console.log(r.output);
        });

        it("should fail: callback false", function () {
            var command = get_shell("node ../build/cli.js -l ./functs/test-func-cb-false.js -e ./events/test-event.js");
            var r = spawnSync(command[0], command[1]);
            process_outputs(r);
            assert.equal(r.status, 1);
            console.log(r.output);
        });

        it("should fail: callback 0", function () {
            var command = get_shell("node ../build/cli.js -l ./functs/test-func-cb-0.js -e ./events/test-event.js");
            var r = spawnSync(command[0], command[1]);
            process_outputs(r);
            assert.equal(r.status, 1);
            console.log(r.output);
        });

        it("should fail: syntax error", function () {
            var command = get_shell("node ../build/cli.js -l ./functs/test-func-syntax-error.js -e ./events/test-event.js");
            var r = spawnSync(command[0], command[1]);
            process_outputs(r);
            assert.equal(r.status, 1);
            console.log(r.output);
        });

        it("should fail: require error", function () {
            var command = get_shell("node ../build/cli.js -l ./functs/test-func-require-error.js -e ./events/test-event.js");
            var r = spawnSync(command[0], command[1]);
            process_outputs(r);
            assert.equal(r.status, 1);
            console.log(r.output);
        });

        it("should fail: esm with unsupported watch mode", function () {
            var command = get_shell("node ../build/cli.js -l ./functs/test-func-esm.mjs --esm --watch");
            var r = spawnSync(command[0], command[1]);
            process_outputs(r);
            assert.equal(r.status, 1);
            console.log(r.output);
        })
    });

    describe("* Environment test run", function () {
        it("event should have used ENV while building", function () {
            var command = get_shell("node ../build/cli.js -l ./functs/test-func-env.js -e ./events/test-event-env.js -v 1 --envdestroy -E {\"TEST_HUBID\":\"potato\"}");
            var r = spawnSync(command[0], command[1]);
            process_outputs(r);
            assert.equal(r.status, 0);
            console.log(r.output);
            //test included in test-func-env.js
            assert.equal(!("TEST_HUBID" in process.env), true);
        });
    });

    if (get_node_major_version() >= 18) {
        // we use fetch() (nodejs>=18) to not bother.
        const doRequestWhenReady = function(r, event, check, cb) {
            var result;
            r.stdout.on('data', (data) => {
                data = data.toString();
                if (data.includes("listening on")) {
                    // started
                    fetch("http://localhost:8008", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify(event),
                    }).then((res) => {
                        res.json().then((datres) => {
                            result = datres;
                            r.kill('SIGINT');
                        });
                    });
                }
            });
            r.on('error', (err) => {
                cb(err);
            });
            r.on('close', () => {
                check(result);
                cb();
            });
            // add timeout
            setTimeout(() => {
                r.kill();
            }, 1000);
        }
        describe("* --watch run", function () {
            it("test watch with old event format", function (cb) {
                var command = get_shell("node ../build/cli.js -l ./functs/test-func-echo.js --watch");
                var r = spawnAsync(command[0], command[1]);
                doRequestWhenReady(r,
                    {
                        "event": {"hey": "data"}
                    },
                    (result) => {
                        assert.deepEqual(result, {"hey": "data"});
                    },
                    cb
                );
            });
            it("test watch with gateway event format", function (cb) {
                var command = get_shell("node ../build/cli.js -l ./functs/test-func-echo.js --watch");
                var r = spawnAsync(command[0], command[1]);
                doRequestWhenReady(r,
                    {
                        "hey": "data",
                    },
                    (result) => {
                        assert.deepEqual(result["body"], JSON.stringify({"hey": "data"}));
                    },
                    cb
                );
            });
        });
    }

    describe("* Crashing run", function () {
        it("should fail", function () {
            var command = get_shell("node ../build/cli.js -l ./functs/test-func-error.js -e ./events/test-event.js");
            var r = spawnSync(command[0], command[1]);
            assert.equal(r.status, 1);
        });
    });
    describe("* Timeout Run", function () {
        it("should end arbruptly", function () {
            var command = get_shell("node ../build/cli.js -l ./functs/test-func-timeout.js -e ./events/test-event.js -t 1");
            var r = spawnSync(command[0], command[1]);
            process_outputs(r);
            assert.equal(r.status, 1);
            console.log(r.stderr);
        });
    });
    describe("* Not stringifyable run", function () {
        it("should fallback on util.inspect", function () {
            var command = get_shell("node ../build/cli.js -l ./functs/test-func-not-stringifyableoutput.js -e ./events/test-event.js");
            var r = spawnSync(command[0], command[1]);
            process_outputs(r);
            assert.equal(r.status, 0);
            assert.ok((r.output.indexOf("Circular") !== -1), true)
        });
    });
    describe("* Verbose test", function () {
        it("should have no output", function () {
            var command = get_shell("node ../build/cli.js -l ./functs/test-func-print.js -e ./events/test-event.js -v 0");
            var r = spawnSync(command[0], command[1]);
            process_outputs(r);
            assert.equal(r.status, 0);
            assert.equal(r.output, "");
        });
        it("should have only console output", function () {
            var command = get_shell("node ../build/cli.js -l ./functs/test-func-print.js -e ./events/test-event.js -v -1");
            var r = spawnSync(command[0], command[1]);
            process_outputs(r);
            assert.equal(r.status, 0);
            assert.equal(r.output, "Function running :)\n");
        });
    });
    if (get_node_major_version() >= 16) {
        describe("* Test --wait-empty-event-loop", function () {
            it("should wait for all timeouts to end", function () {
                var command = get_shell("node ../build/cli.js  -l ./functs/test-func-waitemptyloop.js -e ./events/test-event.js --wait-empty-event-loop");
                var r = spawnSync(command[0], command[1]);
                process_outputs(r);
                assert.equal(r.status, 0);
                assert.equal((r.output.indexOf("Timeout finished !") !== -1), true)
            });
        });
    }
    describe("* Test --version", function () {
        var lambdalocal = require(lambdalocal_path);
        it("should match the current latest version", function () {
            var command = get_shell("node ../build/cli.js --version");
            var r = spawnSync(command[0], command[1]);
            process_outputs(r);
            assert.equal(r.status, 0);
            assert.equal(r.output.trim(), lambdalocal.version);
        });
    });
});
