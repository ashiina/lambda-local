/*
 * Lambda function used for timeout test.
 */
exports.handler = function(event, context) {
    setTimeout(function() {
        context.fail('Way too long !');
    }, 5000);
};


