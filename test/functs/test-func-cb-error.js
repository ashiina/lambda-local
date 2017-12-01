/*
 * Lambda function used to check that Error objects are converted into JSON.
 */
exports.handler = function(event, context, callback) {
    callback(new Error("Failed for an unknown reason !"));
};


