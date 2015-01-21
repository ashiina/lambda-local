/*
 * Creating Lambda's context object
 */

var utils = require('./utils.js');

/*
 * doneStatus & postDone were minimum; probably defined internally in Lambda.
 */
var doneStatus = false;
var postDone = function (error, message) {};

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
 * This `done` method is directly extracted from source.
 */
Context.done = function (err, message) {
	console.log("END");
	console.log("\n");
	console.log("Message");
	console.log("------");
	console.log(message);

	process.exit();
};


