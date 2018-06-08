'use strict';

/*
 * Lambda's Context object.
 * Refer to this documentation:
 * https://docs.aws.amazon.com/en_us/lambda/latest/dg/nodejs-prog-model-context.html
 */

const utils = require('./utils.js'),
      mute = require('mute');

function Context() {
    this.logger = null;
    this.unmute = null;
    this.verboseLevel = null;
    this.finalCallback = null;
    /*
     * doneStatus & postDone were minimum; probably defined internally in Lambda.
     */
    this.doneStatus = false;
    this.postDone = function(error, message) {};
    /*
     * Used to determine the getRemainingTimeInMillis()
     */
    this.startTime;
    this.timeout;
    /* Internal usage: timer handle */
    this._timeout;
    /*
     * Context object properties
     */
    this.callbackWaitsForEmptyEventLoop = true;
    this.functionName = '';
    this.functionVersion = '1';
    this.invokedFunctionArn = 'a';
    this.memoryLimitInMB = 1;
    this.awsRequestId = '';
    this.logGroupName = 'a';
    this.logStreamName = null;
    this.identity = null;
    this.clientContext = null;

    /*
     * callback function called after done
     */
    this.callback = function(result) {
        return result;
    };
}


/*
 * create random invokeid.
 * Assuming that invokeid follows the format:
 * 8hex-4hex-4hex-4hex-12hex
 */
const createInvokeId = function() {
    return [
        utils.generateRandomHex(8),
        utils.generateRandomHex(4),
        utils.generateRandomHex(4),
        utils.generateRandomHex(4),
        utils.generateRandomHex(12)
    ].join('-');
}

/*
 * Context initialization.
 * Called from lambdalocal.js
 */
Context.prototype._initialize = function(options) {
    /* set time */
    this.startTime = new Date().getTime();
    this.timeout = options.timeoutMs;
    
    this.logger = options.logger;
    this.verboseLevel = options.verboseLevel;
    this.finalCallback = options.finalCallback;

    /* set function name */
    this.functionName = options.functionName;

    /* set requestid */
    this.awsRequestId = createInvokeId();

    /* Set callbackWaitsForEmptyEventLoop */
    this.callbackWaitsForEmptyEventLoop = options.callbackWaitsForEmptyEventLoop;
    
    this.logger.log('info', 'START RequestId: ' + this.awsRequestId);
    if (this.verboseLevel < 3){
        this.unmute = mute();
    }
    return;
};

/*
 * Timeout initialization.
 * Called from lambdalocal.js 
 */
Context.prototype._init_timeout = function(){
    /* Handling timeout */
    this._timeout = setTimeout((function() {
        throw new utils.TimeoutError('Task timed out after ' + (this.timeout / 1000).toFixed(2) + ' seconds');
    }).bind(this), this.timeout);
}

/*
 * Util function used in lambdalocal.js to get parameters for the handler
 */
Context.prototype.generate_context = function(){
    //https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html
    var ctx = {
        //FUNCTIONS
        done: this.done.bind(this),
        fail: this.fail.bind(this),
        succeed: this.succeed.bind(this),
        getRemainingTimeInMillis: this.getRemainingTimeInMillis.bind(this),
        //VARS
        callbackWaitsForEmptyEventLoop: this.callbackWaitsForEmptyEventLoop,
        functionName: this.functionName,
        functionVersion: this.functionVersion,
        invokedFunctionArn: this.invokedFunctionArn,
        memoryLimitInMB: this.memoryLimitInMB,
        awsRequestId: this.awsRequestId,
        logGroupName: this.logGroupName,
        logStreamName: this.logStreamName,
        identity: this.identity,
        clientContext: this.clientContext
    };
    return ctx;
}

/*
 * This `done` method is directly extracted from source.
 */
Context.prototype.done = function(err, message) {
    clearTimeout(this._timeout);
    if(this.unmute != null) {
        this.unmute();
        this.unmute = null;
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
        this.logger.log('error', 'End - Error');
        this.logger.log('error', '------');
        utils.outputJSON(err, this.verboseLevel == 1 ? console : this.logger, 'error');
        this.logger.log('error', '------');
    } else {
        this.logger.log('info', 'End - Message');
        this.logger.log('info', '------');
        utils.outputJSON(message, this.verboseLevel == 1 ? console : this.logger, 'info');
        this.logger.log('info', '------');
    }
    this.callback(err, message);
    /*
    # TODO
    The following method should only be called if 'this.callbackWaitsForEmptyEventLoop' is False
    Otherwise, it should wait for an empty loop then call it.
    */
    this.finalCallback();
}

/*
 * `fail` method calls the `done` method
 */
Context.prototype.fail = function(err) {
    this.done(err);
};

/*
 * `succeed` method calls the `done` method
 */
Context.prototype.succeed = function(message) {
    this.done(null, message);
};

/*
 * 'getRemainingTimeInMillis' method return time before task is killed
 */
Context.prototype.getRemainingTimeInMillis = function() {
    var now = new Date().getTime();
    return (this.timeout + this.startTime - now);
};

/*
 * exports
 */
module.exports = Context;
