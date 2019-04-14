/*
 * Lambda function used to test aws-sdk import.
 */
exports.handler = function(event, context) {
    const aws = require('aws-sdk');
    context.succeed({"version": aws.VERSION}); 
};


