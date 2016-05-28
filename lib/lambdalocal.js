/*
 * Lambda's Context object.
 * Refer to this documentation: 
 * https://docs.aws.amazon.com/en_us/lambda/latest/dg/nodejs-prog-model-context.html
 */

var utils = require('./utils.js');

function LambdaLocal () {};

/*
 * exports
 */
module.exports = LambdaLocal;

	LambdaLocal.execute = function (opts) {
		var eventPath = opts.eventPath;
		var lambdaPath = opts.lambdaPath;
		var lambdaHandler = opts.lambdaHandler;
		var profilePath = opts.profilePath;
		var callbackWaitsForEmptyEventLoop = opts.callbackWaitsForEmptyEventLoop;
		var timeoutMs = opts.timeoutMs;

		//load profile
		if(profilePath){
			utils.loadAWSFile(utils.getAbsolutePath(profilePath));
		}
		
		// load lambda function
		var lambdaAbsolutePath = utils.getAbsolutePath(lambdaPath);
		var lambdaFunc = require(lambdaAbsolutePath);

		// load event & context
		var eventAbsolutePath = utils.getAbsolutePath(eventPath);
		var _event = require(eventAbsolutePath);
		var _context = require('./context.js');

		setTimeout(function(){
			console.log("Task timed out after "+(timeoutMs/1000).toFixed(2)+" seconds");
			process.exit();
		}, timeoutMs);

		_context._initialize({
			functionName: lambdaHandler,
			awsRequestId: _context.createInvokeId,
			timeoutMs: timeoutMs,
			callbackWaitsForEmptyEventLoop: callbackWaitsForEmptyEventLoop
		});
		// export the LAMBDA_TASK_ROOT enviroment variable
		process.env['LAMBDA_TASK_ROOT'] = process.cwd();
		
		//setting common other vars environments 
		process.env['NODE_PATH'] = utils.getAbsolutePath("node_modules");
		process.env['LAMBDA_CONSOLE_SOCKET'] = 14;
		process.env['LAMBDA_CONTROL_SOCKET'] = 11;
		process.env['AWS_SESSION_TOKEN'] = _context.awsRequestId; /*Just a random value...*/
		
		// execute lambda function
		console.log("Logs");
		console.log("------");
		console.log("START RequestId: " + _context.awsRequestId);

		lambdaFunc[lambdaHandler](_event, _context, _context.done);
		
		if(callbackWaitsForEmptyEventLoop){
			return true;
		}
	};


