/*
 * Lambda function used for basic test.
 */
exports.handler = function(event, context) {
    context.succeed(event); 
};
