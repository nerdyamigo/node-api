/*
 * Request handlers
 */

// Deps
var _data = require('./data');
var helpers = require('./helpers');

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

handlers.users = function(data, callback) {
	var acceptableMethods = ['post', 'get', 'put', 'delete'];
	if(acceptableMethods.indexOf(data.method) > -1) {
		handlers._users[data.method](data, callback);
	} else {
		console.log(data.method);
		callback(405); // Method not allowed
	}
};

// container fo users submethods
handlers._users = {}; 

handlers._users.post = function(data, callback) {
// users' post
// required fields: firstName, lastName, phone, password, tosAgreement
// optional: None
// Sanitazion: Make sure to check all required data is sent to use in proper format
	var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
	var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
	var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
	var password  = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
	var tosAgreement  = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

	if(firstName && lastName && phone && password && tosAgreement) {
		// make sure that the user does not exist already
		// read from the users data, if it comes back with error it does not exist
		_data.read('users', phone, function(err, data) {
			if(err) {
				// hash the password. DO NOT STORE ACTUAL PASSWORD
				var hashedPassword = helpers.hash(password);
				// make sure the password got hashed before saving the doc
				if(hashedPassword) {
		
					// Create the user pbj
					var userObject = {
						'firstName': firstName,
						'lastName': lastName,
						'phone': phone,
						'hashedPassword': hashedPassword,
						'tosAgreement': true
					};

					// Store user
					_data.create('users', phone, userObject, function(err) {
						if(!err) {
							callback(200)
						} else {
							callback(500,{ 'Error': 'Could not create new user' } )
						}
					}) 
				} else {
					// send error
					callback(400, {'Error': 'A user with that number already exists'});
				}
			} else {
				callback(500, { 'Error': 'Could not hash the password' })
			}
		});
	} else {
		callback(400, {'Error': 'Missing Required Fileds', 'fN': firstName, 'lN': lastName, 'password': password, 'tos': tosAgreement});
	}
};

// users' get
// Required: 
//
handlers._users.get = function(data, callback) {
// Check all required fields are filled out
};

// users' put
handlers._users.put = function(data, callback) {
};

//users' delete
// Required Field: phone
// Only allow athenticated user to deletes its own file
// Delete any other data that is associated with this user
handlers._users.delete = function(data, callback) {
	// Check that the phone number is valid
};

// Not Found handler
handlers.notFound = function(data, callback) {
	callback(404);
};


//export 
module.exports = handlers
