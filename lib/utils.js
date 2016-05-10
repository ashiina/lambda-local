/*
 * utility functions
 */

module.exports = Utils;
function Utils () {}

Utils.hexChars = "0123456789abcdef".split('');
Utils.generateRandomHex = function (length) {
	var hexVal = '';
	for (var i=0; i<length; i++) {
		hexVal += Utils.hexChars[Math.floor(Math.random() * Utils.hexChars.length)];
	}
	return hexVal;
};

Utils.getAbsolutePath = function (path) {
	var absolutePath;
	if (path.match(/^\//)) {
		absolutePath = path;
	} else {
		absolutePath = [process.cwd(), path].join('/');
	}
	return absolutePath; 
};

Utils.outputJSON = function (json) {
	console.log(typeof json === "object" ?
		JSON.stringify(json, null, "\t") : json);
}

Utils.loadAWSFile = function (path){
	var fs = require('fs');
	var data_raw = fs.readFileSync(path);
	var data = data_raw.toString();
	
	//regex to get the default secret access key
	var regex = /\[default\](.|\n)*?aws_secret_access_key=(.*)/;
	var match = regex.exec(data);
	if(match[2]){
		console.log("math1: " + match[2]);
		process.env['AWS_SECRET_ACCESS_KEY'] = match[2];
	} 
	
	//regex to get the default access access key id
	regex = /\[default\](.|\n)*?aws_access_key_id=(.*)/;
	match = regex.exec(data);
	if(match[2]) {
		console.log("math2: " + match[2]);
		process.env['AWS_ACCESS_KEY_ID'] = match[2];
	}
	console.log("ex");
}
