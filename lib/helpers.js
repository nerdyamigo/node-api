/* 
 * Helpers for various tasks used in our API
*/

// DEPS
var crypto = require('crypto');
var config = require('./config');
var https = require('https');
var querystring = require('querystring');

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

// String of random alpha num chars of a given length
helpers.createRandomString = function(strLength) {
	strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
	if(strLength) {
		// define all possible chars that could go into this string
		var possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789'
		// start the final string
		var str = '';

		for( var i=0; i < strLength; i ++) {
			// Get random char from the possible chars
			var randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length ));
			// Append char to final str
			str+=randomCharacter
		}
		// Return the final string
		return str;
	} else {
		return false;
	}
};


// Send SMS messages via twilio

helpers.sendTwilioSms = function(phone, msg, callback) {
	// Validate params
	phone = typeof(phone) == 'string' && phone.trim().length == 10 ? phone : false;
	msg = typeof(msg) == 'string' && msg.trim().length > 0 && msg.trim().length <= 1600 ? msg.trim() : false;
	if(phone && msg) {
		// configure payload
		var payload = {
			'From': config.twilio.fromPhone,
			'To': '+1'+phone,
			'Body': msg
		};

		// configure the request details for our payload
		// Stringify the payload
		var stringPayload = querystring.stringify(payload);
		// Create req deatils
		var requestDetails = {
			'protocol': 'https:',
			'hostname': 'api.twilio.com',
			'method': 'POST',
			'path': '/2010-04-01/Accounts/'+config.twilio.accountSid+'/Messages.json',
			'auth': config.twilio.accountSid+':'+config.twilio.authToken,
			'headers': {
				'Content-Type': 'application/x-ww-form-encoded',
				'Content-Length': Buffer.byteLength(stringPayload)
			}
		}

		// Instattiate req object
		var req = https.request(requestDetails, function(res) {
			// Grab status of the sent req
			var status = res.statusCode;
			// Callback successfully if the request went through
			if(status == 200 || status == 201) {
				callback(false);
			} else {
				callback('Status Code return was '+status);
			}
		});

		// Bind to an error event in case it errors out
		req.on('error', function(err) {
			callback(err);
		});

		// add payload
		req.write(stringPayload);

		//end req
		req.end();

	} else {
		callback("Given Params Where Invalid!");
	}
	
};


// export the module 
module.exports = helpers;
