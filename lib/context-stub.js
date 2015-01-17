/*
 * Creating a stub for Lambda's context
 */

var utils = require('./utils.js');

/*
 * doneStatus & postDone were minimum; probably defined internally in Lambda.
 */
var doneStatus = false;
var postDone = function (error, message) {};

function ContextStub () {};

/*
 * exports
 */
module.exports = ContextStub;
/*
 * create random invoke_id. 
 * Assuming that invoke_id follows the format: 
 * 8hex-4hex-4hex-4hex-12hex
 */
ContextStub.invoke_id = (function(){ 
	return [ 
		utils.generateRandomHex(8),
		utils.generateRandomHex(4),
		utils.generateRandomHex(4),
		utils.generateRandomHex(4),
		utils.generateRandomHex(12)
		].join('-'); 
})();

/*
 * This `done` method is directly extracted from source.
 */
ContextStub.done = function (err, message) {
	if(doneStatus) {
		return;
	}
	doneStatus = true;
	var error = null;
	if(!(typeof err == "undefined" || (typeof err == "object" && !err))) {
		error = util.format(err);
		console.log(error);
	}
	/*
	 * use a nextTick to perform the operation once the user gives up control of the event thread
	 * This is how HTTP handler works right now
	*/
	process.nextTick(function() {
		postDone(error, message);
	});
};


