'use strict';

/*
 * Lambda's Context object.
 * Refer to this documentation:
 * https://docs.aws.amazon.com/en_us/lambda/latest/dg/nodejs-prog-model-context.html
 */

var logger = require('winston');

const mute = require('mute'),
    utils = require('./utils.js'),
    _context = require('./context.js');
    
var _setLogger = function(_logger){
    if(_logger != null && typeof _logger.loggers != 'undefined'){
        logger = _logger;
    } else {
        throw new TypeError("The object must be a winston logger !");
    }
}
    
var _execute = function(opts) {
    var event = opts.event,
        lambdaFunc = opts.lambdaFunc,
        lambdaPath = opts.lambdaPath,
        lambdaHandler = opts.lambdaHandler || 'handler',
        profilePath = opts.profilePath,
        profileName = opts.profileName,
        region = opts.region || 'us-east-1',
        callbackWaitsForEmptyEventLoop = opts.callbackWaitsForEmptyEventLoop || true,
        timeoutMs = opts.timeoutMs || 3000,
        muteLogs = opts.mute,
        unmute = null,
        callback = opts.callback;

    if (lambdaFunc && lambdaPath) {
        throw new SyntaxError("Cannot specify both lambdaFunc and lambdaPath !");
        return;
    }
        
    if(muteLogs) {
        unmute = mute();
    }
        
    //load profile
    if (profilePath) {
        utils.loadAWSCredentials(profilePath, profileName);
    }

    // set region before the require
    process.env['AWS_REGION'] = region;

    if (!(lambdaFunc)){
        // load lambda function
        lambdaFunc = require(utils.getAbsolutePath(lambdaPath));
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
    // export the LAMBDA_TASK_ROOT enviroment variable
    process.env['LAMBDA_TASK_ROOT'] = process.cwd();

    //setting common other vars environments
    process.env['NODE_PATH'] = utils.getAbsolutePath('node_modules');
    process.env['LAMBDA_CONSOLE_SOCKET'] = 14;
    process.env['LAMBDA_CONTROL_SOCKET'] = 11;
    process.env['AWS_SESSION_TOKEN'] = context.awsRequestId; /*Just a random value...*/

    // execute lambda function
    logger.log('info', 'Logs');
    logger.log('info', '------');
    logger.log('info', 'START RequestId: ' + context.awsRequestId);

    if(callback) context.callback = callback;
    lambdaFunc[lambdaHandler](event, context, context.done);
};

module.exports = {
    context: _context,
    execute: _execute, 
    setLogger: _setLogger
};
