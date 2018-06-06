'use strict';

/*
 * Lambda's Context object.
 * Refer to this documentation:
 * https://docs.aws.amazon.com/en_us/lambda/latest/dg/nodejs-prog-model-context.html
 */

var logger = require('winston');

const dotenv = require('dotenv');
const fs = require('fs');
const utils = require('./utils.js');
const Context = require('./context.js');
    
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
            var _opts = Object.assign({}, opts); /* Copy the opts to avoid modifying the external opts */
            _opts.callback = function (_err, _done) {
                if (_err) {
                    reject(_err);
                }
                resolve(_done);
            };
            _executeSync.apply(that, [_opts]);
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
        region = opts.region,
        environment = opts.environment,
        envdestroy = opts.envdestroy,
        envfile = opts.envfile,
        callbackWaitsForEmptyEventLoop = opts.callbackWaitsForEmptyEventLoop || true,
        timeoutMs = opts.timeoutMs || 3000,
        verboseLevel = opts.verboseLevel,
        callback = opts.callback;

    if (lambdaFunc && lambdaPath) {
        throw new SyntaxError("Cannot specify both lambdaFunc and lambdaPath !");
        return;
    }
    
    // set environment variables before the require
    process.env['AWS_LAMBDA_FUNCTION_NAME'] = lambdaHandler;
    process.env['AWS_LAMBDA_FUNCTION_MEMORY_SIZE'] = 1024;
    process.env['AWS_LAMBDA_FUNCTION_VERSION'] = "1.0";
    process.env['AWS_EXECUTION_ENV'] = "AWS_Lambda_nodejs";
    process.env['LAMBDA_CONSOLE_SOCKET'] = 14;
    process.env['LAMBDA_CONTROL_SOCKET'] = 11;
    process.env['LAMBDA_RUNTIME_DIR'] = process.cwd();
    process.env['LAMBDA_TASK_ROOT'] = process.cwd();
    process.env['NODE_PATH'] = utils.getAbsolutePath('node_modules');
    process.env['TZ'] = "utc";

    // custom environment variables
    if (environment != null) {
        if (envdestroy == null){
            envdestroy = false;
        }
        Object.keys(environment).forEach(function(key) {
            process.env[key]=environment[key];
        });
    }

    // custom environment variables file
    if (envfile != null) {
        dotenv.config({ path: envfile });
    }

    //load profiles
    profilePath = profilePath || process.env['AWS_SHARED_CREDENTIALS_FILE'];
    var default_config_file = utils.getAbsolutePath("~/.aws/config");
    var default_credentials_file = utils.getAbsolutePath("~/.aws/credentials");
    if (fs.existsSync(default_config_file)) { //Default config file
        utils.loadAWSCredentials(default_config_file, profileName);
    }
    if (fs.existsSync(default_credentials_file)) { //Default credentials file
        utils.loadAWSCredentials(default_credentials_file, profileName);
    }
    if (profilePath) { //Provided config/credentials file
        utils.loadAWSCredentials(profilePath, profileName);
    }

    //post loading profiles environment variables
    process.env['AWS_REGION'] = region || process.env['AWS_REGION'] || 'us-east-1';
    process.env['AWS_DEFAULT_REGION'] = region || process.env['AWS_DEFAULT_REGION'] || 'us-east-1';

    //Logs
    if (typeof verboseLevel == 'undefined'){
        verboseLevel = 3
    }
    if (verboseLevel <= 1){
        muteLogs();
    }

    // load context
    var context = new Context();
    context._initialize({
        functionName: lambdaHandler,
        timeoutMs: timeoutMs,
        callbackWaitsForEmptyEventLoop: callbackWaitsForEmptyEventLoop,
        verboseLevel: verboseLevel,
        logger: logger,
        finalCallback: function(){
            if (verboseLevel <= 1){
                restoreLogs();
            }
            if (environment != null && envdestroy) {
              Object.keys(environment).forEach(function(key) {
                delete process.env[key];
              });
            }
        }
    });

    if(callback) context.callback = callback;

    var ctx = context.generate_context();

    try {
        // load lambda function
        if (!(lambdaFunc)){
            lambdaFunc = require(utils.getAbsolutePath(lambdaPath));
        }

        //load event
        if (event instanceof Function){
            event = event();
        }

        //start timeout
        context._init_timeout();

        // execute lambda function
        var result = lambdaFunc[lambdaHandler](event, ctx, ctx.done);
        if (result) {
            if (result.then) {
                result.then(ctx.succeed, ctx.fail);
            } else {
                ctx.succeed(result);
            }
        }
    } catch(err){
        console.log(err);
        ctx.fail(err);
    }
};

module.exports = {
    execute: _execute,
    setLogger: _setLogger,
    getLogger: _getLogger
};
