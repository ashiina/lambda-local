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

export function get_node_major_version(){
    return parseInt(process.version.slice(1).split('.')[0]);
}

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
    const logger = winston.createLogger({
        level: "info",
        transports: [
            new winston.transports.Console({
                format: combine(
                    colorize(),
                    simple(),
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

export function parseCookies (request) {
    const list = {};
    const cookieHeader = request.headers?.cookie;
    if (!cookieHeader) return list;

    cookieHeader.split(`;`).forEach(function(cookie) {
        let [ name, ...rest] = cookie.split(`=`);
        name = name?.trim();
        if (!name) return;
        const value = rest.join(`=`).trim();
        if (!value) return;
        list[name] = decodeURIComponent(value);
    });

    return list;
}

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
};

export function waitForNodeJS(cb, i=0){
    /* Waits for all Timeouts to end before calling the callback */
    // This is quite ugly, but its hard to emulate a "wait for all timeouts" properly :/
    if ((process as any).getActiveResourcesInfo().filter(x => x === 'Timeout').length > i){
        setTimeout(function(){
            waitForNodeJS(cb, i=1);
        }, 100);
    } else {
        cb();
    }
}

