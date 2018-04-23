/*
 * Copyright (c) 2018. Taimos GmbH http://www.taimos.de
 */

/*
 * Lambda function used for basic test.
 */
exports.handler = function(event, context) {
    return Promise.resolve({"result": event.key, "context": context});
};


