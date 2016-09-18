/*
 * Lambda function used to test the AWS profiles.
 */
exports.handler = function(event, context) {
    var result = {"secret": process.env['AWS_SECRET_ACCESS_KEY'], "key": process.env['AWS_ACCESS_KEY_ID']}
    context.done(null, result);
};
