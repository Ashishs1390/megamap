import {
	Router
} from 'express';
var _ = require('lodash');
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

	api.get("/", (req, res) => {
		res.send('projects route');
	});



	// single project
	api.get("/tenant", (req, res) => {
		let SubGraph = {};
		let GetLibrary = FullfillLibraryView(SubGraph, `
			MATCH (n:Project)-[r:author|project_attendee]->(p:Person{uuid: '${req.user.uuid}'}) RETURN n
		`);
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
					reject(err || { message: "No Projects" });
				} else {
					results.map((result) => { GraphJS.MergeNode(result.n, SubGraph) });
					let Expand = ExpandLibraryCard(SubGraph, SubGraph.node_label_index.Project);
					Expand.then(() => resolve(SubGraph));
					Expand.catch((err) => reject(err));
				}
			});
		})
	}
	function ExpandLibraryCard(SubGraph, uuid_array) {
		return new Promise(function (resolve, reject) {
			let Outgoing = GraphAPI.GetOutgoingRels(uuid_array, SubGraph, 'project_attendee|author', db);
			Outgoing.then(() => {
				resolve()
			});
			Outgoing.catch(() => reject());
		})
	}


	// single project
	api.get("/:uuid", (req, res) => {
		let SubGraph = {};
		let GetPivot = GraphAPI.AddRemoteNodeToSubgraph(req.params.uuid, SubGraph, db);
		GetPivot.then(() => {
			let Outgoing = GraphAPI.GetOutgoingRels([req.params.uuid], SubGraph, 'project_milestone|project_attendee|author|note_journey', db);
			Outgoing.then(() => {
				if (SubGraph.node_label_index.Milestone) {
					let milestone_outgoing = GraphAPI.GetOutgoingRels(SubGraph.node_label_index.Milestone, SubGraph, 'milestone_coordinator|milestone_component|note_journey', db);
					milestone_outgoing.then(() => {
						GraphAPI.GetConnectedJourneys('Note', SubGraph.rel_label_index.milestone_component, SubGraph, db)
						.then(() => {
							res.send(SubGraph)
						}).catch((err) => {
							console.log(err)
						});
					});
					milestone_outgoing.catch((err) => res.status(500).send(err));
				} else {
					res.send(SubGraph)
				}
			});
			Outgoing.catch((err) => res.status(500).send(err));
		});
		GetPivot.catch((err) => res.status(500).send(err));
	});

	api.get("/projectpage/:uuid", (req, res) => {
		let SubGraph = {};
		let GetPivot = GraphAPI.AddRemoteNodeToSubgraph(req.params.uuid, SubGraph, db);
		GetPivot.then(() => {
			let Outgoing = GraphAPI.GetOutgoingRels([req.params.uuid], SubGraph, 'project_milestone|project_attendee|note_journey', db);
			Outgoing.then(() => {
				if (SubGraph.node_label_index.Milestone) {
					let milestone_outgoing = GraphAPI.GetOutgoingRels(SubGraph.node_label_index.Milestone, SubGraph, 'milestone_coordinator|milestone_component|note_journey', db);
					milestone_outgoing.then(() => {
						GraphAPI.GetConnectedJourneys('Note', SubGraph.rel_label_index.milestone_component, SubGraph, db)
						.then(() => {
							res.send(SubGraph)
						}).catch((err) => {
							console.log(err)
						});
					});
					milestone_outgoing.catch((err) => res.status(500).send(err));
				} else {
					res.send(SubGraph)
				}
			});
			Outgoing.catch((err) => res.status(500).send(err));
		});
		GetPivot.catch((err) => res.status(500).send(err));
	});

	//Returns a Project Centered SubGraph, filtered to only Direct Workshop Components
	api.get('/connections/:project_uuid', (req, res) => {
		var uuid = req.params.project_uuid;
		var SubGraph = {};
		let GetPivot = GraphAPI.AddRemoteNodeToSubgraph(uuid, SubGraph, db);
		GetPivot.then(() => {
			let Outgoing = GraphAPI.GetOutgoingRels([uuid], SubGraph, 'project_attendee', db);
			Outgoing.then(() => res.send(SubGraph))
			Outgoing.catch((err) => res.status(500).send(err));
		});
		GetPivot.catch((err) => res.status(500).send(err));
	});

	//computes differences in initial/revised states, generates Cypher Statements, executes Cypher Statements
	api.post('/milestone/connections', (req, res) => {
		//Compute Differences
		var Difference = GraphJS.Differences(req.body.initial, req.body.revised)
		let Statements = { Missing_Rels: [], Extra_Rels: [], Updated: [] };

		//Creates Cypher Statements for New/Deleted Relationships
		["Extra", "Missing"].forEach((state) => {
			[
				{ label: "Person",  type: "milestone_coordinator" },
				{ label: "Note",    type: "milestone_component" },
				{ label: "Journey", type: "component_journey" }
			].forEach((it) => {
				if (Difference[state].node_label_index[it.label] && req.body.revised.incoming[it.type]) {
					Difference[state].node_label_index[it.label].forEach((node_id) => {
						req.body[(state == "Extra") ? "revised" : "initial"].incoming[it.type][node_id].forEach((rel_id) => {
							let rel = Difference[state].rels[rel_id];
							if(it.label == 'Note'){
								let noteQuery = (state == "Extra") ? 
									`MATCH (n:Note {uuid:'${node_id}' }) SET n.isMilestoneLinked = true , n.progress = 0 RETURN n`
									:
									`MATCH (n:Note {uuid:'${node_id}' }) SET n.isMilestoneLinked = false RETURN n`
								db.cypher({ query: noteQuery }, (err, result) => {
									if (err) res.status(400).send({ message: err });
								});
								
							}
							let query = (state == "Extra") ?
								`MATCH (j:Milestone {uuid:'${rel.from_id}'}), (o {uuid:'${rel.to_id}'}) CREATE (j)-[e:${rel.type} {uuid:'${rel.properties.uuid}', order:${rel.properties.order || 0}, created_at:${new Date().getTime()}}]->(o)`
								:
								`MATCH ()-[e{uuid:'${rel.properties.uuid}'}]-() DELETE e`;
							Statements[state + "_Rels"].push(query);
						})
					})
				}
			})
		});
		let queries = Statements.Extra_Rels.concat(Statements.Missing_Rels).concat(Statements.Updated);
		db.cypher({ queries }, (err, result) => {
			if (err) res.status(500).send({ message: err });
			res.send(Statements);
		});
	})

	api.post('/milestone/sequence', (req, res) => {
		let milestone =   req.body;
		let query =  `MATCH (n:Milestone {uuid:'${milestone.uuid}' }) SET n.sequence = '${milestone.sequence}' RETURN n`
		db.cypher({ query: query }, (err, result) => {
		  if (err) res.status(500).send({ message: err });
				res.send(result);
		});
	})



	//Returns a Project Centered SubGraph, filtered to only Direct Workshop Components
	api.get('/milestone/connections/:uuid', (req, res) => {
		var uuid = req.params.uuid;
		var SubGraph = {};
		let GetPivot = GraphAPI.AddRemoteNodeToSubgraph(uuid, SubGraph, db);
		GetPivot.then(() => {
			let Outgoing = GraphAPI.GetOutgoingRels([uuid], SubGraph, 'milestone_coordinator|milestone_component|component_journey', db);
			
			Outgoing.then(() => res.send(SubGraph))
			Outgoing.catch((err) => res.status(500).send(err));
		});
		GetPivot.catch((err) => res.status(500).send(err));
	});

	//computes differences in initial/revised states, generates Cypher Statements, executes Cypher Statements
	api.post('/connections', (req, res) => {
		//Compute Differences
		var Difference = GraphJS.Differences(req.body.initial, req.body.revised)
		let Statements = { Missing_Rels: [], Extra_Rels: [], Updated: [] };

		//Creates Cypher Statements for New/Deleted Relationships
		["Extra", "Missing"].forEach((state) => {
			ProjectComponents.forEach((it) => {
				if (Difference[state].node_label_index[it.label] && req.body.revised.incoming[it.type]) {
					Difference[state].node_label_index[it.label].forEach((node_id) => {
						req.body[(state == "Extra") ? "revised" : "initial"].incoming[it.type][node_id].forEach((rel_id) => {
							let rel = Difference[state].rels[rel_id];
							let query = (state == "Extra") ?
								`MATCH (j:Project {uuid:'${rel.from_id}'}), (o {uuid:'${rel.to_id}'}) CREATE (j)-[e:${rel.type} {uuid:'${rel.properties.uuid}', order:${rel.properties.order || 0}, created_at:${new Date().getTime()}}]->(o)`
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
		console.log('###############################################################');
		console.log(queries);
		db.cypher({ queries }, (err, result) => {
			if (err) res.status(500).send({ message: err });
			res.send(Statements);
		});
	})

	//computes differences in initial/revised states, generates Cypher Statements, executes Cypher Statements
	api.post('/taskConnection', (req, res) => {
		let rel = req.body.rel;
		let query = `MATCH (j:Project {uuid:'${rel.from_id}'}), (o {uuid:'${rel.to_id}'}) CREATE (j)-[e:${rel.type} {uuid:'${rel.properties.uuid}', order:${rel.properties.order || 0}, created_at:${new Date().getTime()}}]->(o)`
		console.log('task connection ###############################################################');
		console.log(query);
		db.cypher({ query }, (err, result) => {
			if (err) res.status(500).send({ message: err });
			res.send(result);
		});
	})

	// get all notes relates to any milestones
	api.get('/milestone/notes', (req, res)=>{
		let SubGraph = {}
		let query = `MATCH (m:Milestone)-[r:milestone_component]-(n:Note) RETURN n`
	    db.cypher({
	    	query
	    }, (err, results)=>{
			if (err) res.status(500).send({ message: err });
			results.map((result) => { GraphJS.MergeNode(result.n, SubGraph) });
			res.send(SubGraph);
		})
	})



	let ProjectComponents = [{
		"label": "Person",
		"type": "project_attendee"
	},
	{
		"label": "Milestone",
		"type": "project_milestone"
	}]


	return api;
}
