/*
 *Primary file for the API
 *
*/

// Dependecies
var server = require('./lib/server')
var workers = require('./lib/workers');

// Declare the app
var app = {};

// Init function
app.init = function() {
	// Start server
	server.init();
	workers.init();
};

// Exec
app.init();

// Export the app

module.exports = app;


