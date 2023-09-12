'use strict';

import app from './app';
import config from './config.json';

const cluster  = require('cluster');
const numCPUs  = require('os').cpus().length;

const PORT = (process.env.PORT || config.port);

const http = require('http').createServer(app);

const listen = (log) => {
  return http.listen(PORT, () => {
    console.log(log);
  });
}

// use multiple workers
if( cluster.isMaster && numCPUs > 1 && process.env.NODE_ENV === 'production' ) {
	for( let i = 0; i < numCPUs; i++ ) {
			cluster.fork();
	}
	console.log( `Master thread PID:${ process.pid }, starting clusters...` );
} else {
	listen( `Worker thread PID:${ process.pid } started, port ${ process.env.PORT }`);
}

export default app;
