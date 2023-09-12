// parse .env public api keys/values for client-side code

var dest = './public/build/env.js';

var fs = require('fs');
var obj = {};
var arr, i, service;

// define which env variables should be passed to the client side
var whitelist = [];

fs.readFile('./.env', function(err, data) {
  // stringify data & keep line breaks consistant
	data = data.toString().replace(/(\r\n|\r)/gm,'\n').split('\n');

  // for each value in data array
	for (i = 0; i < data.length; i++) {
		// split value into array
		arr = data[i].split("=");
		// grab whitelisted
		if(whitelist.indexOf(arr[0]) > -1) {
      // object key/value pairs
  		obj[arr[0]] = arr[1];
    }
	}
  // stringify object
	data = JSON.stringify(obj, null, 2);

  // ANGULAR EXAMPLE; CHANGE FORMAT TO FIT YOUR ENVIRONMENT/FRAMEWORK/NEEDS
  // create angular service
	service = `app.service('Env', function(){\n  return ${data}\n});`
	// write file
	fs.writeFile(dest, service, function(err) {
		if(err) console.log(err);
  });
});

console.log(`copied env variables to ${dest}`)
