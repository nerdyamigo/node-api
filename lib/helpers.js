/* 
 * Helpers for various tasks used in our API
*/

// DEPS
var crypto = require('crypto');
var config = require('./config');

var helpers = {};

// create a SHA256 hash
helpers.hash = function(str) {
	if(typeof(str) == 'string' && str.length > 0) {
		var hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
		return hash;
	} else {
		return false;
	}
};

// turn the string and return a json object or returns false
helpers.parseJsonToObject = function(str) {
	try {
		var obj = JSON.parse(str);
		return obj; 
	} catch(e) {
		return {};
	}
};






// export the module 
module.exports = helpers;
