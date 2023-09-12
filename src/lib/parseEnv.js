'use strict';

if(process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
	require('dotenv').config();
}

const variables = process.env.APP_VARIABLES.split('&&&&');

for(let v of variables) {
  let variable = v.split('====');

  process.env[variable[0]] = variable[1];
}
