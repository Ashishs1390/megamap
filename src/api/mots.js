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

	//Mot Dashboard View Getters for 3 Role Views

	api.get("/admin/:uuid", (req, res) => {
		let SubGraph = {};
		let GetLibrary = FullfillLibraryView(SubGraph, `MATCH (n:Mot)-[:author|facilitator]->(p:Person {uuid:'${req.params.uuid}'}) RETURN n`);
		GetLibrary.then(() => res.send(SubGraph));
		GetLibrary.catch((err) => res.status(500).send(err));
	});
	api.get("/tenant", (req, res) => {
		let SubGraph = {};
		let GetLibrary = FullfillLibraryView(SubGraph, `MATCH (n:Mot) RETURN n`);
		GetLibrary.then(() => res.send(SubGraph));
		GetLibrary.catch((err) => res.status(500).send(err));
	});

	api.get('/:journey', (req, res) => {
		db.cypher({
			query: `
				MATCH (j:Journey{uuid: $journeyUuid})
				MATCH (j)-[:journey_stages]->(s:Stage)<-[:note_stage]-(n:Note{mot: true})-[:note_journey]->(j)
				MATCH (n)-[:note_persona]->(p:Persona)

				OPTIONAL MATCH (:Mot{from_uuid: n.uuid})<-[motvalues:values]-(:Person)
	      OPTIONAL MATCH (n)-[:mot_connection]->(mot:Mot)

				WITH s, n, p, round(avg(toFloat(motvalues.mot_score))) as mot_score

				RETURN s {
					.uuid,
					notes: collect(distinct n {
						.*,
						mot_score: mot_score,
						rels: {
							persona: properties(p),
							stage: properties(s)
						}
					})
				}
			`,
			params: {
				journeyUuid: req.params.journey
			}
		}, (err, results) => {
			if (err) {
				console.log(err)
				res.status(400).send({ message: 'bad query' })
			}
			else {
				let obj = {}

				results.map(({ s }) => {
					let notes = s.notes.map(note => {
						return {
							score: note.mot_score || 0,
							trend: note.trend ? parseInt(note.trend) : "",
							description: note.description,
							uuid: note.uuid,
							persona: note.rels.persona,
							note: note
						}
					})
					obj[s.uuid] = notes
				})

				console.log('check this obj', obj)

				res.status(200).send(obj)
			}
		})
	})

	//Library View Shared logic
	function FullfillLibraryView(SubGraph, query) {
		console.log(query);
		return new Promise(function (resolve, reject) {
			db.cypher({
				query: query
			}, function (err, results) {
				if (err || !results || results.length == 0 || results[0] == null) {
					reject(err || { message: "No Mots" });
				} else {
					results.map((result) => { GraphJS.MergeNode(result.n, SubGraph) });
					let Expand = ExpandLibraryCard(SubGraph, SubGraph.node_label_index.Mot);
					Expand.then(() => resolve(SubGraph));
					Expand.catch((err) => reject(err));
				}
			});
		})
	}

	function ExpandLibraryCard(SubGraph, mot_uuid_array) {
		return new Promise(function (resolve, reject) {
			let Outgoing = GraphAPI.GetOutgoingRels(mot_uuid_array, SubGraph, 'author', db);
			Outgoing.then(() => {
				resolve();
			});
			Outgoing.catch(() => reject());
		})
	}

	return api;
}
