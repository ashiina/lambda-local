/*
 * Lambda function used for streaming test.
 */
exports.handler = awslambda.streamifyResponse(
    async (event, responseStream, context) => {
        responseStream.setContentType("text/plain");
        
        responseStream.write("foo");
        setTimeout(() => {
            responseStream.write("bar");
            responseStream.end();
        }, 100);
    }
);

