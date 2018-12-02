/*
 * Lambda function used to test circular results.
 */
exports.handler = function(event, context, callback) {
    var a = {"result": 0, "data": 1}
    a["_rec"] = a
    context.succeed(a);
}