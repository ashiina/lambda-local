/*
 * Creating Lambda's context object
 */

var utils = require('./utils.js');

/*
 * doneStatus & postDone were minimum; probably defined internally in Lambda.
 */
var doneStatus = false;
var postDone = function (error, message) {};

/*
 * Used to determine the getRemainingTimeInMillis()
 */
var start_time;
var timeout;
 
function Context () {};

/*
 * exports
 */
module.exports = Context;
/*
 * create random invokeid. 
 * Assuming that invokeid follows the format: 
 * 8hex-4hex-4hex-4hex-12hex
 */
Context.invokeid = (function(){ 
	return [ 
		utils.generateRandomHex(8),
		utils.generateRandomHex(4),
		utils.generateRandomHex(4),
		utils.generateRandomHex(4),
		utils.generateRandomHex(12)
		].join('-'); 
})();

/*
 * Set starting time
 */
Context._Lambda_Local_invoke = function(time){
	start_time = new Date().getTime();
	timeout = time;
	return;
}

/*
 * This `done` method is directly extracted from source.
 */
Context.done = function (err, message) {
	console.log("END");
	console.log("\n");
	if (err !== null){
		console.log("Error");
		console.log("------");
		utils.outputJSON(err);
	} 
	else {
		console.log("Message");
		console.log("------");
		utils.outputJSON(message);
	}

	process.exit();
};

/*
 * `fail` method calls the `done` method
 */
Context.fail = function (err) {
	console.log("FAILING!!");
	Context.done(err);
};

/*
 * `succeed` method calls the `done` method
 */
Context.succeed = function (message) {
	Context.done(null, message);
};

/*
 * 'getRemainingTimeInMillis' method return time before task is killed
 */
Context.getRemainingTimeInMillis = function () {
	var now = new Date().getTime();
	return (timeout + start_time - now);
};

Context.functionName = '';
Context.functionVersion = '';
Context.invokedFunctionArn = '';
Context.memoryLimitInMB = '';
Context.awsRequestId = '';
Context.logGroupName = '';
Context.logStreamName = null;
Context.identity = null;
Context.clientContext = null;

