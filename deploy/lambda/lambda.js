'use strict';

const compression          = require( 'compression' );
const awsServerlessExpress = require( 'aws-serverless-express' )
const awsMiddleware        = require( 'aws-serverless-express/middleware' );

// NOTE: If you get ERR_CONTENT_DECODING_FAILED in your browser, this is likely
// due to a compressed response (e.g. gzip) which has not been handled correctly
// by aws-serverless-express and/or API Gateway. Add the necessary MIME types to
// binaryMimeTypes below, then redeploy (`npm run package-deploy`)
const binaryMimeTypes = [
  'application/javascript',
  'application/json',
  'application/octet-stream',
  'application/xml',
  'font/eot',
  'font/opentype',
  'font/otf',
  'font/woff',
  'font/woff2',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/svg+xml',
  'image/x-icon',
  'image/vnd.microsoft.icon',
  'text/comma-separated-values',
  'text/css',
  'text/html',
  'text/javascript',
  'text/plain',
  'text/text',
  'text/xml'
]

exports.handler = async ( event, context ) => {

  //prevent timeout from waiting event loop
  context.callbackWaitsForEmptyEventLoop = false;

  const api = require( './dist/app.js' ).default

  api.use( compression());
  api.use( awsMiddleware.eventContext());

  const app = awsServerlessExpress.createServer( api, null, binaryMimeTypes )

  return awsServerlessExpress.proxy( app, event, context, 'PROMISE' ).promise

}
