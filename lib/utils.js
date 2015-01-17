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


