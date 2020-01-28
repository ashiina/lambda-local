'use strict';

/*
 * Lambda's Context object.
 * Refer to this documentation:
 * https://docs.aws.amazon.com/en_us/lambda/latest/dg/nodejs-prog-model-context.html
 */

import dotenv = require('dotenv');
import fs = require('fs');
import path = require('path');
import os = require('os');
import utils = require('./lib/utils.js');
import Context = require('./lib/context.js');

var logger = utils.getWinstonConsole();

export function setLogger(_logger){
    if(_logger != null && typeof _logger.transports != 'undefined'){
        logger = _logger;
    } else {
        console.warn("Invalid logger object ! Using default logger");
    }
}
 
export function getLogger() {
    return logger;
}

export function execute(opts) {
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

function updateEnv(env) {
    /*
     * Update environment vars if not already in place
     */
    Object.keys(env).forEach(function (key){
        if (!process.env[key]) {
            process.env[key] = env[key];
        }
    });
}

function _executeSync(opts) {
    var event = opts.event,
        lambdaFunc = opts.lambdaFunc,
        lambdaPath = opts.lambdaPath,
        lambdaHandler = opts.lambdaHandler || 'handler',
        profilePath = opts.profilePath,
        profileName = opts.profileName || process.env['AWS_PROFILE'] || process.env['AWS_DEFAULT_PROFILE'],
        region = opts.region,
        environment = opts.environment,
        envdestroy = opts.envdestroy,
        envfile = opts.envfile,
        callbackWaitsForEmptyEventLoop = opts.callbackWaitsForEmptyEventLoop || false,
        timeoutMs = opts.timeoutMs || 3000,
        verboseLevel = opts.verboseLevel,
        callback = opts.callback,
        clientContext = null;

    if (opts.clientContext) {
        try {
            clientContext = JSON.parse(opts.clientContext)
        } catch(err) {
            throw new SyntaxError("clientContext must be stringified JS object");
        }

    }

    if (lambdaFunc && lambdaPath) {
        throw new SyntaxError("Cannot specify both lambdaFunc and lambdaPath !");
        return;
    }

    if (lambdaPath){
        lambdaPath = utils.getAbsolutePath(lambdaPath);
    }

    // set environment variables before the require
    var envVars = {
        'AWS_LAMBDA_FUNCTION_NAME': lambdaHandler,
        'AWS_LAMBDA_FUNCTION_MEMORY_SIZE': Math.floor(os.freemem() / 1048576).toString(),
        'AWS_LAMBDA_FUNCTION_VERSION': "1.0",
        'AWS_EXECUTION_ENV': "AWS_Lambda_nodejs" + process.version.substr(1),
        'LAMBDA_CONSOLE_SOCKET': "14",
        'LAMBDA_CONTROL_SOCKET': "11",
        'LAMBDA_RUNTIME_DIR': process.cwd(),
        'NODE_PATH': utils.getAbsolutePath('node_modules'),
        'TZ': Intl.DateTimeFormat().resolvedOptions().timeZone
    }
    /*
     * _HANDLER – The location to the handler, from the function's configuration.
     * The standard format is `file.method`, where file is the name of the file without an extension, and method is the name of a method or function that's defined in the file.
     * (https://docs.aws.amazon.com/lambda/latest/dg/runtimes-custom.html)
     */
    if (lambdaPath){
        envVars['LAMBDA_TASK_ROOT'] = path.dirname(lambdaPath);
        envVars['_HANDLER'] = path.basename(lambdaPath, path.extname(lambdaPath)) + "." + lambdaHandler;
    } else {
        envVars['LAMBDA_TASK_ROOT'] = process.cwd();
        envVars['_HANDLER'] = "index." + lambdaHandler;
    }
    updateEnv(envVars);

    // custom environment variables
    if (environment != null) {
        if (envdestroy == null){
            envdestroy = false;
        }
        Object.keys(environment).forEach(function(key) {
            process.env[key] = environment[key];
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

    // load context
    var context = new Context();
    context._initialize({
        functionName: lambdaHandler,
        timeoutMs: timeoutMs,
        callbackWaitsForEmptyEventLoop: callbackWaitsForEmptyEventLoop,
        verboseLevel: verboseLevel,
        logger: logger,
        finalCallback: function(){
            if (environment != null && envdestroy) {
                Object.keys(environment).forEach(function(key) {
                    delete process.env[key];
                });
            }
        },
        clientContext: clientContext
    });

    if(callback) context.callback = callback;

    var ctx = context.generate_context();

    try {
        // load lambda function
        if (!(lambdaFunc)){
            // delete this function from the require.cache to ensure every dependency is refreshed
            delete require.cache[lambdaPath];
            lambdaFunc = require(lambdaPath);
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
        ctx.fail(err);
    }
};

