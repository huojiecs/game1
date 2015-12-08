# hotRequire

	hotRequire hot-loads modules by extending the system's require() function using the fs.fileWatch() routine (which already comes with node).
	Hot-loading means it watches the file for changes and then reloades it's eval'd content into the variable set by the user.

	Important: It does NOT rewrite the require(); method rahter than utilizing and extending it.

	The file watcher emits catchable events to the process. These events are "modified", "removed" and "reloaded".

## Usage

	var hotrequire = require('./hotrequire.js');
	
	var example = hotrequire('./example.js', function(module) {
		example = module
	});
	
	// or
	
	var example = require.hot('./example.js', function(module) {
		example = module
	});
	
	console.log(example.message);

## Requirements

* fs.js & node-waf & v8.h (Comes with node)

## Installation

	npm install hotrequire
