/*
 *	Library for storing and editng data
 */

// Deps
var fs = require('fs');
var path = require('path');
var helpers = require('./helpers')

// Container for the module

var lib = {};
//	Base dir 
lib.baseDir = path.join(__dirname, '/../.data/'); // take the location (where i am) and where I want to go and create a clean path towards it
// write data to the file

lib.create = function(dir, file, data, callback) {
	// try to open the file for writting
	fs.open(lib.baseDir+dir+'/'+file+'.json','wx', function(err, fileDescriptor) {
		if(!err && fileDescriptor) {
			// logic for what happens with the file it completes successfully
			// convert data to string
			var stringData = JSON.stringify(data);
			// write to file and close it
			fs.writeFile(fileDescriptor, stringData, function(err) {
				if(!err) {
					fs.close(fileDescriptor, function(err) {
						if(!err) {
							callback(false); // callback error set to false is a good thing means everything went through fine
						} else {
							callback('Could not close the file!');
						}
					});
				} else {
					callback('Error!! Could not save to file');
				}
			});
		} else {
			callback('Could not create the new file, it may already exist');
		}
	}); // apend the dir the file name and .json filename
};

// read data from file
//
lib.read = function (dir,file,callback) {
	fs.readFile(lib.baseDir+dir+'/'+file+'.json', 'utf-8', function(err, data) {
		if(!err && data) {
			var parsedData = helpers.parseJsonToObject(data);
			callback(false, parsedData);
		} else {
			callback(err, data)
		}
	})
};

// update existing data
lib.update = function(dir,file,data,callback) {
	// opn file
	fs.open(lib.baseDir+dir+'/'+file+'.json', 'r+', function(err, fileDescriptor) {
		if(!err && fileDescriptor) {
			// convert data to string
			var stringData = JSON.stringify(data);
			//  truncate contents of file
			fs.truncate(fileDescriptor, function(err) {
				if(!err) {
					// write to file and close
					fs.writeFile(fileDescriptor, stringData, function(err) {
						if(!err) {
							// close the file
							fs.close(fileDescriptor, function(err) {
								if(!err) {
									callback(false, err);
								} else {
									callback('Error closing the file');
								}
							});

						} else {
							callback('Error when writing to the file');
						}
					});
				} else {
					callback('Error truncating file');
				}
			});
		} else {
			callback('Could not open file for update, maybe it does not exist')
		}
	});
}

// delete file
lib.delete = function(dir, file, callback) {
	// unlinking -> removing file from fs
	fs.unlink(lib.baseDir+dir+'/'+file+'.json', function(err) {
		if(!err) {
			callback(false);
		} else {
			callback('Error deleting file');
		}
	});
};

// Lisgt all the items in a directory
lib.list = function(dir, callback) {
	fs.readdir(lib.baseDir+'dir'+'/'+function(err, data) {
		if(!err && data && data.length > 0) {
			var trimmedFileNames = [];
			data.forEach(function(fileName) {
				trimmedFileNames.push(fileName.replace('.json',''));
				callback(false, trimmedFileNames);
			});
		} else {
			callback(err, data);
		}
	});
}

module.exports = lib;
