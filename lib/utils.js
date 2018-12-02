'use strict'

/**
 * Requires
 */

const fs = require("fs");
const os = require("os");
const join = require("path").join;
const util = require("util");

/**
 * utility functions
 */

const _hexChars = '0123456789abcdef'.split('');

var _generateRandomHex = function(length) {
    var hexVal = '';
    for (var i = 0; i < length; i++) {
        hexVal += _hexChars[Math.floor(Math.random() * _hexChars.length)];
    }
    return hexVal;
};

var _getAbsolutePath = function(path) {
    var homeDir = process.env.HOME || process.env.USERPROFILE;
		
	var windowsRegex = /([A-Z|a-z]:\\[^*|"<>?\n]*)|(\\\\.*?\\.*)/;
		
    if (path.match(/^\//) || path.match(windowsRegex)) {
		//On Windows and linux
        return path;
    } else {
        if (path === '~') {
            return homeDir;
        } else if (path.slice(0, 2) === '~/') {
            return join(homeDir, path.slice(2));
        } else if (path.slice(0, 2) === './') {
            return join(process.cwd(), path.slice(2));
        } else {
            return join(process.cwd(), path);
        }
    }
    return null;
};

var _outputJSON = function(json, logger, level) {
    if(typeof json === 'object'){
        try {
            logger.log(level, JSON.stringify(json, null, '\t'));
        } catch (e) {
            logger.log('warn', e);
            logger.log(level, util.inspect(json));
        }
    } else {
        logger.log(level, json);
    }
};

function TimeoutError(message) {
    this.message = message;
    // Use V8's native method if available, otherwise fallback
    if ("captureStackTrace" in Error)
        Error.captureStackTrace(this, TimeoutError);
    else
        this.stack = (new Error()).stack;
}

TimeoutError.prototype = Object.create(Error.prototype);
TimeoutError.prototype.name = "TimeoutError";
TimeoutError.prototype.constructor = TimeoutError;

var _load_var_from_file = function(varname, envname, data, profileName){
    if(process.env[envname]){
        //If already set, it overwrites config files
        return;
    }
    var regex = new RegExp('\\[' + profileName +
        '\\](.|\\n|\\r\\n)*?' + varname + '( ?)+=( ?)+(.*)'),
        match;
    if ((match = regex.exec(data)) !== null) {
        process.env[envname] = match[4];
    }
}

var _loadAWSCredentials = function(path) {
    //default parameter
    var profileName = arguments.length <= 1 ||
        arguments[1] === undefined ||
        arguments[1] === null ? 'default' : arguments[1];

    var fs = require('fs'),
        dataRaw = fs.readFileSync(_getAbsolutePath(path)),
        data = dataRaw.toString();
    
    _load_var_from_file("aws_secret_access_key", "AWS_SECRET_ACCESS_KEY", data, profileName);
    _load_var_from_file("aws_access_key_id", "AWS_ACCESS_KEY_ID", data, profileName);
    _load_var_from_file("aws_session_token", "AWS_SESSION_TOKEN", data, profileName);
    _load_var_from_file("metadata_service_timeout", "AWS_METADATA_SERVICE_TIMEOUT", data, profileName);
    _load_var_from_file("metadata_service_num_attempts", "AWS_METADATA_SERVICE_NUM_ATTEMPTS", data, profileName);

    _load_var_from_file("region", "AWS_REGION", data, profileName);

    if (process.env['AWS_SESSION_TOKEN'] && (process.env['AWS_ACCESS_KEY_ID'] || process.env['AWS_SECRET_ACCESS_KEY'])){
        console.log('warning', 'Using both auth systems: aws_access_key/id and secret_access_token !');
    }
};

var _waitForNodeJS = function(cb){
    /* Waits for all Timeouts to end before calling the callback */
    // This is quite ugly, but its hard to emulate a "wait for all timeouts" properly :/
    const Timer_constructor = process.binding('timer_wrap').Timer;
    var i=0, has_timers=false;
    process._getActiveHandles().every(function(x){
        if (x.constructor == Timer_constructor){
            if (++i > 1){ 
                has_timers = true;
                return false;
            }
        }
        return true;
    });
    if (has_timers){
        setTimeout(function(){
            _waitForNodeJS(cb);
        }, 100);
    } else {
        cb();
    }
}

module.exports = {
    hexChars: _hexChars,
    generateRandomHex: _generateRandomHex,
    getAbsolutePath: _getAbsolutePath,
    outputJSON: _outputJSON,
    loadAWSCredentials: _loadAWSCredentials,
    waitForNodeJS: _waitForNodeJS,
    TimeoutError: TimeoutError
};
