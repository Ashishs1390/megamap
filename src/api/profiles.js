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

	//Profile Dashboard View Getters for 3 Role Views
	api.get("/attendee/:uuid", (req, res) => {
		let SubGraph = {};
		let GetLibrary = FullfillLibraryView(SubGraph, `MATCH (n:Profile)-[:profile_attendee]->(p:Person {uuid:'${req.params.uuid}'}) RETURN n`);
		GetLibrary.then(() => {
			res.send(SubGraph)
		});
		GetLibrary.catch((err) => res.status(500).send(err));
	});
	api.get("/admin/:uuid", (req, res) => {
		let SubGraph = {};
		let GetLibrary = FullfillLibraryView(SubGraph, `MATCH (n:Profile)-[:author|facilitator]->(p:Person {uuid:'${req.params.uuid}'}) RETURN n`);
		GetLibrary.then(() => res.send(SubGraph));
		GetLibrary.catch((err) => res.status(500).send(err));
	});
	api.get("/tenant/:uuid", (req, res) => {
		let SubGraph = {};
		let GetLibrary = FullfillLibraryView(SubGraph, `MATCH (n:Profile) RETURN n`);
		GetLibrary.then(() => res.send(SubGraph));
		GetLibrary.catch((err) => res.status(500).send(err));
	});

	//Library View Shared logic
	function FullfillLibraryView(SubGraph, query) {
		return new Promise(function (resolve, reject) {
			db.cypher({
				query: query
			}, function (err, results) {
				if (err || !results || results.length == 0 || results[0] == null) {
					reject({ message: "There are currently no profiles assigned to you" })
				}
				else {
					results.map((result) => { GraphJS.MergeNode(result.n, SubGraph) });
					let Expand = ExpandLibraryCard(SubGraph, SubGraph.node_label_index.Profile);
					Expand.then(() => resolve(SubGraph));
					Expand.catch((err) => reject(err));
				}
			});
		})
	}

	function GetProfileNotesSubGraph(SubGraph, note_uuid_array) {
		return new Promise(function (resolve, reject) {
			if (!note_uuid_array) reject("note_uuid_array is missing");
			let Outgoing = GraphAPI.GetOutgoingRels(note_uuid_array, SubGraph, 'note_interaction|note_attribute|note_author', db);
			Outgoing.then(() => {
				let Incoming = GraphAPI.GetIncomingRels(note_uuid_array, SubGraph, 'vote|vote2x|vote3x|pain|comment', db);
				Incoming.then(() => resolve());
				Incoming.catch(() => reject());
			});
			Outgoing.catch((error) => reject(error));
		})
	};

	function GetProfileSubGraph(SubGraph, uuid) {
		return new Promise(function (resolve, reject) {
			let GetPivot = GraphAPI.AddRemoteNodeToSubgraph(uuid, SubGraph, db);
			GetPivot.then(() => {
				let Outgoing = GraphAPI.GetOutgoingRels([uuid], SubGraph, 'profile_strategy|profile_product|profile_persona|profile_interactions|profile_attributes|facilitator|profile_capability', db);
				Outgoing.then(() => {
					let Incoming = GraphAPI.GetIncomingRels([uuid], SubGraph, 'note_profile', db);
					Incoming.then(() => resolve());
					Incoming.catch((error) => { reject(error); })
				});
				Outgoing.catch(() => reject());
			});
			GetPivot.catch(() => reject())
		})
	};

	function ExpandLibraryCard(SubGraph, profile_uuid_array) {
		return new Promise(function (resolve, reject) {
			let Outgoing = GraphAPI.GetOutgoingRels(profile_uuid_array, SubGraph, 'profile_attendee|author|profile_persona', db);
			Outgoing.then(() => {
				let Incoming = GraphAPI.GetIncomingRels(profile_uuid_array, SubGraph, 'note_profile', db);
				Incoming.then(() => resolve());
				Incoming.catch(() => reject());
			});
			Outgoing.catch(() => reject());
		})
	}

	//Returns a complete view of a Profile Workshop.
	api.get('/:profile_uuid', (req, res) => {
		var SubGraph = {};
		let GetProfile = GetProfileSubGraph(SubGraph, req.params.profile_uuid);
		GetProfile.then(() => {
			if (!SubGraph.node_label_index.Note) { res.send(SubGraph); return; }
			let ExpandProfilesNotes = GetProfileNotesSubGraph(SubGraph, SubGraph.node_label_index.Note);
			ExpandProfilesNotes.then(() => res.send(SubGraph));
			ExpandProfilesNotes.catch((error) => res.status(500).send(error));
		});
		GetProfile.catch((error) => res.status(500).send(error));
	});

	//Returns a Profile Centered SubGraph, filtered to only Direct Workshop Components
	api.get('/connections/:profile_uuid', (req, res) => {
		var SubGraph = {};
		GetProfileSubGraph(SubGraph, req.params.profile_uuid).then(() => { res.send(SubGraph) })
	});

	//Returns only the People invited to a Profile Workshop
	api.get('/invitees/:profile_uuid', (req, res) => {
		var SubGraph = {};
		let GetPivot = GraphAPI.AddRemoteNodeToSubgraph(req.params.profile_uuid, SubGraph, db);
		GetPivot.then(() => {
			let Outgoing = GraphAPI.GetOutgoingRels([req.params.profile_uuid], SubGraph, 'profile_attendee', db);
			Outgoing.then(() => { res.send(SubGraph); });
			Outgoing.catch((err) => { res.status(500).send(err); })
		});
		GetPivot.catch((err) => { res.status(500).send(err); })
	});

	//computes differences in initial/revised states, generates Cypher Statements, executes Cypher Statements
	api.post('/connections', (req, res) => {
		//Compute Differences
		var Difference = GraphJS.Differences(req.body.initial, req.body.revised)
		let Statements = { Missing_Rels: [], Extra_Rels: [], Updated: [] };

		//Creates Cypher Statements for New/Deleted Relationships
		["Extra", "Missing"].forEach((state) => {
			ProfileWorkshopComponents.forEach((it) => {
				if (Difference[state].node_label_index[it.label] && req.body.revised.incoming[it.type]) {
					Difference[state].node_label_index[it.label].forEach((node_id) => {
						req.body[(state == "Extra") ? "revised" : "initial"].incoming[it.type][node_id].forEach((rel_id) => {
							let rel = Difference[state].rels[rel_id];
							let query = (state == "Extra") ?
								`MATCH (j:Profile {uuid:'${rel.from_id}'}), (o {uuid:'${rel.to_id}'}) CREATE (j)-[e:${rel.type} {uuid:'${rel.properties.uuid}', order:${rel.properties.order || 0}, created_at:${new Date().getTime()}}]->(o)`
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




	//Creates a new Note, includeing component relationships
	api.post('/note', (req, res) => {
		let note_uuid = uuidv1();
		let validator_errors = Validators.Note(req.body.note);
		if (validator_errors) { res.status(500).send(validator_errors); return }

		db.cypher({
			query: "MATCH (j:Profile {uuid: {profile_uuid} }), (s:Attribute {uuid:{attribute_uuid}}), (i:Interaction {uuid:{interaction_uuid}}), (a:Person {uuid:{author_uuid}})" +
			"CREATE (n:Note {uuid:{uuid}, description:{description}, image_url:{image_url}, external_url:{external_url} }) " +
			"CREATE (n)-[:note_author {uuid : {author_rel_uuid}}]->(a)" +
			"CREATE (n)-[:note_profile {uuid : {profile_rel_uuid}}]->(j)" +
			"CREATE (n)-[:note_attribute {uuid : {attribute_rel_uuid}}]->(s)" +
			"CREATE (n)-[:note_interaction {uuid : {interaction_rel_uuid}}]->(i)" +
			"return n",
			params: {
				//Note Params
				uuid: note_uuid,
				description: req.body.note.properties.description,
				image_url: req.body.note.properties.image_url,
				external_url: req.body.note.properties.external_url,
				//neighbors
				profile_uuid: req.body.profile_id,
				attribute_uuid: req.body.attribute_id,
				interaction_uuid: req.body.interaction_id,
				author_uuid: req.body.author_id,
				//New rel ids
				attribute_rel_uuid: uuidv1(),
				interaction_rel_uuid: uuidv1(),
				profile_rel_uuid: uuidv1(),
				author_rel_uuid: uuidv1()
			}
		},
			function (err, results) {
				if (err) res.status(500).send(err);
				let SubGraph = {};
				let GetPivot = GraphAPI.AddRemoteNodeToSubgraph(note_uuid, SubGraph, db);
				GetPivot.then(() => {
					//Get incoming relationships also
					let Outgoing = GraphAPI.GetOutgoingRels(SubGraph.node_label_index.Note, SubGraph, 'note_interaction|note_attribute|note_profile|note_author', db);
					Outgoing.then(() => {
						io.to(req.body.profile_id).emit("post.note", SubGraph);
						res.send();
					});
					Outgoing.catch((error) => res.status(500).send());
				})
				GetPivot.catch(() => res.status(500).send());
			});
	});

	//Updates a notes components, and properties
	api.put('/note', (req, res) => {
		var Difference = GraphJS.Differences(req.body.initial, req.body.revised);


		//Update the Node Object
		let node = req.body.revised.nodes[req.body.revised.node_label_index.Note[0]]
		let validation_error = Validators.Note(node);
		if (validation_error) { res.status(500).send(validation_error); return; }

		let iterate_props = ["description", "image_url", "external_url", "sample_size", "average_importance", "average_effectiveness", "gap", "correlation", "stated_importance", "derived_importance", "kano_quadrant"];
		let prop_query = ``;
		iterate_props.forEach((it) => {
			if ((Difference.Updated.nodes.updated[it] && Difference.Updated.nodes.updated[it].indexOf(node.properties.uuid) != -1) || (Difference.Updated.nodes.new[it] && Difference.Updated.nodes.new[it].indexOf(node.properties.uuid) != -1)) {
				let new_val = node.properties[it];
				let is_string = Object.prototype.toString.call(new_val).slice(8, -1) == "String"; //"Object String"
				prop_query += ` SET j.${it} = ${(is_string) ? "'" : ""}${new_val}${(is_string) ? "'" : ""}`

			}
		});

		let query = `MATCH (j:Note {uuid:'${node.properties.uuid}'}) ${prop_query} return j`
		db.cypher({ query }, (err, result) => {
			io.to(req.body.initial.nodes[req.body.initial.node_label_index.Profile[0]].properties.uuid).emit("post.note", sg);
		});

		//Generate Cypher statements for new/missing components
		let sg = {};
		GraphJS.MergeNode(node, sg)

		let Statements = { Missing_Rels: [], Extra_Rels: [], Updated: [] };
		//Creates Cypher Statements for New/Deleted Relationships
		["Extra", "Missing"].forEach((state) => {
			WorkshopNoteComponents.forEach((it) => {
				if (Difference[state].node_label_index[it.label]) {
					Difference[state].node_label_index[it.label].forEach((node_id) => {
						req.body[(state == "Extra") ? "revised" : "initial"].incoming[it.type][node_id].forEach((rel_id) => {
							let rel = Difference[state].rels[rel_id];
							let query = (state == "Extra") ?
								`MATCH (j:Note {uuid:'${rel.from_id}'}), (o {uuid:'${rel.to_id}'}) CREATE (j)-[e:${rel.type} {uuid:'${rel.properties.uuid}', order:${rel.properties.order || 0}, created_at:${new Date().getTime()}}]->(o)`
								:
								`MATCH ()-[e{uuid:'${rel.properties.uuid}'}]-() DELETE e`;
							Statements[state + "_Rels"].push(query);
						})
					})
				}
			})
		});

		let queries = Statements.Extra_Rels.concat(Statements.Missing_Rels).concat(Statements.Updated);
		db.cypher({
			queries
		}, (err, result) => {
			io.to(req.body.initial.nodes[req.body.initial.node_label_index.Profile[0]].properties.uuid).emit("put.note", Difference);
			res.send(Statements);
		});
	})

	api.post('/note/vote', (req, res) => {
		let vote = req.body;
		let query = `MATCH (u:Person {uuid:'${vote.from_id}'}), (n:Note {uuid:'${vote.to_id}'}) CREATE (u)-[e:${vote.type} {uuid:'${vote.properties.uuid}'}]->(n)`;
		db.cypher({ query }, function (err, results) {
			if (err) res.status(500).send(err);
			let SubGraph = {};
			let GetPivot = GraphAPI.AddRemoteNodeToSubgraph(vote.to_id, SubGraph, db);
			GetPivot.then(() => {
				let Ougoing = GraphAPI.GetIncomingRels(SubGraph.node_label_index.Note, SubGraph, 'vote|vote2x|vote3x|pain', db);
				Ougoing.then(() => {
					io.to(vote.to_id).emit("post.vote", SubGraph);
					res.send();
				});
				Ougoing.catch((error) => res.status(500).send(error))
			});
			GetPivot.catch((error) => res.status(500).send(error));
		});
	});

	api.post('/note/comment', (req, res) => {
		let query = `MATCH (u:Person {uuid:'${req.body.from_id}'}), (n:Note {uuid:'${req.body.to_id}'}) CREATE (u)-[e:${req.body.type} {uuid:'${req.body.properties.uuid}', comment:'${req.body.properties.comment}', created_at:${new Date().getTime()}}]->(n)`;
		db.cypher({ query }, function (err, results) {
			if (err) res.status(500).send(err);
			let SubGraph = {};
			let GetPivot = GraphAPI.AddRemoteNodeToSubgraph(req.body.to_id, SubGraph, db);
			GetPivot.then(() => {
				let Incoming = GraphAPI.GetIncomingRels(SubGraph.node_label_index.Note, SubGraph, 'comment', db);
				Incoming.then(() => {
					io.to(req.body.to_id).emit("post.comment", SubGraph);
					res.send();
				});
				Incoming.catch(() => res.status(500).send());
			})
			GetPivot.catch(() => res.status(500).send());
		});
	});

	api.delete('/note/vote/:uuid', (req, res) => {
		let query = `MATCH ()-[e {uuid:'${req.params.uuid}'}]->(n) DELETE e RETURN n`;
		db.cypher({ query }, function (err, results) {
			if (err) res.status(500).send(err);
			let SubGraph = { nodes: {}, rels: {} }
			SubGraph.rels[req.params.uuid] = { properties: { uuid: req.params.uuid } };
			io.to(results[0].n.properties.uuid).emit("delete.vote", SubGraph);
			res.send();
		});
	});
	api.delete('/note/:uuid', (req, res) => {
		let query = `MATCH (n:Note {uuid:"${req.params.uuid}"}) OPTIONAL MATCH (n)-[e]-() DELETE n,e return n`;
		db.cypher({ query }, function (err, results) {
			if (err) res.status(500).send(err);
			io.to(req.params.uuid).emit("delete.note", req.params.uuid);
			res.send();
		});
	});

	let ProfileWorkshopComponents =
		[{
			"label": "Product",
			"type": "profile_product"
		}, {
			"label": "Persona",
			"type": "profile_persona"
		}, {
			"label": "Strategy",
			"type": "profile_strategy"
		}, {
			"label": "Attribute",
			"type": "profile_attributes"
		}, {
			"label": "Interaction",
			"type": "profile_interactions"
		}, {
			"label": "Person",
			"type": "profile_attendee"
		}, {
			"label": "Person",
			"type": "facilitator"
		}, {
			"label": "Capability",
			"type": "profile_capability"
		}];
	let WorkshopNoteComponents = [{
		"label": "Interaction",
		"type": "note_interaction"
	}, {
		"label": "Attribute",
		"type": "note_attribute"
	}]
	return api;
}
