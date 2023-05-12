/*
 * Lambda function used for streaming test.
 */
exports.handler = awslambda.streamifyResponse(
    async (event, responseStream, context) => {
        const metadata = {
            statusCode: 200,
            headers: {
                "X-Foo": "Bar"
            }
        };

        responseStream.setContentType("text/plain");
        responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
        
        responseStream.write("foo");
        setTimeout(() => {
            responseStream.write("bar");
            responseStream.end();
        }, 100);
    }
);

