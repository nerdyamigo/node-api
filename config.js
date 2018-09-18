/*
 *  create and export configuration variables
 */

// container fo all envs 

var enviroments = {};

// Staging (default)
enviroments.staging = {
	'httpPort': 3000,
	'httpsPort': 3001,
	'envName': 'staging'
};

// Production 
enviroments.production = {
	'httpPort': 5000,
	'httpsPort': 5001,
	'envName': 'production'
};

// Determine which enviroment was passed as a command line arg
var currentEnviroment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check that the current env is defined in our config
var enviromentToExport = typeof(enviroments[currentEnviroment]) == 'object' ? enviroments[currentEnviroment] : enviroments.staging;

// expor the module

module.exports = enviromentToExport;
