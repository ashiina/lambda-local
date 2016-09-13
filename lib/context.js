'use strict';

/*
 * Lambda's Context object.
 * Refer to this documentation:
 * https://docs.aws.amazon.com/en_us/lambda/latest/dg/nodejs-prog-model-context.html
 */

var utils = require('./utils.js');

/*
 * doneStatus & postDone were minimum; probably defined internally in Lambda.
 */
var doneStatus = false;
var postDone = function(error, message) {};

/*
 * Used to determine the getRemainingTimeInMillis()
 */
var startTime;
var timeout;

function Context() {}

/*
 * exports
 */
module.exports = Context;

/*
 * Context object properties
 */
Context.callbackWaitsForEmptyEventLoop = true;
Context.functionName = '';
Context.functionVersion = '1';
Context.invokedFunctionArn = 'a';
Context.memoryLimitInMB = 1;
Context.awsRequestId = '';
Context.logGroupName = 'a';
Context.logStreamName = null;
Context.identity = null;
Context.clientContext = null;

/*
 * callback function called after done
 */
Context.callback = function(result) {
  console.log('default context callback');
  return result;
};

/*
 * create random invokeid.
 * Assuming that invokeid follows the format:
 * 8hex-4hex-4hex-4hex-12hex
 */
Context.createInvokeId = (function() {
  return [
    utils.generateRandomHex(8),
    utils.generateRandomHex(4),
    utils.generateRandomHex(4),
    utils.generateRandomHex(4),
    utils.generateRandomHex(12)
  ].join('-');
})();

/*
 * Context initialization.
 * Called from lambda-local
 */
Context._initialize = function(options) {
  /* set time */
  startTime = new Date().getTime();
  timeout = options.timeoutMs;

  /* set function name */
  Context.functionName = options.functionName;

  /* set requestid */
  Context.awsRequestId = options.awsRequestId;

  /* Set callbackWaitsForEmptyEventLoop */
  Context.callbackWaitsForEmptyEventLoop = options.callbackWaitsForEmptyEventLoop;
  return;
};

/*
 * This `done` method is directly extracted from source.
 */
Context.done = function(err, message) {
  console.log('END');
  console.log('\n');
  if (err !== null) {
    console.log('Error');
    console.log('------');
    utils.outputJSON(err);
  } else {
    console.log('Message');
    console.log('------');
    utils.outputJSON(message);
  }
  if (!Context.callbackWaitsForEmptyEventLoop) {
    Context.callback(true);
  }
};

/*
 * `fail` method calls the `done` method
 */
Context.fail = function(err) {
  console.log('FAILING!!');
  Context.done(err);
};

/*
 * `succeed` method calls the `done` method
 */
Context.succeed = function(message) {
  Context.done(null, message);
};

/*
 * 'getRemainingTimeInMillis' method return time before task is killed
 */
Context.getRemainingTimeInMillis = function() {
  var now = new Date().getTime();
  return (timeout + startTime - now);
};
