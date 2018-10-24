/*
 * Lambda function used for wait for empty loop tests.
 */
exports.handler = function(event, context, callback) {
    setTimeout(function() {
        console.log("Timeout finished !")
    }, 1000);
    context.succeed({"success": true});
}