/*
 * Lambda function used for test.
 */
exports.handler = function(event, context) {
    console.log('value1 = ' + event.key1);
    console.log('value2 = ' + event.key2);
    console.log('value3 = ' + event.key3);
    context.done(null, 'function done');  
};


