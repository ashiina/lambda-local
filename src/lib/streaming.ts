import { PassThrough } from "stream";

function streamifyResponse(handler) {
  return (event, ...rest) =>
    new Promise(async (resolve, reject) => {
      const body = new StreamingBody(resolve);

      try {
        await handler(event, body, ...rest); // result is ignored
      } catch (error) {
        reject(error);
      }
    });
}

class StreamingBody extends PassThrough {
  constructor(readonly resolve: (metadata) => void) {
    super();
  }

  contentType: string;

  setContentType(contentType) {
    this.contentType = contentType;
  }
}

class HttpResponseStream {
  static from(responseStream: StreamingBody, metadata) {
    responseStream.resolve({
      ...metadata,
      headers: {
        "Content-Type": responseStream.contentType,
        ...metadata.headers,
      },
      body: responseStream,
    });
    return responseStream;
  }
}

globalThis.awslambda = {
  streamifyResponse,
  HttpResponseStream,
};
