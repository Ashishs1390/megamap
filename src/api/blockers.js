import {Router } from 'express';
import GraphJS from '../lib/graph';
import GraphAPI from '../lib/db_api'



export default ({config, db, broadcast }) => {
	let api = Router();

	// Get notes from relations by label and where. 'from' and 'to' is not directional entities
	api.get('/notes/:from_label/:rel_label/:optional_to_label/:optional_entity_key/:optional_entity_val/:return_entity', (req, res) => {
		if (!req.params.from_label || !req.params.rel_label || !req.params.return_entity ) return res.status(500).send('One of from_label, rel_label or return_entity is not defined')
		if ( req.params.return_entity !== 'from' && req.params.return_entity !== 'to' && req.params.return_entity !== 'from,rel,to') return res.status(500).send('return_entity is not defined correctly.')

		let from_label = req.params.from_label
		let rel_label = req.params.rel_label
		let to_label = req.params.optional_to_label
		let node_key = req.params.optional_entity_key != 'null' ? req.params.optional_entity_key : ''
		let node_val = req.params.optional_entity_val != 'null' ? req.params.optional_entity_val : ''
		let return_entity = req.params.return_entity.toLowerCase().replace(/\s+/g, '')
		let SubGraph = {}
		let where = ''
		let query = ''

		if (node_key && node_val) {
			if (return_entity === 'from' || return_entity === 'to' ) where = ` WHERE ${node_key}="${node_val}" RETURN ${return_entity}`
		} else if (return_entity === 'from,rel,to') {
			where = ` RETURN ${return_entity}`
		}

		if (to_label == 'null') {
			query = `MATCH (from:${from_label})-[rel:${rel_label}]-(to)` + where
		} else {
			query = `MATCH (from:${from_label})-[rel:${rel_label}]-(to:${to_label})` + where
		}

		console.log(query);
		let getSubgraph = FullfillBlockerView(SubGraph, query, return_entity)
		getSubgraph.then(()=> res.send(SubGraph))
		getSubgraph.catch((err)=> res.status(500).send(err))
	})

	function FullfillBlockerView(SubGraph, query, return_entity) {
		return new Promise(function (resolve, reject) {
			db.cypher({
				query: query
			}, function (err, results) {
				if (err || !results || results.length == 0 || results[0] == null) {
					reject({ message: "No Blocker notes" })
				} else {
					results.map((result) => {
						if (return_entity === 'from' || return_entity === 'to') {
							GraphJS.MergeNode(result[return_entity], SubGraph)
						}
						if (return_entity === 'from,rel,to') {
							GraphJS.MergeNode(result.from, SubGraph)
							GraphJS.MergeNode(result.to, SubGraph)
							GraphJS.MergeRelationship(result.rel, SubGraph)
						}
					});
					let Expand = ExpandBlockersCard(SubGraph, SubGraph.node_label_index.Note);
					Expand.then(() => resolve(SubGraph));
					Expand.catch((err) => reject(err));
				}
			});
		})
	}

	function ExpandBlockersCard(SubGraph, profile_uuid_array) {
		return new Promise(function (resolve, reject) {
			let Outgoing = GraphAPI.GetOutgoingRels(profile_uuid_array, SubGraph, 'note_interaction|note_stage|note_journey|note_author|note_profile', db);
			Outgoing.then(() => {
				let Incoming = GraphAPI.GetIncomingRels(profile_uuid_array, SubGraph, 'vote|vote2x|vote3x|pain|comment', db);
				Incoming.then(() => resolve());
				Incoming.catch(() => reject());
			});
			Outgoing.catch((err) => reject(err));
		})
	}


	return api;
}
