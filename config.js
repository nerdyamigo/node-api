/*
 *  create and export configuration variables
 */

// container fo all envs 

var enviroments = {};

// Staging (default)
enviroments.staging = {
	'port': 3000,
	'envName': 'staging'
};

// Production 
enviroments.production = {
	'port': 5000,
	'envName': 'production'
};

// Determine which enviroment was passed as a command line arg
var currentEnviroment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check that the current env is defined in our config
var enviromentToExport = typeof(enviroments[currentEnviroment]) == 'object' ? enviroments[currentEnviroment] : enviroments.staging;

// expor the module

module.exports = enviromentToExport;
