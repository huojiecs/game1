var hotrequire = require('./hotrequire.js');

var example = require.hot('./examplemodule.js', function(module) {
	example = module;
});

console.log(example.message); // Outputs the message of the module

process.on('modified', function(file) { // Debug information
	console.log('['+new Date()+': '+file+' reloaded]');
});

process.on('removed', function(file) { // Debug information
	console.log('['+new Date()+': '+file+' was removed, stop observing]'); // To force this message simply rename the example.js to whatever you want.
});

var self = this;
process.on('reloaded', function(file) { // Debug information
	console.log(example.message); // Will output the new message of the module (after you have changed it)
});
