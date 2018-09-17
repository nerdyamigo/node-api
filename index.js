/*
 *  Primary file for the API
 *
 */

// Dependecies
var http = require('http')
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;

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

		// once request is done
		res.end('Hello world\n');
		// log what path the person was asking for
		console.log('Request received with the following payload: \n', buffer);
	})
	
});

server.listen(3000, function() {
  console.log('The server is listening on port 3000')
})

