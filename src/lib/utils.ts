'use strict'

/**
 * Requires
 */

import fs = require("fs");
import os = require("os");
import path_lib = require("path");
const join = path_lib.join;
import util = require("util");

/**
 * utility functions
 */

const _hexChars = '0123456789abcdef'.split('');

export function generateRandomHex(length) {
    var hexVal = '';
    for (var i = 0; i < length; i++) {
        hexVal += _hexChars[Math.floor(Math.random() * _hexChars.length)];
    }
    return hexVal;
};

export function getWinstonConsole() {
    var winston = require("winston");
    const {combine, colorize, simple} = winston.format;
    const _simple = simple();
    const myFormat = winston.format(info => {
        const stringifiedRest = processJSON(Object.assign({}, info, {
            level: undefined,
            message: undefined,
            splat: undefined
        }));
        var new_info = {level: info.level, message: info.message};
        if (new_info.message == undefined){
            new_info.message = "";
        }
        if (stringifiedRest !== '{}') {
            new_info.message += stringifiedRest;
        }
        return _simple.transform(new_info);
    });

    const logger = winston.createLogger({
        level: "info",
        transports: [
            new winston.transports.Console({
                format: combine(
                    colorize(),
                    myFormat()
                )
            })
        ]
    });
    return logger;
}

export function getAbsolutePath(path) {
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

export function processJSON(json) {
    if(typeof json === 'object'){
        try {
            return JSON.stringify(json, null, '\t');
        } catch (e) {
            return util.inspect(json);
        }
    } else {
        return json;
    }
};

export class TimeoutError extends Error {
    constructor(m: string) {
        super(m);
        this.name = "TimeoutError";
    }
}

var _load_var_from_file = function(varname, envname, data, profileName){
    if(process.env[envname]){
        //If already set, it overwrites config files
        return;
    }
    var regex = new RegExp('\\[' + profileName +
        '\\]([^\\[].|\\n|\\r\\n)*?' + varname + '( ?)+=( ?)+(.*)'),
        match;
    if ((match = regex.exec(data)) !== null) {
        process.env[envname] = match[4];
    }
}

export function loadAWSCredentials(path:string, profileName:string = 'default') {
    var dataRaw = fs.readFileSync(getAbsolutePath(path)),
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

export function waitForNodeJS(cb){
    /* Waits for all Timeouts to end before calling the callback */
    // This is quite ugly, but its hard to emulate a "wait for all timeouts" properly :/
    const Timer_constructor = (process as any).binding('timer_wrap').Timer;
    var i=0, has_timers=false;
    (process as any)._getActiveHandles().every(function(x){
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
            waitForNodeJS(cb);
        }, 100);
    } else {
        cb();
    }
}

