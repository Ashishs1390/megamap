Ruptive
==================================

- Nodejs (Node 14) + Express
- ES6 support via [babel](https://babeljs.io)
- CORS support via [cors](https://github.com/troygoode/node-cors)
- Body Parsing via [body-parser](https://github.com/expressjs/body-parser)
- Graph Database via [Neo4jr](https://neo4j.com/)


Getting Started
---------------

```sh
clone repository, cd into project

# For Windows machines, Install windows build tools (required for node-sass package). Run as administrator:
npm install -g windows-build-tools

# Install Global dependencies
$ npm install -g gulp nodemon prompt

# Install Package dependencies
$ npm install

# Create .env file at the root of yoru project by copying the example
$ cp .env-example .env

# Start development live-reload server for client and api
$ gulp start
```

Your gulp server is running on localhost port 3000, which proxies to your api server port. 
Ruptive uses wildcard subdomains, so to use a subdomain in your local environment, you can use the registered domain name lvh.me (which points to localhost).

Example: indigo.lvh.me:3000

To change your database connection string, edit the GRAPH_URL variable in your .env file and restart the server
