'use strict'

/**
 * Requires
 */

const join = require('path').join;

/**
 * utility functions
 */

const _hexChars = '0123456789abcdef'.split('');

var _generateRandomHex = (length) => {
    var hexVal = '';
    for (var i = 0; i < length; i++) {
        hexVal += _hexChars[Math.floor(Math.random() * _hexChars.length)];
    }
    return hexVal;
};

var _getAbsolutePath = (path) => {
    var res = null,
        homeDir = process.env.HOME || process.env.USERPROFILE;

    var windowsRegex = /([A-Z|a-z]:\\[^*|"<>?\n]*)|(\\\\.*?\\.*)/;

    if (path.match(/^\//) || path.match(windowsRegex)) {
        //On Windows and linux
        res = path;
    } else {
        if (path === '~') {
            //On linux only
            res = homeDir;
        } else if (path.slice(0, 2) !== '~/') {
            //On Windows and linux
            res = join(process.cwd(), path);
        } else {
            //On linux only
            res = join(homeDir, path.slice(2));
        }
    }
    return res;
};

var _outputJSON = (json, logger) => {
    logger.log('info', typeof json === 'object' ?
        JSON.stringify(json, null, '\t') : json);
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

var _loadAWSCredentials = function(path) {
    //default parameter
    var profileName = arguments.length <= 1 ||
        arguments[1] === undefined ||
        arguments[1] === null ? 'default' : arguments[1];

    var fs = require('fs'),
        dataRaw = fs.readFileSync(_getAbsolutePath(path)),
        data = dataRaw.toString();

    var regex = new RegExp('\\[' + profileName +
            '\\](.|\\n|\\r\\n)*?aws_secret_access_key( ?)+=( ?)+(.*)'),
        match;
    if ((match = regex.exec(data)) !== null) {
        process.env['AWS_SECRET_ACCESS_KEY'] = match[4];
    } else {
        console.log('warning', 'Couldn\'t find the \'aws_secret_access_key\' field inside the file.');
    }

    regex = new RegExp('\\[' + profileName + '\\](.|\\n|\\r\\n)*?aws_access_key_id( ?)+=( ?)+(.*)');
    if ((match = regex.exec(data)) !== null) {
        process.env['AWS_ACCESS_KEY_ID'] = match[4];
    } else {
        console.log('warning', 'Couldn\'t find the \'aws_access_key_id\' field inside the file.');
    }

    regex = new RegExp('\\[' + profileName + '\\](.|\\n|\\r\\n)*?aws_session_token( ?)+=( ?)+(.*)');
    if ((match = regex.exec(data)) !== null) {
        process.env['AWS_SESSION_TOKEN'] = match[4];
    }
    if (process.env['AWS_SESSION_TOKEN'] && (process.env['AWS_ACCESS_KEY_ID'] || process.env['AWS_SECRET_ACCESS_KEY'])) {
        console.log('warning', 'Using both auth systems: aws_access_key/id and secret_access_token !');
    }

    regex = new RegExp('\\[' + profileName +
            '\\](.|\\n|\\r\\n)*?region( ?)+=( ?)+(.*)'),
        match;
    if ((match = regex.exec(data)) !== null) {
        process.env['AWS_DEFAULT_REGION'] = match[4];
    }
};

module.exports = {
    hexChars: _hexChars,
    generateRandomHex: _generateRandomHex,
    getAbsolutePath: _getAbsolutePath,
    outputJSON: _outputJSON,
    loadAWSCredentials: _loadAWSCredentials,
    TimeoutError: TimeoutError
};