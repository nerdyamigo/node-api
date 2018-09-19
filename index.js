/*
 *  Primary file for the API
 *
*/

// Dependecies
var http = require('http')
var https = require('https')
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./config');
var fs = require('fs');
var _data = require('./lib/data');

// TEST
// @TODO DELETE 
//
_data.delete('test', 'newFile', function(err) {
	if(!err) {
		console.log('Action worked');
		return;
	} else {
		console.log('this was an err ', err)
	}
});


// define what the server does using the http module
// The server should respond to all requests with a string

// start the server, and have it listen on port 3000

//  create server obj
var httpServer = http.createServer(function(req, res) {
	unifiedServer(req, res);	
});

// Instatiate the HTTP server
httpServer.listen( config.httpPort, function() {
	console.log('The server is listening on port: ' + config.httpPort + '\n' )
});

var httpsServerOptions = {
	'key': fs.readFileSync('./https/key.pem'),
	'cert': fs.readFileSync('./https/cert.pem')
};

// Instatiate the https server
var httpsServer = https.createServer(httpsServerOptions, function(req, res) {
	unifiedServer(req, res);	
});

// Start the HTTPS server
httpsServer.listen( config.httpsPort, function() {
	console.log('The server is listening on port: ' + config.httpsPort + '\n' )
});

// Define handlers
var handlers = {};

// Ping handler
handlers.ping = function(data, callback) {
	// callback a http status code, and payload(should be an object)
	callback(200);
};

handlers.hello = function(data, callback) {
	callback(200, {welcome: 'Welcome!!!'})
};

// Not Found handler
handlers.notFound = function(data, callback) {
	callback(404);
};

// Define a req router
var router = {
	'ping' : handlers.ping,
	'hello': handlers.hello
}

// All the server logic for both http and https
var unifiedServer = function(req, res) {

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

};
