/*
 * Lambda function used for environment tests.
 */
exports.handler = function(event, context) {
    if (event.directive.endpoint.endpointId == "potato-device-97") {
        context.done(null, {"res": event.directive.endpoint.endpointId});
    } else {
        context.fail("Failed");
    }
};
