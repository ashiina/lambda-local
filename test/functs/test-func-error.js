/*
 * Lambda function used for timeout test.
 */
exports.handler = function(event, context) {
    throw new Error('Function has crashed :(');
};


