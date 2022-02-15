/*
 * Copyright (c) 2018. Taimos GmbH http://www.taimos.de
 */

/*
 * Lambda function used for basic test.
 */
exports.handler = function (event, context) {
  return {
    statusCode: 200,
    body: "this response won't go anywhere!",
  };
};
