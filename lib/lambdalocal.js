'use strict';

/*
 * Lambda's Context object.
 * Refer to this documentation:
 * https://docs.aws.amazon.com/en_us/lambda/latest/dg/nodejs-prog-model-context.html
 */

var logger = require('winston');
var dotenv = require('dotenv');

const utils = require('./utils.js'),
      _context = require('./context.js');
    
var _setLogger = function(_logger){
    if(_logger != null && typeof _logger.transports != 'undefined'){
        logger = _logger;
    } else {
        console.warn("Invalid logger object ! Using default logger");
    }
}
 
var _getLogger = function() {
    return logger;
}

var backup_logs;
var muteLogs = function(){
    backup_logs = logger.levels;
    logger.levels = { mute: 0, error: 1, warn: 2, info: 3, verbose: 4, debug: 5, silly: 6 };
    logger.level = "mute";
}
var restoreLogs = function(){
    logger.levels = backup_logs
}

var _execute = function(opts) {
    if (opts.callback) {
        _executeSync.apply(this, [opts]);
    } else {
        var that = this;
        return new Promise(function (resolve, reject) {
            opts.callback = function (_err, _done) {
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
        verboseLevel = opts.verboseLevel,
        callback = opts.callback;

    if (lambdaFunc && lambdaPath) {
        throw new SyntaxError("Cannot specify both lambdaFunc and lambdaPath !");
        return;
    }
    
    //load profile
    if (profilePath) {
        utils.loadAWSCredentials(profilePath, profileName);
    }
    
    //Logs
    if (typeof verboseLevel == 'undefined'){
        verboseLevel = 3
    }
    if (verboseLevel <= 1){
        muteLogs()
    }

    // load event & context
    var context = this.context;
    context._initialize({
        functionName: lambdaHandler,
        awsRequestId: context.createInvokeId,
        timeoutMs: timeoutMs,
        callbackWaitsForEmptyEventLoop: callbackWaitsForEmptyEventLoop,
        verboseLevel: verboseLevel,
        logger: logger,
        logsCallback: function(){
            if (verboseLevel <= 1){
                restoreLogs();
            }
        }
    });

    // set environment variables before the require
    process.env['AWS_REGION'] = region;
    process.env['LAMBDA_TASK_ROOT'] = process.cwd();
    process.env['NODE_PATH'] = utils.getAbsolutePath('node_modules');
    process.env['LAMBDA_CONSOLE_SOCKET'] = 14;
    process.env['LAMBDA_CONTROL_SOCKET'] = 11;

    // custom environment variables
    if (environment != null) {
      Object.keys(environment).forEach(function(key) {
        process.env[key]=environment[key];
      });
    }

    // custom environment variables file
    if (envfile != null) {
      dotenv.config({ path: envfile });
    }

    // load lambda function
    if (!(lambdaFunc)){
        lambdaFunc = require(utils.getAbsolutePath(lambdaPath));
    }
    if(callback) context.callback = callback;
    
    // Handling timeout
    setTimeout(function() {
        throw new utils.TimeoutError('Task timed out after ' + (timeoutMs / 1000).toFixed(2) + ' seconds');
    }, timeoutMs);
    
    // execute lambda function
    try {
        lambdaFunc[lambdaHandler](event, context, context.done);
    } catch(err){
        context.fail(err);
    }
};

module.exports = {
    context: _context,
    execute: _execute,
    setLogger: _setLogger,
    getLogger: _getLogger
};
