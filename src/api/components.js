import {
	Router
} from 'express';
var _ = require('lodash');
import GraphJS from '../lib/graph';
import GraphAPI from '../lib/db_api'
import Validators from '../lib/validators';
var uuidv1 = require('uuid/v1');

const whitelist = [
	'Service',
	'App',
	'DataSource',
	'Initiative',
	'Capability',
	'Mot',
	'Process'
]

//api.use('/node', nodes({config, db}));
export default ({ config, db, broadcast }) => {
	let api = Router();

	//Generic Component Dashboard View Getters for 3 Role Views

	api.get("/admin/:uuid/:label", (req, res) => {
		if(whitelist.includes(req.params.label)) {
			let SubGraph = {};
			let GetLibrary = FullfillLibraryView(SubGraph, `MATCH (n:${req.params.label})-[:author|facilitator]->(p:Person {uuid:'${req.params.uuid}'}) RETURN n`, req.params.label);
			GetLibrary.then(() => res.send(SubGraph));
			GetLibrary.catch((err) => res.status(500).send(err));
		}
		else {
			res.status(200).send('no data')
		}
	});
	api.get("/tenant/:label", (req, res) => {
		if(whitelist.includes(req.params.label)) {
			let SubGraph = {};
			let GetLibrary = FullfillLibraryView(SubGraph, `MATCH (n:${req.params.label}) RETURN n`, req.params.label);
			GetLibrary.then(() => res.send(SubGraph));
			GetLibrary.catch((err) => res.status(500).send(err));
		}
		else {
			res.status(200).send('no data')
		}
	});

	//Library View Shared logic
	function FullfillLibraryView(SubGraph, query, label) {
		console.log(query);
		return new Promise(function (resolve, reject) {
			db.cypher({
				query: query
			}, function (err, results) {
				if (err || !results || results.length == 0 || results[0] == null) {
					reject(err || { message: `No ${req.params.label}s` });
				} else {
					results.map((result) => { GraphJS.MergeNode(result.n, SubGraph) });
					let Expand = ExpandLibraryCard(SubGraph, SubGraph.node_label_index[label]);
					Expand.then(() => resolve(SubGraph));
					Expand.catch((err) => reject(err));
				}
			});
		})
	}

	function ExpandLibraryCard(SubGraph, uuid_array) {
		return new Promise(function (resolve, reject) {
			let Outgoing = GraphAPI.GetOutgoingRels(uuid_array, SubGraph, 'author', db);
			Outgoing.then(() => {
				resolve();
			});
			Outgoing.catch(() => reject());
		})
	}

	return api;
}
