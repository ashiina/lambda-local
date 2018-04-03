/*
 * Copyright (c) 2018. Taimos GmbH http://www.taimos.de
 */

/*
 * Lambda function used for basic test.
 */
exports.handler = async function(event, context) {
    return {"result": event.key, "context": context};
};


