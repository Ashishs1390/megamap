import {
	Router
} from 'express';
var _ = require('lodash');
import GraphJS from '../lib/graph';
import GraphAPI from '../lib/db_api'
import Validators from '../lib/validators';
var uuidv1 = require('uuid/v1');


//api.use('/node', nodes({config, db}));
export default ({ config, db, broadcast }) => {
	let api = Router();

	//Capability Dashboard View Getters for 3 Role Views

	api.get("/admin/:uuid", (req, res) => {
		let SubGraph = {};
		let GetLibrary = FullfillLibraryView(SubGraph, `MATCH (n:Capability)-[:author|facilitator]->(p:Person {uuid:'${req.params.uuid}'}) RETURN n`);
		GetLibrary.then(() => res.send(SubGraph));
		GetLibrary.catch((err) => res.status(500).send(err));
	});
	api.get("/tenant", (req, res) => {
		let SubGraph = {};
		let GetLibrary = FullfillLibraryView(SubGraph, `MATCH (n:Capability) RETURN n`);
		GetLibrary.then(() => res.send(SubGraph));
		GetLibrary.catch((err) => res.status(500).send(err));
	});

	//Library View Shared logic
	function FullfillLibraryView(SubGraph, query) {
		console.log(query);
		return new Promise(function (resolve, reject) {
			db.cypher({
				query: query
			}, function (err, results) {
				if (err || !results || results.length == 0 || results[0] == null) {
					reject(err || { message: "No Capabilitys" });
				} else {
					results.map((result) => { GraphJS.MergeNode(result.n, SubGraph) });
					let Expand = ExpandLibraryCard(SubGraph, SubGraph.node_label_index.Capability);
					Expand.then(() => resolve(SubGraph));
					Expand.catch((err) => reject(err));
				}
			});
		})
	}

	function ExpandLibraryCard(SubGraph, capability_uuid_array) {
		return new Promise(function (resolve, reject) {
			let Outgoing = GraphAPI.GetOutgoingRels(capability_uuid_array, SubGraph, 'author', db);
			Outgoing.then(() => {
				resolve();
			});
			Outgoing.catch(() => reject());
		})
	}

	return api;
}
