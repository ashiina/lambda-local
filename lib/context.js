'use strict';

/*
 * Lambda's Context object.
 * Refer to this documentation:
 * https://docs.aws.amazon.com/en_us/lambda/latest/dg/nodejs-prog-model-context.html
 */

const utils = require('./utils.js'),
      mute = require('mute');

var logger,
	unmute,
    verboseLevel,
    finalCallback;

/*
 * doneStatus & postDone were minimum; probably defined internally in Lambda.
 */
var doneStatus = false;
var postDone = function(error, message) {};

/*
 * Used to determine the getRemainingTimeInMillis()
 */
var startTime;
var timeout;

function Context() {}

/*
 * exports
 */
module.exports = Context;

/*
 * Context object properties
 */
Context.callbackWaitsForEmptyEventLoop = true;
Context.functionName = '';
Context.functionVersion = '1';
Context.invokedFunctionArn = 'a';
Context.memoryLimitInMB = 1;
Context.awsRequestId = '';
Context.logGroupName = 'a';
Context.logStreamName = null;
Context.identity = null;
Context.clientContext = null;

/*
 * callback function called after done
 */
Context.callback = function(result) {
    return result;
};

/*
 * create random invokeid.
 * Assuming that invokeid follows the format:
 * 8hex-4hex-4hex-4hex-12hex
 */
Context.createInvokeId = (function() {
    return [
        utils.generateRandomHex(8),
        utils.generateRandomHex(4),
        utils.generateRandomHex(4),
        utils.generateRandomHex(4),
        utils.generateRandomHex(12)
    ].join('-');
})();

/*
 * Context initialization.
 * Called from lambda-local
 */
Context._initialize = function(options) {
    /* set time */
    startTime = new Date().getTime();
    timeout = options.timeoutMs;
    
    logger = options.logger;
    verboseLevel = options.verboseLevel;
    finalCallback = options.finalCallback;

    /* set function name */
    Context.functionName = options.functionName;

    /* set requestid */
    Context.awsRequestId = options.awsRequestId;

    /* Set callbackWaitsForEmptyEventLoop */
    Context.callbackWaitsForEmptyEventLoop = options.callbackWaitsForEmptyEventLoop;
    
    logger.log('info', 'START RequestId: ' + Context.awsRequestId);
    if (verboseLevel < 3){
        unmute = mute();
    }
    return;
};

/* Internal usage: timer handle */
Context._timeout = null;

/*
 * This `done` method is directly extracted from source.
 */
Context.done = function(err, message) {
    clearTimeout(Context._timeout);
    if(unmute != null) {
      unmute();
      unmute = null;
    }

    if(err instanceof Error){
        //http://docs.aws.amazon.com/en_en/lambda/latest/dg/nodejs-prog-mode-exceptions.html
        var _stack = err.stack.split("\n");
        _stack.shift();
        for (var i =0; i < _stack.length; i++){_stack[i] = _stack[i].trim().substr(3);}
        err = {
          "errorMessage": err.message,
          "errorType": err.name,
          "stackTrace": _stack
        };
    }

    if (err !== null && typeof err !== 'undefined') {
        logger.log('error', 'End - Error');
        logger.log('error', '------');
        utils.outputJSON(err, verboseLevel == 1 ? console : logger, 'error');
        logger.log('error', '------');
    } else {
        logger.log('info', 'End - Message');
        logger.log('info', '------');
        utils.outputJSON(message, verboseLevel == 1 ? console : logger, 'info');
        logger.log('info', '------');
    }
    /*
    # TODO
    The following method should only be called if 'Context.callbackWaitsForEmptyEventLoop' is False
    Otherwise, it should wait for an empty loop then call it.
    */
    Context.callback(err, message);
    finalCallback();
};

/*
 * `fail` method calls the `done` method
 */
Context.fail = function(err) {
    Context.done(err);
};

/*
 * `succeed` method calls the `done` method
 */
Context.succeed = function(message) {
    Context.done(null, message);
};

/*
 * 'getRemainingTimeInMillis' method return time before task is killed
 */
Context.getRemainingTimeInMillis = function() {
    var now = new Date().getTime();
    return (timeout + startTime - now);
};
