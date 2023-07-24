/**
 * Implements Lambda Response Streaming by polyfilling
 * `awslambda.streamifyResponse` and `awslambda.HttpResponseStream.from`.
 * 
 * If they're used, `execute` will return a `ReadableStream` as `body`.
 * 
 * See https://aws.amazon.com/fr/blogs/compute/introducing-aws-lambda-response-streaming/ for reference.
 */

import { PassThrough } from "stream";

function streamifyResponse(handler) {
  return (event, context) =>
    new Promise(async (resolve, reject) => {
      const body = new StreamingBody(resolve);

      try {
        const metadata = await handler(event, body, context); // cb not supported
        if (!body.headersSent) {
          body.sendHeader(metadata)
        }
      } catch (error) {
        reject(error);
      }
    });
}

class StreamingBody extends PassThrough {
  constructor(private readonly resolve: (metadata) => void) {
    super();
  }

  public headersSent = false
  sendHeader(metadata: any = {}) {
    const headers = { ...metadata.headers }
    if (this.contentType) {
      headers["Content-Type"] = this.contentType
    }

    this.resolve({
      ...metadata,
      headers,
      body: this
    })
    this.headersSent = true
  }

  private contentType: string;
  setContentType(contentType) {
    this.contentType = contentType;
  }
}

class HttpResponseStream {
  static from(responseStream: StreamingBody, metadata) {
    responseStream.sendHeader(metadata);
    return responseStream;
  }
}

global.awslambda = global.awslambda || {
  streamifyResponse,
  HttpResponseStream,
};
