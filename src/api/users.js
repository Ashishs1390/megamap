import {
	Router
} from 'express';
var _ = require('lodash');
var uuidv1 = require('uuid/v1');

import GraphJS from '../lib/graph';
import GraphAPI from '../lib/db_api'

import Validators from '../lib/validators';


//api.use('/node', nodes({config, db}));
export default ({
	config,
	db,
	broadcast
}) => {

	let api = Router();

	// get all users
	api.get("/", (req, res) => {
		let SubGraph = {};
		db.cypher({
			query: `MATCH (n:Person) RETURN n `
		}, function (err, results) {
			if (err) { res.status(500).send({ message: err }); return; }
			results.map((result) => { GraphJS.MergeNode(result.n, SubGraph) });
			res.send(SubGraph);
		});
	});

	api.get("/new", (req, res) => {
		let query = `
			MATCH (n:Person) WHERE NOT EXISTS(n.event) AND n.email =~ '(?i).*${req.query.searchTerm}.*' OR n.firstname =~ '(?i).*${req.query.searchTerm}.*' OR n.alias =~ '(?i).*${req.query.searchTerm}.*' OR n.lastname =~ '(?i).*${req.query.searchTerm}.*'
			RETURN properties(n) as user ORDER BY LOWER(n.${req.query.orderBy}) <> '' AND LOWER(n.${req.query.orderBy}) IS NOT NULL DESC, LOWER(n.${req.query.orderBy}) ${req.query.sort || 'ASC'} SKIP ${req.query.skip} LIMIT ${req.query.limit}`;
		db.cypher({
			query:query
		}, function (err, results) {
			if (err) { res.status(500).send({ message: err }); return; }
			let users = results.map(result => { delete result.user.password; return result.user })
			res.send(users);
		});
	});

	api.get("/new/count", (req, res) => {
		db.cypher({
			query: `MATCH (n:Person) WHERE NOT EXISTS(n.event) AND (n.email =~ '(?i).*${req.query.searchTerm}.*' OR n.firstname =~ '(?i).*${req.query.searchTerm}.*' OR n.alias =~ '(?i).*${req.query.searchTerm}.*' OR n.lastname =~ '(?i).*${req.query.searchTerm}.*')  RETURN count(n) as count`
		}, function (err, results) {
			res.send(...results);
		});
	});

	api.post('/generate', (req, res) => {
		if( req.body.users ) {
			// split text at line breaks
			let users = req.body.users.split(/\r\n|\r|\n/g).reduce((filtered, string) => {
				// filter: return if true and if formated as an email address
				if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(string)) {
					let user = {}
					user.email = string.toLowerCase();
					user.properties = {
						uuid: uuidv1(),
						title: string,
						password: Math.random().toString(36).slice(-8),
						created_at: Date.now()
					}
					filtered.push( user )
				}
				return filtered;
			}, [])

			// res.status(200).send(users)
			db.cypher({
				query: `
				  UNWIND {users} as row
					MERGE (p:Person {email: row.email})
					ON CREATE SET p += row.properties
				`,
				params: {
					users: users
				}
			}, (err, results) => {
				console.log(err, results)
				if (err) {
					res.status(500).send({ message: err });
				}
				else {
					res.status(200).send(users);
				}
			});
		}
		else {
			res.status(200).send({users: []});
		}




	})

	api.put("/update", (req, res) => {
		if(req.body.user.email) {
			req.body.user.email = req.body.user.email.toLowerCase();
			req.body.user.title = req.body.user.email;
		}
		let query = `MATCH (n:Person{uuid:{uuid}}) `
		Object.keys(req.body.user).forEach(function(key) {
			query += `SET n.${key} = {${key}} `
		})
		console.log(query)
		db.cypher({
			query: query,
			params: req.body.user
		}, function (err, results) {
			if (err) { res.status(500).send({ message: err }); return; }
			let users = results.map(result => { delete result.user.password; return result.user })
			res.send(users);
		});
	});

	api.get("/admin/", (req, res) => {
		let SubGraph = {};
		db.cypher({
			query: `MATCH (n:Person) RETURN n`
		}, function (err, results) {
			if (err) { res.status(500).send({ message: err }); return; }
			results.map((result) => { GraphJS.MergeNode(result.n, SubGraph) });
			res.send(SubGraph);
		});
	});
	api.get("/admin/", (req, res) => {
		let SubGraph = {};
		db.cypher({
			query: `MATCH (n:Person) RETURN n`
		}, function (err, results) {
			if (err) { res.status(500).send({ message: err }); return; }
			results.map((result) => { GraphJS.MergeNode(result.n, SubGraph) });
			res.send(SubGraph);
		});
	});
	api.put("/admin/:uuid/:admin", (req, res) => {
		let SubGraph = {};
		db.cypher({
			query: `MATCH (n:Person {uuid:'${req.params.uuid}'}) set n.admin = ${req.params.admin} RETURN n`
		}, function (err, results) {
			if (err) { res.status(500).send({ message: err }); return; }
			results.map((result) => { GraphJS.MergeNode(result.n, SubGraph) });
			res.send(SubGraph);
		});
	});

  // get a single user by uuid
	api.get("/:uuid", (req, res) => {
		let subGraph = {};
		let GetPivot = GraphAPI.AddRemoteNodeToSubgraph(req.params.uuid, subGraph, db);
		GetPivot.then(()=>{
			res.send(subGraph)
		});
		GetPivot.catch(()=>{});
	});


	return api;
}
