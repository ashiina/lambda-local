'use strict';

/*
 * Lambda's Context object.
 * Refer to this documentation:
 * https://docs.aws.amazon.com/en_us/lambda/latest/dg/nodejs-prog-model-context.html
 */

const mute = require('mute'),
  utils = require('./utils.js'),
  _context = require('./context.js');

var _execute = function(opts) {
  var event = opts.event,
    lambdaPath = opts.lambdaPath,
    lambdaHandler = opts.lambdaHandler || 'handler',
    profilePath = opts.profilePath,
    profileName = opts.profileName,
    region = opts.region || 'us-east-1',
    callbackWaitsForEmptyEventLoop = (typeof opts.callbackWaitsForEmptyEventLoop === 'undefined') ?
      true : opts.callbackWaitsForEmptyEventLoop,
    timeoutMs = (typeof opts.timeoutMs === 'undefined') ? 3000 : opts.timeoutMs,
    muteLogs = opts.mute,
    unmute = null,
    callback = opts.callback;

  if(muteLogs) {
    unmute = mute();
  }

  //load profile
  if (profilePath) {
    utils.loadAWSCredentials(profilePath, profileName);
  }

  // set region before the require
  process.env['AWS_REGION'] = region;

  // load lambda function
  var lambdaFunc = require(utils.getAbsolutePath(lambdaPath));

  // load event & context
  var context = this.context;

  context._initialize({
    functionName: lambdaHandler,
    awsRequestId: context.createInvokeId,
    timeoutMs: timeoutMs,
    callbackWaitsForEmptyEventLoop: callbackWaitsForEmptyEventLoop
  });
  // export the LAMBDA_TASK_ROOT enviroment variable
  process.env['LAMBDA_TASK_ROOT'] = process.cwd();

  //setting common other vars environments
  process.env['NODE_PATH'] = utils.getAbsolutePath('node_modules');
  process.env['LAMBDA_CONSOLE_SOCKET'] = 14;
  process.env['LAMBDA_CONTROL_SOCKET'] = 11;
  process.env['AWS_SESSION_TOKEN'] = context.awsRequestId; /*Just a random value...*/

  // execute lambda function
  console.log('Logs');
  console.log('------');
  console.log('START RequestId: ' + context.awsRequestId);

  context.callback = callback;
  if (callback) {
    lambdaFunc[lambdaHandler](event, context, function (err, data) {
      if (muteLogs) {
        unmute();
      }
      callback(err, data);
    });
  } else {
    lambdaFunc[lambdaHandler](event, context, function (err, message) {
      if (muteLogs) {
        unmute();
      }
      context.done(err, message);
    });
  }
};

module.exports = {
  context: _context,
  execute: _execute
};
