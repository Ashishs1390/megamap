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

	function GetPersonaSubGraph(SubGraph, uuid) {
		return new Promise(function (resolve, reject) {
			let GetPivot = GraphAPI.AddRemoteNodeToSubgraph(uuid, SubGraph, db);
			GetPivot.then(() => {
				let Outgoing = GraphAPI.GetOutgoingRels([uuid], SubGraph, 'persona_audiences', db);
				Outgoing.then(() =>  resolve());
				Outgoing.catch(() => reject());
			});
			GetPivot.catch(() => reject())
		})
	};


	//Returns a Persona Centered SubGraph, filtered to only Direct Workshop Components
	api.get('/connections/:persona_uuid', (req, res) => {
		var SubGraph = {};
		GetPersonaSubGraph(SubGraph, req.params.persona_uuid).then(() => { res.send(SubGraph) })
	});

	//computes differences in initial/revised states, generates Cypher Statements, executes Cypher Statements
	api.post('/connections', (req, res) => {
		//Compute Differences
		var Difference = GraphJS.Differences(req.body.initial, req.body.revised)
		let Statements = { Missing_Rels: [], Extra_Rels: [], Updated: [] };

		//Creates Cypher Statements for New/Deleted Relationships
		["Extra", "Missing"].forEach((state) => {
			PersonaWorkshopComponents.forEach((it) => {
				if (Difference[state].node_label_index[it.label] && req.body.revised.incoming[it.type]) {
					Difference[state].node_label_index[it.label].forEach((node_id) => {
						req.body[(state == "Extra") ? "revised" : "initial"].incoming[it.type][node_id].forEach((rel_id) => {
							let rel = Difference[state].rels[rel_id];
							let query = (state == "Extra") ?
								`MATCH (j:Persona {uuid:'${rel.from_id}'}), (o {uuid:'${rel.to_id}'}) CREATE (j)-[e:${rel.type} {uuid:'${rel.properties.uuid}', order:${rel.properties.order || 0}, created_at:${new Date().getTime()}}]->(o)`
								:
								`MATCH ()-[e{uuid:'${rel.properties.uuid}'}]-() DELETE e`;
							Statements[state + "_Rels"].push(query);
						})
					})
				}
			})
		});

		//This array controls the properties this function will create update statements for
		["order"].forEach((it) => {
			if (Difference.Updated.rels.updated[it]) {
				Difference.Updated.rels.updated[it].forEach((rel_id) => {
					let new_val = req.body.revised.rels[rel_id].properties[it];
					let is_string = Object.prototype.toString.call(new_val).slice(8, -1) == "String"; //"Object String" Checking this so I can dynamicly insert qoutes into query builder
					let query = `MATCH ()-[e {uuid:'${rel_id}'}]-() SET e.${it} = ${(is_string) ? "'" : ""}${new_val}${(is_string) ? "'" : ""}`
					Statements.Updated.push(query);
				});
			}
		});

		let queries = Statements.Extra_Rels.concat(Statements.Missing_Rels).concat(Statements.Updated);
		db.cypher({ queries }, (err, result) => {
			if (err) res.status(500).send({ message: err });
			res.send(Statements);
		});
	})


	let PersonaWorkshopComponents =
		[{
			"label": "Audience",
			"type": "persona_audiences"
		}];
	return api;
}
