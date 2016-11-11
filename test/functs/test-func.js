/*
 * Lambda function used for basic test.
 */
exports.handler = function(event, context) {
    var answer = {"result": event.key, "context": context};
    context.done(null, answer); 
};


