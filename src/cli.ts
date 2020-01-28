#!/usr/bin/env node

'use strict';

import lambdaLocal = require('./lambdalocal');
import utils = require('./lib/utils');

/*
 * Local executor for Amazon Lambda function
 */
(function() {
    var logger = lambdaLocal.getLogger();

    // process opts
    var program = require('commander');
    program
        .name('lambda-local')
        .option('-l, --lambda-path <lambda index path>', '(required) Lambda function file name.')
        .option('-e, --event-path <path>', '(required) Event data file name.')
        .option('-h, --handler <handler name>',
            '(optional) Lambda function handler name. Default is \'handler\'.')
        .option('-t, --timeout <timeout seconds>',
            '(optional) Seconds until lambda function timeout. Default is 3 seconds.')
        .option('-r, --region <aws region>',
            '(optional) default set to us-east-1')
        .option('-p, --profile <aws profile name>',
            '(optional) Read the AWS profile to get the credentials from profile name')
        .option('-P, --profile-path <aws credentials path>',
            '(optional) Read the specified AWS credentials file')
        .option('-E, --environment <JSON {key:value}>',
            '(optional) Set extra environment variables for the lambda')
        .option('--wait-empty-event-loop',
            '(optional) Sets callbackWaitsForEmptyEventLoop=True => will wait for an empty loop before ' +
            'returning. This is false by default because our implementation isn\'t perfect and only "emulates" it.')
        .option('--envdestroy',
            '(optional) Destroy added environment on closing. Defaults to false')
        .option('-v, --verboselevel <3/2/1/0>',
            '(optional) Default 3. Level 2 dismiss handler() text, level 1 dismiss lambda-local text ' +
            'and level 0 dismiss also the result.')
        .option('--envfile <path/to/env/file>',
            '(optional) Load additional environment variables from a file')
        .option('--inspect [[host:]port]',
            '(optional) Starts lambda-local using the NodeJS inspector (available in nodejs > 8.0.0)')
        .parse(process.argv);
    
    var eventPath = program.eventPath,
        lambdaPath = program.lambdaPath,
        lambdaHandler = program.handler,
        profilePath = program.profilePath,
        profileName = program.profile,
        region = program.region,
        environment = program.environment,
        envdestroy = program.envdestroy,
        envfile = program.envfile,
        callbackWaitsForEmptyEventLoop = program.waitEmptyEventLoop,
        verboseLevel = program.verboselevel;
    
    if (!lambdaPath || !eventPath) {
        program.help();
    }

    // default handler name
    if (!lambdaHandler) {
        lambdaHandler = 'handler';
    }
    
    if (environment) {
        try {
            environment = JSON.parse(environment);
        } catch (e) {
            console.log("Invalid environment variable JSON format. ");
            console.log("Example: {\\\"key\\\":\\\"val\\\"\\\,\\\"key2\\\":\\\"val2\\\"}");
            process.exit(1);
        }
    } else {
        environment = [];
    }

    //default callbackWaitsForEmptyEventLoop
    if (!callbackWaitsForEmptyEventLoop) {
        callbackWaitsForEmptyEventLoop = false;
    } else {
        callbackWaitsForEmptyEventLoop = true;
    }

    // timeout milliseconds
    var timeoutMs;
    if (program.timeout) {
        timeoutMs = program.timeout * 1000;
    } else {
        timeoutMs = 3000;
    }

    function get_node_major_version(){
        return parseInt(process.version.slice(1).split('.')[0]);
    }
    
    //Use NodeJS inspector
    var inspector;
    var _close_inspector;
    if (program.inspect) {
        if (get_node_major_version() < 8) {
            logger.log('error', 'Inspector API not available on NodeJS < 8.0.0');
        } else {
            inspector = require('inspector');
            if (program.inspect == true) {
                inspector.open();
            } else if (typeof(program.inspect) === 'string') {
                if (program.inspect.indexOf(":") !== -1){
                    var arr = program.inspect.split(":");
                    inspector.open(parseInt(arr[1]), arr[0]);
                } else {
                    inspector.open(parseInt(program.inspect));
                }
            } else {
                logger.log('error', 'Unknown parameters following --inspect');
            }
            _close_inspector = function(){inspector.close();}
        }
    }

    var event = function(){return require(utils.getAbsolutePath(eventPath));}
    try {
        var init_time = new Date().getTime();
        // execute
        lambdaLocal.execute({
            event: event,
            lambdaPath: lambdaPath,
            lambdaHandler: lambdaHandler,
            profilePath: profilePath,
            profileName: profileName,
            region: region,
            callbackWaitsForEmptyEventLoop: callbackWaitsForEmptyEventLoop,
            timeoutMs: timeoutMs,
            environment: environment,
            envdestroy: envdestroy,
            envfile: envfile,
            callback: function(err /*, data */) { //data unused
                var exec_time = new Date().getTime() - init_time;
                if (_close_inspector) {
                    _close_inspector();
                }
                if (err !== null && typeof err !== 'undefined') {
                    if (verboseLevel > 0) {
                        logger.log('error', 'Lambda failed in ' + exec_time + 'ms.');
                    }
                    // Finish the process
                    process.exit(1);
                } else {
                    if (verboseLevel > 0) {
                        logger.log('info', 'Lambda successfully executed in ' + exec_time + 'ms.');
                    }
                    process.exit(0);
                }
            },
            verboseLevel: verboseLevel
        });
    } catch (ex) {
        logger.log('error', ex);
        process.exit(1);
    }
})();
