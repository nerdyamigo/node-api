/*
 *  Primary file for the API
 *
*/

// Dependecies
var http = require('http')
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./config');

// define what the server does using the http module
// The server should respond to all requests with a string

// start the server, and have it listen on port 3000

//  create server obj
var server = http.createServer(function(req, res) {

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
		var chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

		// construct the data object to send to the handler
		var data = {
			'trimmedPath' : trimmedPath,
			'queryStringObject': queryStringObject,
			'method': method,
			'headers': headers,
			'payload': buffer
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
	
});

server.listen( config.port, function() {
	console.log('The server is listening on port: ' + config.port + '\n' + 'Enviroment: ' + config.envName)
});

// Define handlers
var handlers = {};

// Sample handler
handlers.sample = function(data, callback) {
	// callback a http status code, and payload(should be an object)
	callback(406, {'name': 'sample handler'});
};

// Not Found handler
handlers.notFound = function(data, callback) {
	callback(404);
};

// Define a req router
var router = {
	'sample' : handlers.sample
}
