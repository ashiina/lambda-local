'use strict';

/**
 * Requires
 */

const join = require('path').join;

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
  var res = null,
    homeDir = process.env.HOME || process.env.USERPROFILE;

  if (path.match(/^\//)) {
    res = path;
  } else {
    if (path === '~') {
      res = homeDir;
    } else if (path.slice(0, 2) !== '~/') {
      res = join(process.cwd(), path);
    } else {
      res = join(homeDir, path.slice(2));
    }
  }
  return res;
};

var _outputJSON = function(json) {
  console.log(typeof json === 'object' ?
    JSON.stringify(json, null, '\t') : json);
};

//This will load aws credentials files
//more infos:
// - http://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html#cli-config-files
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
    console.log('WARNING: Couldn\'t find the \'aws_secret_access_key\' field inside the file.');
  }

  regex = new RegExp('\\[' + profileName + '\\](.|\\n|\\r\\n)*?aws_access_key_id( ?)+=( ?)+(.*)');
  if ((match = regex.exec(data)) !== null) {
    process.env['AWS_ACCESS_KEY_ID'] = match[4];
  } else {
    console.log('WARNING: Couldn\'t find the \'aws_access_key_id\' field inside the file.');
  }
};

module.exports = {
  hexChars: _hexChars,
  generateRandomHex: _generateRandomHex,
  getAbsolutePath: _getAbsolutePath,
  outputJSON: _outputJSON,
  loadAWSCredentials: _loadAWSCredentials
};
