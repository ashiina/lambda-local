'use strict';

/*
 * Lambda's Context object.
 * Refer to this documentation:
 * https://docs.aws.amazon.com/en_us/lambda/latest/dg/nodejs-prog-model-context.html
 */

var logger = require('winston');
var dotenv = require('dotenv');

const mute = require('mute'),
    utils = require('./utils.js'),
    _context = require('./context.js');

var _setLogger = (_logger) => {
    if (_logger !== null && typeof _logger.transports !== 'undefined') {
        logger = _logger;
    } else {
        console.warn("Invalid logger object ! Using default logger");
    }
}

var _getLogger = () => {
    return logger;
}

var _execute = function(opts) {
    if (opts.callback) {
        _executeSync.apply(this, [opts]);
    } else {
        var that = this;
        return new Promise((resolve, reject) => {
            opts.callback = (_err, _done) => {
                if (_err) {
                    reject(_err);
                }
                resolve(_done);
            };
            _executeSync.apply(that, [opts]);
        });
    }
};

var _executeSync = function(opts) {
    var event = opts.event,
        lambdaFunc = opts.lambdaFunc,
        lambdaPath = opts.lambdaPath,
        lambdaHandler = opts.lambdaHandler || 'handler',
        profilePath = opts.profilePath,
        profileName = opts.profileName,
        region = opts.region || 'us-east-1',
        environment = opts.environment,
        envfile = opts.envfile,
        callbackWaitsForEmptyEventLoop = opts.callbackWaitsForEmptyEventLoop || true,
        timeoutMs = opts.timeoutMs || 3000,
        muteLogs = opts.mute,
        unmute = null,
        callback = opts.callback;

    if (lambdaFunc && lambdaPath) {
        throw new SyntaxError("Cannot specify both lambdaFunc and lambdaPath !");
    }

    if (muteLogs) {
        unmute = mute();
    }

    //load profile
    if (profilePath) {
        utils.loadAWSCredentials(profilePath, profileName);
    }

    // load event & context
    var context = this.context;

    context._initialize({
        functionName: lambdaHandler,
        awsRequestId: context.createInvokeId,
        timeoutMs: timeoutMs,
        callbackWaitsForEmptyEventLoop: callbackWaitsForEmptyEventLoop,
        unmute: unmute,
        logger: logger
    });

    // set environment variables before the require
    process.env['AWS_REGION'] = region;
    process.env['LAMBDA_TASK_ROOT'] = process.cwd();
    process.env['NODE_PATH'] = utils.getAbsolutePath('node_modules');
    process.env['LAMBDA_CONSOLE_SOCKET'] = 14;
    process.env['LAMBDA_CONTROL_SOCKET'] = 11;

    // custom environment variables
    if (environment != null) {
        Object.keys(environment).forEach((key) => {
            process.env[key] = environment[key];
        });
    }

    // custom environment variables file
    if (envfile != null) {
        dotenv.config({ path: envfile });
    }

    // load lambda function
    if (!(lambdaFunc)) {
        lambdaFunc = require(utils.getAbsolutePath(lambdaPath));
    }
    if (callback) context.callback = callback;

    // Handling timeout
    setTimeout(() => {
        throw new utils.TimeoutError('Task timed out after ' + (timeoutMs / 1000).toFixed(2) + ' seconds');
    }, timeoutMs);

    // execute lambda function
    logger.log('info', 'Logs');
    logger.log('info', '------');
    logger.log('info', 'START RequestId: ' + context.awsRequestId);

    lambdaFunc[lambdaHandler](event, context, context.done);
};

module.exports = {
    context: _context,
    execute: _execute,
    setLogger: _setLogger,
    getLogger: _getLogger
};