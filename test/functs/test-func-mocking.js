/*
 * Lambda function used to test mocking.
 */
exports.getData = function getData(){
	return "WrongData";
}
exports.handler = function(event, context) {
    context.done(null, exports.getData()); 
};


