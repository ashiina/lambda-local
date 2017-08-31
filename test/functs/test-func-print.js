/*
 * Lambda function used for basic test.
 */
exports.handler = function(event, context) {
    console.log("Function running :)");
    var answer = {"result": event.key, "context": context};
    context.done(null, answer); 
};


