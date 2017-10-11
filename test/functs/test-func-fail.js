/*
 * Lambda function that always fails.
 */
exports.handler = function(event, context) {
    context.fail("Failed !");
};


