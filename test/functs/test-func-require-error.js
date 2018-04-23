/*
 * Lambda function require error.
 */
const toto = require('doNotExist');

exports.handler = function(event, context, callback) {
    callback(0);
};
