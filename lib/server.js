/*
 * Server related taks  
*/

// Dependecies
var http = require('http')
var https = require('https')
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./config');
var fs = require('fs');
var _data = require('./data');
var handlers = require('./handlers');
var helpers = require('./helpers');
var path = require('path');


// Instatiate the server module object
var server = {}



// define what the server does using the http module
// The server should respond to all requests with a string

// start the server, and have it listen on port 3000

server.httpsServerOptions = {
	'key': fs.readFileSync(path.join(__dirname,'/../https/key.pem')),
	'cert': fs.readFileSync(path.join(__dirname,'/../https/cert.pem'))
};

// Instatiate the https server
server.httpsServer = https.createServer(server.httpsServerOptions, function(req, res) {
	server.unifiedServer(req, res);	
});
// Instatiate the HTTP server
//  create server obj
server.httpServer = http.createServer(function(req, res) {
	server.unifiedServer(req, res);	
});

// Define a req router
server.router = {
	'ping' : handlers.ping,
	'hello': handlers.hello,
	'users': handlers.users,
	'tokens': handlers.tokens,
	'checks': handlers.checks
}

// All the server logic for both http and https
server.unifiedServer = function(req, res) {

	// get url and parse it
	// get the path from the url
	// send a response
	var parsedUrl = url.parse(req.url, true);
	var path = parsedUrl.pathname;
	var trimmedPath = path.replace(/^\/+|\/+$/g,'');

	// get the query string, parse it, as an pbject
	var queryStringObject = parsedUrl.query;

	// get the http method used
	var method = req.method.toLowerCase();

	// get the headers as an object
	var headers = req.headers;

	// get the payload if there is any
	var decoder = new StringDecoder('utf-8');
	var buffer = '';

	req.on('data', function(data) {
		buffer += decoder.write(data);
	});

	req.on('end', function() {
		buffer += decoder.end();

		// chose handler this req should go to. If one is not found use the notFound handler
		var chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;

		// construct the data object to send to the handler
		var data = {
			'trimmedPath' : trimmedPath,
			'queryStringObject': queryStringObject,
			'method': method,
			'headers': headers,
			'payload': helpers.parseJsonToObject(buffer)
		}

		// route req to the handler specified in handler
		chosenHandler(data, function(statusCode, payload) {

			// Use the satus code called back by the handler or default to 200
			statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
			// Use the payload called back by the handler, or default to ''
			payload = typeof(payload) == 'object' ? payload : {};

			// send string back, convert payload to strg
			var payloadString = JSON.stringify(payload);

			// set the header content type so that apps know we are dealing with JSON
			res.setHeader('Content-Type', 'application/json');

			// return result
			res.writeHead(statusCode);
			res.end(payloadString);

			// log what path the person was asking for
			console.log('Returning this response: \n', statusCode, payloadString);

		});
		
	});

};

// Init script
server.init = function() {
	// Start the http server

	server.httpServer.listen( config.httpPort, function() {
		console.log('The server is listening on port: ' + config.httpPort + '\n' )
	});

	// Start the HTTPS server
	server.httpsServer.listen( config.httpsPort, function() {
		console.log('The server is listening on port: ' + config.httpsPort + '\n' )
	});

};
module.exports = server;
