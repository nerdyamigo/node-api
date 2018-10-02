/*
 *  Worker related taks
*/

// Deps
var path = require('path');
var fs = require('fs');
var _data = require('./data');
var https = require('https');
var http = require('http');
var helpers = require('./helpers');
var url = require('url');

// Instatiate the worker object

var workers = {};

// Timer to execute the worker-process once per minute

workers.loop = function() {
	setInterval(function() {
		workers.gatherAllChecks();
	}, 1000 * 60);
};

// Look up all the checks get their data and sent to validator
workers.gatherAllChecks = function() {
	// get all checks
	_data.list('checks', function(err, checks) {
		if(!err && checks && checks.length > 0) {
			checks.forEach(function(check) {
				// Read in the check data
				_data.read('checks', check, function(err, originalCheckData) {
					if(!err && originalCheckData) {
						// Pass it to the validator and let that func do the rest
						workers.validateChecksData(originalCheckData);
					} else {
						console.log("Error while reading one of the checks data);
					}
				});
			});
		} else {
			console.log("Error: Could not find any checks");
		}
	});
}

// Sanity check the check-data
workers.validateCheckData = function(originalCheckData) {
	// Here we validate the originalCheckData that is coming in 
	// Check to make sure check data is an object and the it is not null
	originalCheckData = typeof(originalCheckData) =='object' && originalCheckData !== null ? originalCheckData : {};
	// Check the id
	originalCheckData.id = typeof(originalCheckData.id) == 'string' && originalCheckData.id.trim().length == 20 ? originalCheckData.id : false
	// Check the phone number
	originalCheckData.phone = typeof(originalCheckData.phone) == 'string' && originalCheckData.phone.trim().length == 10 ? originalCheckData.phone : false
	// Check the protocol - should be either http || https
	originalCheckData.protocol = typeof(originalCheckData.protocol) == 'string' && ['http', 'https'].indexOf(originalCheckData.protocol) > -1 ? originalCheckData.protocol : false
	// Check the url
	originalCheckData.url = typeof(originalCheckData.url) == 'string' && originalCheckData.url.trim().length > 0? originalCheckData.url : false
	// Check the method 
	originalCheckData.method = typeof(originalCheckData.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(originalCheckData.method) > -1 ? originalCheckData.method : false
	// Check the successCodes
	originalCheckData.successCodes = typeof(originalCheckData.successCodes) == 'object' && originalCheckData.successCodes instanceof Array && originalCheckData.successCodes.length > 0 ? originalCheckData.successCodes : false
	// Check the timeoutSeconds
	originalCheckData.timeoutSeconds = typeof(originalCheckData.timeoutSeconds) == 'number' && originalCheckData.timeoutSeconds % 1 === 0 && originalCheckData >=1 && originalCheckData.timeoutSeconds <= 5 ? originalCheckData.timeoutSeconds : false


};

// Init the script
workers.init = function() {
	// Execute all the checks 
	worker.gatherAllCheck();	
	// Call the loop so the checks will execute later on
	worker.loop();
};

// Export the module 
module.exports = workers; 

