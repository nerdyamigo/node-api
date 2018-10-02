/*
 *  create and export configuration variables
 */

// container fo all envs 

var enviroments = {};

// Staging (default)
enviroments.staging = {
	'httpPort': 3000,
	'httpsPort': 3001,
	'envName': 'staging',
	'hashingSecret': 'thisIsASecret',
	'maxChecks': 5,
	'twilio': {
		'accountSid':"AC69c86ec0962017cb7eb6ca263d145672",
		'authToken':"1b9e82ad1b4f2b89041b4ebba5573dcb",
		'fromPhone': "+16292065981"
	}
};

// Production 
enviroments.production = {
	'httpPort': 5000,
	'httpsPort': 5001,
	'envName': 'production',
	'hashingSecret': 'thisIsAnotherSecret',
	'maxChecks': 5,
	'twilio': {
		'accountSid':"AC69c86ec0962017cb7eb6ca263d145672",
		'authToken':"1b9e82ad1b4f2b89041b4ebba5573dcb",
		'fromPhone': "6292065981"
	}
};

// 800770468cz6326
// Determine which enviroment was passed as a command line arg
var currentEnviroment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check that the current env is defined in our config
var enviromentToExport = typeof(enviroments[currentEnviroment]) == 'object' ? enviroments[currentEnviroment] : enviroments.staging;

// expor the module

module.exports = enviromentToExport;
