'use strict';

require('./lib/parseEnv.js');

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import api from './api';
import config from './config.json';

const app = express();

// CORS
app.use(cors({
	// origin: process.env.ALLOWED_URLS ? process.env.ALLOWED_URLS.split(',') : null,
	exposedHeaders: config.corsHeaders
}));

// accept large bodies
app.use(bodyParser.json({ parameterLimit: 5000000, limit: '5000kb' }));
app.use(bodyParser.urlencoded({ parameterLimit: 5000000, limit: '5000kb', extended: true }));

// logger
app.use(morgan('dev'));

// service static directory for all non-api requests
app.use(express.static('public'));

// API
app.use(api({ config }));

//  Export app
export default app;
