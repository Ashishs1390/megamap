
import { Router } from 'express';
var _ = require('lodash');
import GraphJS from '../../lib/graph';



//var uuidv1 = require('uuid/v1')


//api.use('/node', nodes({config, db}));
export default ({ config, db }) => {

	let api = Router();

	let seed_graph = {
		nodes: {
			"Example_Journey": {
				labels: ["Journey"],
				properties: {title:"Example Journey", uuid:"Example_Journey"}
			},
			"Example_Strategy": {
				labels: ["Strategy"],
				properties: {title:"Example Strategy", uuid:"Example_Strategy"}
			},

		},
		rels: {}
	};

	api.get("/reseed", (req, res) => {
		db.cypher({ query: "MERGE (n:" + label + " {title:{title}}) ON CREATE SET n.uuid = {uuid}", params: { title: label + "_" + i, uuid: uuid } }, function (err, result) { console.log(err) });
	})
	return api;
}



