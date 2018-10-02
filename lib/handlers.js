/*
 * Request handlers
*/

// Deps
var _data = require('./data');
var helpers = require('./helpers');
var config = require('./config');


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

// Users handlers
handlers.users = function(data, callback) {
	var acceptableMethods = ['post', 'get', 'put', 'delete'];
	if(acceptableMethods.indexOf(data.method) > -1) {
		handlers._users[data.method](data, callback);
	} else {
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
// Required: users phone
// optional: none
handlers._users.get = function(data, callback) {
	// Check phone number is valid
	var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
	if(phone) {

		// Get token from header
		var token = typeof(data.headers.token) == 'string' ? data.headers.token : false

		// Verify given token is valid for the phone number 
		handlers._tokens.verifyToken(token, phone, function(tokenIsValid) {
			if(tokenIsValid) {
				// Do the req only if the token is valid
				// look up user
				_data.read('users', phone, function(err, data) {
					if(!err && data) {
						// delete the hashed password from the user object before returing it to requester
						delete data.hashedPassword;
						callback(200, data);
					} else {
						callback(400);
					}
				});
			} else {
				callback(403, {'Error': 'Missing requiered token in header or token is invalid'});
			} 
		});	
	} else {
		callback(400, {'Error': 'Missing required filed'});
	}

};

// users' put
// Required: phone
// Optional: firstName, lastName, password(at least one must be specified)
handlers._users.put = function(data, callback) {
	// Check required field

	var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
	// Check optional fields
	var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
	var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
	var password  = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

	// Error if phone is invlide
	if(phone) {
		// error if nothing is sent to update
		if(firstName || lastName || password) {
			var token = typeof(data.headers.token) == 'string' ? data.headers.token : false
			handlers._tokens.verifyToken(token, phone, function(tokenIsValid) {
				if(tokenIsValid) {

					_data.read('users', phone, function(err, userData) {
						if(!err && userData) {
							// update neccesarry fields
							if(firstName) {
								userData.firstName = firstName
							}	
							if(lastName) {
								userData.lastName = lastName;
							}
							if(password) {
								userData.password = helpers.hash(password);
							}
							// store new updates
							_data.update('users', phone, userData, function(err) {
								if(!err) {
									callback(200);
								} else {
									console.log(err)
									callback(500, {'Error': 'Could not update the user'});
								}
							});
						} else {
							callback(400, { 'Error': 'The specified user does not exist' });
						}
					});
				} else {
					callback(403, {'Error': 'Missing required token in header or token is invalid'});	
				}
			});
		} else {
			callback(400, { 'Error': 'Missing Fileds To Update' });
		}
	} else {
		callback(400, {'Error': 'Missing Required Field: Phone' });
	}
};

//users' delete
// Required Field: phone
// Only allow athenticated user to deletes its own file
handlers._users.delete = function(data, callback) {
	// Check that the phone number is valid
	var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
	if(phone) {
		// Verify 
		// Get token from header
		var token = typeof(data.headers.token) == 'string' ? data.headers.token : false

		// Verify given token is valid for the phone number 
		handlers._tokens.verifyToken(token, phone, function(tokenIsValid) {
			if(tokenIsValid) {
				// look up user
				_data.read('users', phone, function(err, data) {
					if(!err && data) {
						_data.delete('users', phone, function(err) {
							if(!err) {
								// Delete checks associated with user
								// 
								var userChecks = typeof(data.checks) == 'object' && data.checks instanceof Array ? data.checks : [];
								var checksToDelete = userChecks.length;
								if(checksToDelete > 0) {
									var checksDeleted = 0;
									var deletionErrors = false;
									// Loop throught the checks
									userChecks.forEach(function(checkId) {
										_data.delete("checks", checkId, function(err) {
											if(err) {
												deletionErrors = true;
											} else {
												checksDeleted++;
												if(checksDeleted == checksToDelete) {
													callback(200);
												} else {
													callback(500, {"Error": "errors encountered while attempting to delete the users checks, all checks may not have beend deleted successfully"});
												}
											}
										})
									});
								} else {
								callback(200);
								}

							} else {
								callback(500, {'Error': 'Could not delete User'});
							}
						});
					} else {
						callback(400, {'Error': 'Could not find user'});
					}
				});
			} else {
				callback(403, {'Error': 'Missing required token in header or token is invalid'});
			}
		});
	} else {
		callback(400, {'Error': 'Missing Required Field'});
	}
};


// Tokens handlers
handlers.tokens = function(data, callback) {
	var acceptableMethods = ['post', 'get', 'put', 'delete'];
	if(acceptableMethods.indexOf(data.method) > -1) {
		handlers._tokens[data.method](data, callback);
	} else {
		callback(405); // Method not allowed
	}
};

// Container for all the token methods
handlers._tokens = {};

// Tokens POST method
// Required: phone, password
// Optional: none 
handlers._tokens.post = function(data, callback) {
	var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
	var password  = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

	if(phone && password) {
		// look up user that matches this phone number
		// match users against pass
		_data.read('users', phone, function(err, userData) {
			if(!err && userData) {
				// Hash the password and compare to the pass that is stored in user obj
				var hashedPassword = helpers.hash(password);
				if(hashedPassword == userData.hashedPassword) {
					// if valid create a new token with a random name. Set expiration date 1 hour in the future
					var tokenId = helpers.createRandomString(20);
					var expires = Date.now() + 1000 * 60 * 60;
					var tokenObject = {
						'phone': phone,
						'id': tokenId,
						'expires': expires
					};
					// Store it
					_data.create('tokens', tokenId, tokenObject, function(err) {
						if(!err) {
							callback(200, tokenObject)
						} else {
							callback(500, {'Error': 'Could Not Create New Token!'});
						}
					})
				} else {
					callback(400, {'Error': 'Password Does Not Matched Specified Users Stored Password'});
				}
			} else {
				callback(400, {'Error': 'Could not find specified user'});
			}
		});
	} else {
		callback(400, {'Error': 'Missing Required Fields' });
	}
};

// Tokens GET method
// Required: id
// Optional: none
handlers._tokens.get = function(data, callback) {
	// Check that id is valid
	var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
	if(id) {
		// look up token
		_data.read('tokens', id, function(err, tokenData) {
			if(!err && tokenData) {
				// delete the hashed password from the user object before returing it to requester
				callback(200, tokenData);
			} else {
				callback(400);
			}
		});
	} else {
		callback(400, {'Error': 'Missing Required Field:', id});
	}

}

// Tokens PUT method
// Required: id, extend
// Optional: none
handlers._tokens.put = function(data, callback) {
	var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
	var extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;
	if(id && extend) {
		// Look up token
		_data.read('tokens', id, function(err, tokenData) {
			if(!err && tokenData) {
				// check token is not expired
				if(tokenData.expires > Date.now()) {
					// set the expiration an hour from now
					tokenData.expires = Date.now() + 1000 * 60 * 60

					// store new updates
					_data.update('tokens', id, tokenData, function(err) {
						if(!err) {
							callback(200);
						} else {
							callback(500, {'Error': 'Could not Update the tokens expiration'});
						}
					})
				} else {
					callback(400, {'Error' : 'Token has expired, cannot be expired'});
				}
			} else {
				callback(400, {'Error': 'Specified token does not exist'});
			}
		});
	} else {
		callback(400, {'Error': 'Missing required fields or fields are invalid!'});
	}
}

// Tokens DELETE method
// Required: id
// Optional: none
handlers._tokens.delete = function(data, callback) {
// Check that the id is valid
	var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
	if(id) {
		// look up token
		_data.read('tokens', id, function(err, data) {
			if(!err && data) {
				_data.delete('tokens', id, function(err) {
					if(!err) {
						callback(200);
					} else {
						callback(500, {'Error': 'Could not delete the specified token'});
					}
				});
			} else {
				callback(400, {'Error': 'Could not find specified token'});
			}
		});
	} else {
		callback(400, {'Error': 'Missing Required Field'});
	}
}


// Checks controller
handlers.checks = function(data, callback) {
	var acceptableMethods = ['post', 'get', 'put', 'delete'];
	if(acceptableMethods.indexOf(data.method) > -1) {
		handlers._checks[data.method](data, callback);
	} else {
		callback(405); // Method not allowed
	}
};

handlers._checks = {};

// Required: protocol, url to check, method, success codesCodes, timeOutSecs
// Optional: none
handlers._checks.post = function(data, callback) {
	// Validate all inputs
	var protocol = typeof(data.payload.protocol) == 'string' && ['http', 'https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
	var url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url : false;
	var method = typeof(data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
	var successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
	var timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 == 0 && data.payload.timeoutSeconds >=1 && data.payload.timeoutSeconds <=5 ? data.payload.timeoutSeconds : false;

	if(protocol && url && method && successCodes && timeoutSeconds) {
		// Get the token from headers
		var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
		// Look up user by token
		_data.read('tokens', token, function(err, tokenData) {
			if(!err, tokenData) {
				var userPhone = tokenData.phone;
				// Look up user data
				_data.read('users', userPhone, function(err, userData) {
					if(!err && userData) {
						// Identify the checks user already has
						var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
						// Verify that the user has less than the number of max checks per user
						if(userChecks.length < config.maxChecks) {
							// create a random id for the check
							var checkId = helpers.createRandomString(20);
							// Create the check object and include the users phone
							var checkObject = {
								'id': checkId,
								'userPhone': userPhone,
								'protocol': protocol,
								'url': url,
								'method': method,
								'successCodes': successCodes,
								'timeoutSeconds': timeoutSeconds
							}
							// create the checkObject in mem
							_data.create('checks', checkId, checkObject, function(err) {
								if(!err) {
									// Add the checkId to the users object
									userData.checks = userChecks;
									userData.checks.push(checkId);
									// Save the new user data
									_data.update('users', userPhone, userData, function() {
										if(!err) {
											callback(200, checkObject);
										} else {
											callback(500, {'Error': 'Could not update the user with the new check'});
										}
									});
								} else {
									callback(500, {'Error': 'Could not create the new check', 'Message': err});
								}
							})
						} else {
							callback(400, {'Error': 'The user already has the maximum number of checks ('+config.maxChecks+')'})
						}
					} else {
						callback(403)
					}
				});
			} else {
				callback(403);
			}
		});
	} else {
		callback(403, {'Error': 'Missing required fields or inputs are invalid'});
	}
};

// Checks - get
// Required: id
// Optional: none
handlers._checks.get = function(data, callback) {
	// Check id is valid
	var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
	if(id) {
		// Lookup the check 
		_data.read('checks', id, function(err, checkData) {
			if(!err && checkData) {
				// Get token from header
				var token = typeof(data.headers.token) == 'string' ? data.headers.token : false

				// Verify given token is valid and belongs to user that created the check 
				handlers._tokens.verifyToken(token, checkData.userPhone, function(tokenIsValid) {
					if(tokenIsValid) {
						// Return the check data
						callback(200, checkData);
					} else {
						callback(403)
					}
				});
			} else {
				callback(403, {'Error': 'Missing requiered token in header or token is invalid'});
			} 
		});	
	} else {
		callback(400, {'Error': 'Missing required filed'});
	}
};

// Checks - put
// Required: id
// Optional: protocol, url, method, successCodes, timeoutSeconds (one must be set)
//

handlers._checks.put = function(data, callback) {
	var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
	// Check optional fields
	// Validate all inputs
	var protocol = typeof(data.payload.protocol) == 'string' && ['http', 'https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
	var url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url : false;
	var method = typeof(data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
	var successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
	var timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 == 0 && data.payload.timeoutSeconds >=1 && data.payload.timeoutSeconds <=5 ? data.payload.timeoutSeconds : false;

	if(id) {
		// Check to mar sure one or more optional fielda are being sent
		if(protocol || url || method || successCodes || timeoutSeconds) {
			// Lookup check
			_data.read('checks', id, function(err, checkData) {
				if(!err && checkData) {
					var token = typeof(data.headers.token) == 'string' ? data.headers.token : false

					// Verify given token is valid and belongs to user that created the check 
					handlers._tokens.verifyToken(token, checkData.userPhone, function(tokenIsValid) {
						if(tokenIsValid) {
							// update the check where neccesary
							if(protocol) {
								checkData.protocol = protocol;
							}
							if(url) {
								checkData.url = url
							}
							if(method) {
								checkData.method = method;
							}
							if(successCodes)  {
								checkData.successCodes = successCodes;
							}
							if(timeoutSeconds){
								checkData.timeoutSeconds = timeoutSeconds;
							}
							// store updates
							_data.update('checks', id, checkData, function(err) {
								if(!err) {
									callback(200);
								} else {
									callback(500, {'Err': 'Could not update the check'});
								}
							});
						} else {
							callback(403);
						}
					});

				} else {
					callback(400 , {'Error': 'Check ID did not exist'});
				}
			});
		} else {
			callback(400, {'Error': 'Missing fields to update'});
		}
	} else {
		callback(400, {'Error': 'Missing required fields'})
	}

};
// Checks Delete
// Required: id
// Optional: none
handlers._checks.delete = function(data, callback) {
	// Check that the id  number is valid
	var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;

	if(id) {
		// Look up check 
		_data.read('checks', id, function(err, checkData) {
			if(!err && checkData) {
				// Get token from header
				var token = typeof(data.headers.token) == 'string' ? data.headers.token : false
				// Verify given token is valid for the phone number 
				handlers._tokens.verifyToken(token, checkData.userPhone, function(tokenIsValid) {
					if(tokenIsValid) {
						// delete check 
						_data.delete("checks", id, function(err) {
							if(!err) {
							// look up user
								_data.read('users', checkData.userPhone, function(err, userData) {
									if(!err && userData) {
										// Figure out the users checks
										var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
										// removed the delete check from their list of checks
										var checkPosition = userChecks.indexOf(id);
										if(checkPosition > -1) {
											userChecks.splice(checkPosition,1);
			
											_data.update('users', checkData.userPhone,userData, function(err) {
												if(!err) {
													callback(200);
												} else {
													callback(500, {'Error': 'Could not update the user'});
												}
											});		

										} else {
											callback(500, {"Erro": "Could not find the check in user object, might not exist"})
										}

									} else {
										callback(500, {'Error': 'Could not find user who created the check, in return the check could not be removed from the user object'});
									}
								});
							} else {
								callback(500, {"Error": "Could not delete the check data"});
							}
						});

					} else {
						callback(403);
					}
				});

			} else {
				callback(400, {"Error": "The specified check ID does not exist"});
			}
		});
	} else {
		callback(400, {'Error': 'Missing Required Field'});
	}
};
// Verify if a given token id is currently valid for a given user
handlers._tokens.verifyToken = function(id, phone, callback) {
	// Look up token
	_data.read('tokens', id, function(err, tokenData) {
		if(!err, tokenData) {
			// check the token is for the given user and that the token has NOT expired!!
			if(tokenData.phone == phone && tokenData.expires > Date.now()) {
				callback(true);
			} else {
				callback(false);
			}
		} else {
			callback(false);
		}
	});
}

// Not Found handler
handlers.notFound = function(data, callback) {
	callback(404);
};


//export 
module.exports = handlers
