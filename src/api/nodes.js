import { Router } from 'express';
var _ = require('lodash');
import GraphJS from '../lib/graph';
import GraphAPI from '../lib/db_api'

var uuidv1 = require('uuid/v1');
import Validators from "../lib/validators";
var http = require('http');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const window = (new JSDOM('')).window;
const DOMPurify = createDOMPurify(window);
var fs = require("fs-extra");
const { createClient } = require("webdav");
var webdav = false;
var formidable = require('formidable');

//api.use('/node', nodes({config, db}));
export default ({ config, db, broadcast }) => {
    let api = Router();


    //Get specific node by uuid
    api.get('/:uuid', (req, res) => {
        let SubGraph = {};
        let GetPivot = GraphAPI.AddRemoteNodeToSubgraph(req.params.uuid, SubGraph, db);
        GetPivot.then((result) => {
            let properties = SubGraph.nodes[req.params.uuid].properties
            Object.keys(properties).forEach((key) => {
                if (isJson(properties[key])) {
                    SubGraph.nodes[req.params.uuid].properties[key] = JSON.parse(properties[key]);
                }
            })
            res.send(SubGraph);
        });
        GetPivot.catch((error) => { res.status(500).send(error); });
    })

    //Get specific node by uuid
    // MATCH (n { name: 'Andres' })

    api.delete('/:uuid', (req, res) => {
        let SubGraph = {};
        let node = null;
        let GetPivot = GraphAPI.AddRemoteNodeToSubgraph(req.params.uuid, SubGraph, db);
        GetPivot.then((result) => {
            node = result;
            db.cypher({ query: `match (n) where n.uuid = '${req.params.uuid}' MATCH ()-->(n) return n` }, (err, result) => {
                if (result && result.length == 0) {
                    db.cypher({ query: `match (n) where n.uuid = '${req.params.uuid}' OPTIONAL MATCH (n)-[e]->() delete n,e RETURN n` }, (err, result) => {
                        console.log('ERROR', err)
                        broadcast(node.labels[0], {
                            "delete.node": SubGraph
                        })
                        //http.post('http://localhost:8080/relay', {to:node.labels, message:SubGraph});
                        res.send(true);
                    })
                } else if (req.headers['force-delete']) {
                    db.cypher({ query: `match (n{uuid:'${req.params.uuid}'}) DETACH DELETE n` }, (err, result) => {
                        broadcast('Milestone', {
                            "delete.node": SubGraph
                        })
                        res.send(true);
                    })
                } else {
                    res.status(500).send({ message: "Cannot delete node with dependencies" });
                }
            })
        });
        GetPivot.catch((error) => { res.status(500).send({ message: "Cannot find node" }); });
    })

    //Get specific node by uuid
    api.put('/', (req, res) => {
        if (!req.body.initial || !req.body.revised) { res.status(500).send("missing either 'revised', or 'initial'"); return; }

        let initial_props = req.body.initial.properties;
        let revised_props = req.body.revised.properties;

        let validator_errors = Validators.Node(req.body.revised);
        if (validator_errors) { res.status(500).send({ message: validator_errors }); return }

        let query = `MATCH (n {uuid:'${initial_props.uuid}'}) `;
        let updated = false;
        let params = {
            date: (new Date().getTime())
        }

        Object.keys(revised_props).forEach((key) => {
            if (key == 'uuid' || key == 'created_at') return;
            if (revised_props[key] !== initial_props[key]) {
                updated = true;
                if (typeof (revised_props[key]) === 'object') {
                    params[key] = JSON.stringify(revised_props[key]);
                } else {
                    params[key] = revised_props[key]
                }
                query += ` SET n.${key} = {${key}}`
            }
        });

        // for journey kpi relationships
        if (req.body.revised.kpis) {
            updated = true;
            for (let kpi of req.body.revised.kpis) {
                query += ` WITH n MATCH (n)-[r:journey_kpis{uuid:'${kpi.rel.uuid}'}]->(k:Kpi) SET r.score = ${kpi.rel.score || null} SET r.label = "${(kpi.rel.label) || ''}"`
            }
        }

        if (updated) {
            query += ` WITH n SET n.updated_at = {date}`
        }
        query += ' RETURN n'

        db.cypher({ query: query, params: params }, (err, result) => {
            let SubGraph = {};
            let GetPivot = GraphAPI.AddRemoteNodeToSubgraph(result[0].n.properties.uuid, SubGraph, db);
            GetPivot.then(() => {
                broadcast('Milestone', {
                    "post.node": SubGraph
                })
                res.status(200).send(true);
            })
            GetPivot.catch((error) => res.status(500).send());
        })
    })

    //Get specific node by uuid


	api.post('/', (req, res) => {
		console.log("-------route----")
        if (!req.body.revised) { res.status(500).send({ message: "missing node to write. " }); return; }
        if (!req.body.author_uuid) { res.status(500).send({ message: "missing author_uuid" }); return; }

        let revised_props = req.body.revised.properties;
        let validator_errors = Validators.Node(req.body.revised);
        if (validator_errors) { res.status(500).send({ message: validator_errors }); return }
        let new_uuid = uuidv1();
        let date = new Date().getTime();
        let dateLastUpdate = new Date().toJSON();
        let params = {
            date: date,
			dateLastUpdate:dateLastUpdate
        }
        //Need to convert ...labels[0] to an iterated string builder for the whole array
        let query = `
			MATCH (p:Person {uuid:'${req.body.author_uuid}'})
			CREATE (n:${req.body.revised.labels[0]}{uuid:'${new_uuid}'})-[a:author{uuid:'${uuidv1()}'}]->(p)
		 `;
        Object.keys(revised_props).forEach((key) => {
            if (typeof (revised_props[key]) === 'object') {
                params[key] = JSON.stringify(revised_props[key])
            } else {
                params[key] = revised_props[key]
            }
            query += ` SET n.${key} = {${key}}`
        });

        query += ` SET n.created_at = {date} SET n.updated_at = {date} SET n.last_active_at = {dateLastUpdate}`

        if (params.workshop_type) {
          // when creating brainstorm workshops
          if(params.workshop_type === 'brainstorm') {
            query +=
                    `
    				  CREATE (s:Stage {uuid:'${uuidv1()}'})-[:author{uuid:'${uuidv1()}'}]->(p)
    					SET s.title = '${req.user.email}_${date}' SET s.description = '${req.user.email}_${date}' SET s.brainstorm = true SET s.created_at = {date} SET s.updated_at = {date} SET s.last_active_at = {dateLastUpdate}

    					WITH n, s, p

    					MERGE (per:Persona{title: 'Default Persona'})
    					ON CREATE SET per += { uuid: '${uuidv1()}', description: 'Default Persona', created_at: {date}, updated_at: {date}, onCreate: true }
    					FOREACH(ifthen in per.onCreate |
    					    MERGE (per)-[:author{uuid:'${uuidv1()}'}]->(p)
    					    REMOVE per.onCreate
    					)
    					MERGE (i:Interaction{title:'Notes'})
    					ON CREATE SET i += { uuid: '${uuidv1()}', description: 'Notes', created_at: {date}, updated_at: {date}, onCreate: true }
    					FOREACH(ifthen in i.onCreate |
    					    MERGE (i)-[:author{uuid:'${uuidv1()}'}]->(p)
    					    REMOVE i.onCreate
    					)
    					WITH n, s, p, per, i
    					CREATE (n)-[:journey_stages{uuid:'${uuidv1()}', created_at:{date}, order: 0}]->(s)
    					CREATE (n)-[:journey_persona{uuid:'${uuidv1()}', created_at:{date}, order: 0}]->(per)
    					CREATE (n)-[:journey_interactions{uuid:'${uuidv1()}', created_at:{date}, order: 0}]->(i)
    					WITH n
    				`
          }

          // when creating horizon workshops
          if(params.workshop_type === 'horizon') {
            query += `
              WITH n, p

    					MERGE (s1:Stage{title: 'Run (H1)'})
    					ON CREATE SET s1 += { uuid: '${uuidv1()}', description: 'Run (H1)', created_at: {date}, updated_at: {date}, onCreate: true }
    					FOREACH(ifthen in s1.onCreate |
    					    MERGE (s1)-[:author{uuid:'${uuidv1()}'}]->(p)
    					    REMOVE s1.onCreate
    					)
              MERGE (s2:Stage{title: 'Grow (H2)'})
    					ON CREATE SET s2 += { uuid: '${uuidv1()}', description: 'Grow (H2)', created_at: {date}, updated_at: {date}, onCreate: true }
    					FOREACH(ifthen in s2.onCreate |
    					    MERGE (s2)-[:author{uuid:'${uuidv1()}'}]->(p)
    					    REMOVE s2.onCreate
    					)
              MERGE (s3:Stage{title: 'Transform (H3)'})
    					ON CREATE SET s3 += { uuid: '${uuidv1()}', description: 'Transform (H3)', created_at: {date}, updated_at: {date}, onCreate: true }
    					FOREACH(ifthen in s3.onCreate |
    					    MERGE (s3)-[:author{uuid:'${uuidv1()}'}]->(p)
    					    REMOVE s3.onCreate
    					)

              MERGE (per1:Persona{title: 'ITDM'})
    					ON CREATE SET per1 += { uuid: '${uuidv1()}', description: 'Default Persona', created_at: {date}, updated_at: {date}, onCreate: true }
    					FOREACH(ifthen in per1.onCreate |
    					    MERGE (per1)-[:author{uuid:'${uuidv1()}'}]->(p)
    					    REMOVE per1.onCreate
    					)
              MERGE (per2:Persona{title: 'BDM'})
    					ON CREATE SET per2 += { uuid: '${uuidv1()}', description: 'BDM', created_at: {date}, updated_at: {date}, onCreate: true }
    					FOREACH(ifthen in per2.onCreate |
    					    MERGE (per2)-[:author{uuid:'${uuidv1()}'}]->(p)
    					    REMOVE per2.onCreate
    					)

    					MERGE (i1:Interaction{title:'Run (H1) Initiatives'})
    					ON CREATE SET i1 += { uuid: '${uuidv1()}', description: 'Run (H1) Initiatives', color: 'orange', created_at: {date}, updated_at: {date}, onCreate: true }
    					FOREACH(ifthen in i1.onCreate |
    					    MERGE (i1)-[:author{uuid:'${uuidv1()}'}]->(p)
    					    REMOVE i1.onCreate
    					)
              MERGE (i2:Interaction{title:'Grow (H2) Initiatives'})
    					ON CREATE SET i2 += { uuid: '${uuidv1()}', description: 'Grow (H2) Initiatives', color: 'blue', created_at: {date}, updated_at: {date}, onCreate: true }
    					FOREACH(ifthen in i2.onCreate |
    					    MERGE (i2)-[:author{uuid:'${uuidv1()}'}]->(p)
    					    REMOVE i2.onCreate
    					)
              MERGE (i3:Interaction{title:'Transform (H3) Initiatives'})
    					ON CREATE SET i3 += { uuid: '${uuidv1()}', description: 'Transform (H3) Initiatives', color: 'green', created_at: {date}, updated_at: {date}, onCreate: true }
    					FOREACH(ifthen in i3.onCreate |
    					    MERGE (i3)-[:author{uuid:'${uuidv1()}'}]->(p)
    					    REMOVE i3.onCreate
    					)

    					WITH n, s1, s2, s3, p, per1, per2, i1, i2, i3
    					CREATE (n)-[:journey_stages{uuid:'${uuidv1()}', created_at:{date}, order: 0}]->(s1)
              CREATE (n)-[:journey_stages{uuid:'${uuidv1()}', created_at:{date}, order: 1}]->(s2)
              CREATE (n)-[:journey_stages{uuid:'${uuidv1()}', created_at:{date}, order: 2}]->(s3)
              CREATE (n)-[:journey_persona{uuid:'${uuidv1()}', created_at:{date}, order: 0}]->(per1)
              CREATE (n)-[:journey_persona{uuid:'${uuidv1()}', created_at:{date}, order: 1}]->(per2)
              CREATE (n)-[:journey_interactions{uuid:'${uuidv1()}', created_at:{date}, order: 0}]->(i1)
              CREATE (n)-[:journey_interactions{uuid:'${uuidv1()}', created_at:{date}, order: 1}]->(i2)
              CREATE (n)-[:journey_interactions{uuid:'${uuidv1()}', created_at:{date}, order: 2}]->(i3)
    					WITH n
    				`
          }
        }

        query += ' RETURN n'

        db.cypher({ query: query, params: params }, (err, result) => {
            let SubGraph = {};
            let GetPivot = GraphAPI.AddRemoteNodeToSubgraph(new_uuid, SubGraph, db);
            GetPivot.then(() => {
                broadcast(req.body.revised.labels[0], {
                    "post.node": SubGraph
                })
                res.send(SubGraph);
            })
            GetPivot.catch(err => {
                console.log(err)
                res.status(500).send(err)
            });
        })
    })

    //get all audience node with related segments
    //TODO - This is a temporary workaround for Demo.
    api.get('/all/Audience/Segment', (req, res) => {
        let SubGraph = {};
        let label = 'Audience';
        db.cypher({
            query: `MATCH (n:Audience) RETURN n`
        }, function(err, results) {
            if (err) res.status(500).send({ message: err });

            results.map((result) => { GraphJS.MergeNode(result.n, SubGraph) });
            if (!SubGraph.node_label_index || !SubGraph.node_label_index[label]) { res.status(500).send({ message: "No nodes of that label exist" }); return; }

            let Outgoing = GraphAPI.GetOutgoingRels(SubGraph.node_label_index[label], SubGraph, 'author', db);
            Outgoing.then(() => {
                let Incoming = GraphAPI.GetIncomingRels(SubGraph.node_label_index[label], SubGraph, 'segment_audiences', db);
                Incoming.then(() => { res.send(SubGraph); });
                Incoming.catch(() => res.status(500).send());
            });
            Outgoing.catch(() => res.status(500).send());
        });
    })

    //This is a workaround for updating strategy type node to be called from browser. So created this as a get method
    api.get('/update/strategytype', (req, res) => {
        var queries = [`MERGE (st:StrategyType { title: 'Business', order: 1 }) ON CREATE SET st.uuid = '${uuidv1()}', st.description = 'Business', st.updated_at = timestamp(), st.created_at = timestamp()`,
        `MERGE (st:StrategyType { title: 'Brand', order: 2 }) ON CREATE SET st.uuid = '${uuidv1()}', st.description = 'Brand', st.updated_at = timestamp(), st.created_at = timestamp()`,
        `MERGE (st:StrategyType { title: 'Experience', order: 3 }) ON CREATE SET st.uuid = '${uuidv1()}', st.description = 'Experience', st.updated_at = timestamp(), st.created_at = timestamp()`,
        `MERGE (st:StrategyType { title: 'Technology', order: 4 }) ON CREATE SET st.uuid = '${uuidv1()}', st.description = 'Technology', st.updated_at = timestamp(), st.created_at = timestamp()`,
            `MATCH (st:StrategyType {title:'Business'}) MATCH (s:Strategy {strategy_type: '1-Business'})
			OPTIONAL MATCH (st)-[r:strategytype_strategy]->(s) DELETE r
			MERGE (st)-[:strategytype_strategy]->(s)`,
            `MATCH (st:StrategyType {title:'Brand'}) MATCH (s:Strategy {strategy_type: '2-Brand'})
			OPTIONAL MATCH (st)-[r:strategytype_strategy]->(s) DELETE r
			MERGE (st)-[:strategytype_strategy]->(s)`,
            `MATCH (st:StrategyType {title:'Experience'}) MATCH (s:Strategy {strategy_type: '3-Experience'})
			OPTIONAL MATCH (st)-[r:strategytype_strategy]->(s) DELETE r
			MERGE (st)-[:strategytype_strategy]->(s)`,
            `MATCH (st:StrategyType {title:'Technology'}) MATCH (s:Strategy {strategy_type: '4-Technology'})
			OPTIONAL MATCH (st)-[r:strategytype_strategy]->(s) DELETE r
			MERGE (st)-[:strategytype_strategy]->(s)`]


        db.cypher({
            queries: queries
        }, function(err, results) {
            if (err) {
                res.status(500).send({ message: err });
            }
            else {
                res.send("Strategy Type updated")
            }
        });
    })

    //Following api is created to get only mostly used component of a user
	api.get('/all/getmostused/:label',(req,res) => {

		let relationshipsObj = {
			Interaction : 'journey_interactions',
			Stage : 'journey_stages',
			Persona : 'journey_persona',
			Strategy : 'journey_strategy',
			Capability : 'journey_capability',
      Mot : 'journey_mot',
			Kpi : 'journey_kpis',
			Product : 'journey_product',
			attendee: 'journey_attendee',
			facilitator: 'facilitator'
		}
		let userId = req.user.uuid;
		let label = req.params.label;

		let relationship = relationshipsObj[label];
		if(label == "attendee" || label == "facilitator"){
			label = "Person";
		}
		let query = `match (i:${label}) -[r:${relationship}]-(j:Journey) -[a:author]- (p:Person {uuid:'${userId}'}) return i order by LOWER(i.title) `
		let SubGraph = {};
		let Outgoing;
		db.cypher({
			query: query
		}, function (err, results) {
			if (err) res.status(500).send({ message: err });
			let arrayWithCount = [];
            var data = results;

			if(results && results.length){
				results.forEach((elem) => {
					let index = arrayWithCount.findIndex(item => item.i.properties.uuid === elem.i.properties.uuid);
					if(index > -1){
						arrayWithCount[index].i.count += 1;
					}else{
						elem.i.count = 1;
						arrayWithCount.push(elem);
					}
				})
				arrayWithCount.sort(function(a, b){
					if(b.i.count != a.i.count){
						return b.i.count-a.i.count
					}else{
						if(a.i.properties.title.toUpperCase() < b.i.properties.title.toUpperCase()){
							return -1;
						}
						else if (a.i.properties.title.toUpperCase() > b.i.properties.title.toUpperCase()){
							return 1;
						}
						return 0;
					}
				});

				let topUsedComponents;
				topUsedComponents = arrayWithCount;
				topUsedComponents.map((result) => {
					GraphJS.MergeNode(result.i, SubGraph);
				});
				if (!SubGraph.node_label_index || !SubGraph.node_label_index[label]) {
					res.status(200).send([])
				} else {
					Outgoing = GraphAPI.GetOutgoingRels(SubGraph.node_label_index[label], SubGraph, 'author', db);
					Outgoing.then(() => {
						topUsedComponents.forEach((item)=>{
							SubGraph.nodes[item.i.properties.uuid].count = item.i.count;
						})
						res.send(SubGraph);
					}).catch(() => res.status(500).send({message : "error"}));
				}
			}
			else{
				res.send({message:`You have not added any component of ${label} type to any journey`});
			}
		});
    })

	api.get('/all/attendeeadded/count',(req,res)=>{
			let query = `match(p:Person) WHERE ((p)-[:${req.query.type}]-(:Journey{uuid:"${req.query.uuid}"})) AND  p.email =~ '.*${req.query.searchTerm}.*' return count(p) as count`;
			db.cypher({
				query:query
			},function(err,results){
				res.send(...results);
			});


	});

	api.get('/all/attendee/count',(req,res)=>{
		if(req.query.type == "project_attendee"){
			handleProject(req,res,disp);
			function disp(req,res,paramsArr){
				getProjectsFromMileStonesCount(req,res,paramsArr)
			}
		}else {
			let On = "Journey";
			if(req.query.type == "bullseye_attendee"){
				On = 'Bullseye';
			}
			let query = `match(p:Person) WHERE NOT((p)-[:${req.query.type}]-(:${On}{uuid:"${req.query.uuid}"})) AND  (p.email =~ '.*${req.query.searchTerm}.*'  OR p.firstname =~ '(?i).*${req.query.searchTerm}.*' OR p.alias =~ '(?i).*${req.query.searchTerm}.*' OR p.lastname =~ '(?i).*${req.query.searchTerm}.*') return count(p) as count`;
			db.cypher({
				query:query
			},function(err,results){
				res.send(...results);
			});
		}

	});

    //Get all nodes which are not of particular users

	api.get('/all/attendee',(req,res)=>{

		let SubGraph = {};
		let Outgoing;
		let On = ""
		let query = "";
		let {searchTerm} = req.query;
		const label = "Person";
		console.log(req.query.searchTerm);
		// if(searchTerm ==""){
		// 	console.log("Accomplished");
		// }else {
		// 	console.log("Not Accomplished")
		// }
		if(req.query.type == "project_attendee"){
			handleProject(req,res,disp);
			function disp(req,res,paramsArr){
				getProjectsFromMileStones(req,res,paramsArr)
			}
		}else if(req.query.type == "milestone_coordinator"){
			On = "Milestone";
			if(searchTerm ==""){
				res.send([]);
			}else {
				console.log("Not Accomplished");
			query = `match(p:Person) WHERE NOT((p)-[:${req.query.type}]-(:${On}{uuid:"${req.query.uuid}"})) AND  p.email =~ '(?i).*${req.query.searchTerm}.*' return p ORDER BY LOWER(p.email) ASC SKIP ${parseInt(req.query.skip)}`;

			}
			db.cypher({
				query: query
			}, function (err, results) {
				if (err) res.status(500).send({ message: err });

				results.map((result) => {
					GraphJS.MergeNode(result.p, SubGraph)
				});
				if (!SubGraph.node_label_index || !SubGraph.node_label_index[label]) {
					res.status(200).send([])
				} else {
					Outgoing = GraphAPI.GetOutgoingRels(SubGraph.node_label_index[label], SubGraph, 'author', db);
					Outgoing.then(() => {
						res.send(SubGraph);
					});
					Outgoing.catch(() => res.status(500).send());
				}
			});
		} else {
			On = "Journey";
			if(req.query.type == "bullseye_attendee"){
				On = "Bullseye"
			}
			if(searchTerm ==""){
				console.log("+++++++++++++++++++++search+term+++++++++++++++++++++++++++++++++++");
				res.send([]);
			}else {
				query = `match(p:Person) WHERE NOT((p)-[:${req.query.type}]-(:${On}{uuid:"${req.query.uuid}"})) AND  (p.email =~ '(?i).*${req.query.searchTerm}.*' OR p.firstname =~ '(?i).*${req.query.searchTerm}.*' OR p.alias =~ '(?i).*${req.query.searchTerm}.*' OR p.lastname =~ '(?i).*${req.query.searchTerm}.*') return p ORDER BY LOWER(p.email) ASC SKIP ${parseInt(req.query.skip)}`;
			}
			db.cypher({
				query: query
			}, function (err, results) {
				if (err) res.status(500).send({ message: err });

				results.map((result) => {
					GraphJS.MergeNode(result.p, SubGraph)
				});
				if (!SubGraph.node_label_index || !SubGraph.node_label_index[label]) {
					res.status(200).send([])
				} else {
					Outgoing = GraphAPI.GetOutgoingRels(SubGraph.node_label_index[label], SubGraph, 'author', db);
					Outgoing.then(() => {
						res.send(SubGraph);
					});
					Outgoing.catch(() => res.status(500).send());
				}
			});
		}

	});

	function handleProject(req,res,cb){
		let uuidArr = [];
		let getMilestonesQuery = `match(p:Milestone) WHERE ((p)-[:project_milestone]-(:Project {uuid:"${req.query.uuid}"})) return p`;
		db.cypher({
			query: getMilestonesQuery
		},  (err, results)=> {
			results.forEach((element)=>{
				uuidArr.push(element.p.properties.uuid);
			});
			cb(req,res,uuidArr);

		});

	}

	function getProjectsFromMileStonesCount(req,res,paramsArr){
		let ids = paramsArr.map(param => `"${param}"`).join(',');

		let query = `MATCH (excluded:Person) WHERE ((excluded)-[:project_attendee]-(:Project {uuid:"${req.query.uuid}"})) WITH collect(excluded) AS excluded OPTIONAL MATCH (p:Person)-[:milestone_coordinator]-(other:Milestone) WHERE other.uuid IN [${ids}] WITH excluded + collect(p) AS combined MATCH (per:Person) where NOT per in combined AND  per.email =~ '(?i).*${req.query.searchTerm}.*' return count(per) as count`
		db.cypher({
			query: query
		}, function (err, results) {
			if (err) res.status(500).send({ message: err });
			res.send(...results);
		});


	}

	function getProjectsFromMileStones(req,res,paramsArr){
		let ids = paramsArr.map(param => `"${param}"`).join(',');
		let searchTerm = req.query;
		let SubGraph = {};
		const label = "Person";
		let Outgoing;
		let query = "";
		if(searchTerm ==""){
			res.send([]);
		}else {
			console.log("Not Accomplished")
		query = `MATCH (excluded:Person) WHERE ((excluded)-[:project_attendee]-(:Project {uuid:"${req.query.uuid}"})) WITH collect(excluded) AS excluded OPTIONAL MATCH (p:Person)-[:milestone_coordinator]-(other:Milestone) WHERE other.uuid IN [${ids}] WITH excluded + collect(p) AS combined MATCH (per:Person) where NOT per in combined AND per.email =~ '(?i).*${req.query.searchTerm}.*' return per ORDER BY LOWER(per.email) ASC SKIP ${parseInt(req.query.skip)} LIMIT ${parseInt(req.query.limit)}`

		}
		db.cypher({
			query: query
		}, function (err, results) {
			if (err) res.status(500).send({ message: err });
			results.map((result) => {
				GraphJS.MergeNode(result.per, SubGraph)
			});
			if (!SubGraph.node_label_index || !SubGraph.node_label_index[label]) {
				res.status(200).send([])
			} else {
				Outgoing = GraphAPI.GetOutgoingRels(SubGraph.node_label_index[label], SubGraph, 'author', db);
				Outgoing.then(() => {
					res.send(SubGraph);
				});
				Outgoing.catch(() => res.status(500).send());
			}
		});


	}

	api.get('/all/person/count',(req,res)=>{

		let query = `match(p:Person) WHERE ((p)-[:${req.query.type}]-(:Journey{uuid:"${req.query.uuid}"})) AND  p.email =~ '.*${req.query.searchTerm}.*' return count(p) as count`;
		db.cypher({
			query:query
		},function(err,results){
			res.send(...results);
		});
	});


	api.get('/all/added', (req, res) => {
		let label = "Person";
		let query ='';
		query = `match(n:Person) WHERE ((n)-[:${req.query.type}]-(:Journey{uuid:"${req.query.uuid}"})) return n`
		// migrate functionality starting with Note labels only
		if(false){
		// if(label === 'Note'){
			db.cypher({
				query: `MATCH (n:${label}) RETURN n`
			}, function (err, results) {
				if (err) res.status(500).send({ message: err });
				res.status(200).send(results)
			});
		// keep original functionality on everything else
		} else {
			let SubGraph = {};
			let Outgoing;

			db.cypher({
				query: query
			}, function (err, results) {
				if (err) res.status(500).send({ message: err });
				results.map((result) => {
					GraphJS.MergeNode(result.n, SubGraph)
				});
				if (!SubGraph.node_label_index || !SubGraph.node_label_index[label]) {
					res.status(200).send([])
				} else {
					Outgoing = GraphAPI.GetOutgoingRels(SubGraph.node_label_index[label], SubGraph, 'author', db);
					Outgoing.then(() => {
						res.send(SubGraph);
					});
					Outgoing.catch(() => res.status(500).send());
				}
			});
		}
	})
	api.get('/all/search/:label',(req,res) =>{
		let label = req.params.label;
		let {journeyuuid,searchTerm} = req.query;

		let query = '';
		if(searchTerm == null || searchTerm == 'undefined' || searchTerm == ''){
			// console.log("--------++++++++++++++++++++++++++++-------")
			// query = `MATCH(n:${label}) WHERE NOT((n)-[:journey_stages|journey_persona|journey_kpis|journey_interactions|journey_statergy|journey_capability|journey_product|journey_audiences]-(:Journey{uuid:"${journeyuuid}"})) RETURN (n)`
			res.send([]);
		}else {
			query = `MATCH(n:${label}) WHERE NOT((n)-[:journey_stages|journey_persona|journey_kpis|journey_mots|journey_interactions|journey_statergy|journey_capability|journey_product|journey_audiences]-(:Journey{uuid:"${journeyuuid}"})) and n.title =~ '(?i).*${searchTerm}.*'  RETURN (n)`
		}

		let SubGraph = {};
		let Outgoing;
		db.cypher({
			query: query
		}, function (err, results) {
			if (err) res.status(500).send({ message: err });

			results.map((result) => {
				GraphJS.MergeNode(result.n, SubGraph)
			});
			if (!SubGraph.node_label_index || !SubGraph.node_label_index[label]) {
				res.status(200).send([])
			} else {
				Outgoing = GraphAPI.GetOutgoingRels(SubGraph.node_label_index[label], SubGraph, 'author', db);
				Outgoing.then(() => {

					res.send(SubGraph);
				});
				Outgoing.catch(() => res.status(500).send());
			}
		});
	})


	//Gets all nodes of a certain label
	api.get('/all/:label', (req, res) => {
		let label = req.params.label;
		let isProject = req.query.isProjectJourney;
		let userId = req.user.uuid;

		let query = `MATCH (n:${label}) RETURN n`

		// special case for Person label to not include users generated for event
		if( label === 'Person' ) {
			query = `MATCH (n:Person) RETURN n`
		}
		else if(label === 'Note'){
			query = `match (n:Note)-[r:note_journey]-(j:Journey {uuid:'${req.query.isLimit}'}) return n`;
		}
    else if(label === 'Mot') {
      query = `MATCH (n:Mot) WHERE COALESCE(n.solution, false) = false AND COALESCE(n.archive, false) = false RETURN n`
    }
		if(req.query.isLimit == "true"){
			query = `MATCH (n:${label}) return n`

			query = query + ' limit 30';
		}

		if(isProject == "true"){
			query = `MATCH (n:Journey)-[:author|journey_attendee|journey_external_attendee|facilitator]-(p:Person{uuid:'${userId}'}) return n`
		}

		// migrate functionality starting with Note labels only
		if(false){
		// if(label === 'Note'){
			db.cypher({
				query: `MATCH (n:${label}) RETURN n`
			}, function (err, results) {
				if (err) res.status(500).send({ message: err });
				res.status(200).send(results)
			});
		// keep original functionality on everything else
		} else {
			let SubGraph = {};
			let Outgoing;
			db.cypher({
				query: query
			}, function (err, results) {
				if (err) res.status(500).send({ message: err });

        console.log(results.map(result => result.n.properties))

				results.map((result) => {
					GraphJS.MergeNode(result.n, SubGraph)
				});
				if (!SubGraph.node_label_index || !SubGraph.node_label_index[label]) {
					res.status(200).send([])
				} else {
					Outgoing = GraphAPI.GetOutgoingRels(SubGraph.node_label_index[label], SubGraph, 'author', db);
					Outgoing.then(() => {

						res.send(SubGraph);
					});
					Outgoing.catch(() => res.status(500).send());
				}
			});
		}
	})

	//Gets all nodes of a certain label
	api.get('/authored/:label/:author_uuid', (req, res) => {
		let SubGraph = {};
		let label = req.params.label;
		db.cypher({
			query: `MATCH (n:${label})-[:author]-(p:Person {uuid:"${req.params.author_uuid}"}) RETURN n`
		}, function (err, results) {
			if (err) res.status(500).send({ message: err });

			results.map((result) => { GraphJS.MergeNode(result.n, SubGraph); });
			if (!SubGraph.node_label_index || !SubGraph.node_label_index[label]) { res.status(500).send({ message: "You have not authored any nodes" }); return; }
			let Outgoing = GraphAPI.GetOutgoingRels(SubGraph.node_label_index[label], SubGraph, 'author', db);
			Outgoing.then(() => { res.send(SubGraph); });
			Outgoing.catch((err) => res.status(500).send());
		});
	})

	//Gets all nodes of a certain label
	api.get('/where/:label/:key/:val/:type', (req, res) => {
		let SubGraph = {};
		let Outgoing;
		let query = "";
		let label = req.params.label;

		if (label == "undefined" || label == 'null') {
			query += 'MATCH (n) ';
		} else {
			query += `MATCH (n:${label}) `;
		}
		let key = req.params.key;
		let val = req.params.val;
		let type = req.params.type;
		if (type == "bool") val = (val.toLowerCase() == "true");
		let is_string = (type == "string");
		query += ` WHERE n.${key} ${(is_string) ? "=~ '(?i).*" : "= "}${val}${(is_string) ? ".*'" : ""} RETURN n`;

		db.cypher({
			query: query
		}, function (err, results) {
			if (err) res.status(500).send({ message: err });

			results.map((result) => { GraphJS.MergeNode(result.n, SubGraph) });
			if (!SubGraph.node_label_index || !SubGraph.node_label_index[label]) {
				res.status(200).send([]);
			}
			Outgoing = GraphAPI.GetOutgoingRels(SubGraph.node_label_index[label], SubGraph, 'author', db);
			Outgoing.then(() => {
				res.status(200).send(SubGraph);
			});
			Outgoing.catch((err) => res.status(404).send());
		})
	})

	//Gets all nodes of a certain label
	api.get('/search/:label/:key/:val/:type', (req, res) => {
		let SubGraph = {};
		let query = "";
		let label = req.params.label;

		if (label == "undefined" || label == "null") {
			query += 'MATCH (n) ';
		} else {
			query += `MATCH (n:${label}) `;
		}
		let key = req.params.key;
		let val = req.params.val;
		if (val == "undefined" || val == "null") {
			query += ` RETURN n`;
		} else {
			let type = req.params.type;
			if (type == "bool") val = (val.toLowerCase() == "true");
			let is_string = (type == "string");
			query += ` WHERE n.${key} =~ ${(is_string) ? "'(?i).*" : ""}${val}${(is_string) ? ".*'" : ""}  OR n.description =~ ${(is_string) ? "'(?i).*" : ""}${val}${(is_string) ? ".*'" : ""} RETURN n`;
		}
		db.cypher({
			query
		}, function (err, results) {
			if (err) res.status(500).send({ message: err });

			results.map((result) => { GraphJS.MergeNode(result.n, SubGraph) });
			res.send(SubGraph);

		})
	})

	//Gets all nodes of a certain label
	api.get('/subgraph/:uuid', (req, res) => {
		let SubGraph = {};
		let query = `MATCH (n) WHERE n.uuid = '${req.params.uuid}' RETURN n`;
		db.cypher({
			query
		}, function (err, results) {
			if (err) res.status(500).send({ message: err });

			results.map((result) => { GraphJS.MergeNode(result.n, SubGraph) });
			if (!SubGraph.node_label_index) { res.status(500).send({ message: "No nodes of that label exist" }); return; }

			let Outgoing = GraphAPI.GetOutgoingRels([req.params.uuid], SubGraph, null, db);
			Outgoing.then(() => {
				let Incoming = GraphAPI.GetIncomingRels([req.params.uuid], SubGraph, null, db);
				Incoming.then(() => { res.send(SubGraph); });
				Incoming.catch(() => res.status(500).send());
			});
			Outgoing.catch((err) => res.status(500).send());
		})
	})
	//Gets all nodes of a certain label
	api.get('/subgraphs/:uuid_array', (req, res) => {
		let uuids = req.params.uuid_array.split(",");
		let SubGraph = {};
		let query = `MATCH (n) WHERE n.uuid in {uuids} RETURN n`;
		db.cypher({
			query: query,
			params: { uuids }
		}, function (err, results) {
			if (err) res.status(500).send({ message: err });

			results.map((result) => { GraphJS.MergeNode(result.n, SubGraph) });
			if (!SubGraph.node_label_index) { res.status(500).send({ message: "No nodes of that label exist" }); return; }

			let Outgoing = GraphAPI.GetOutgoingRels(uuids, SubGraph, null, db);
			Outgoing.then(() => {
				let Incoming = GraphAPI.GetIncomingRels(uuids, SubGraph, null, db);
				Incoming.then(() => { res.send(SubGraph); });
				Incoming.catch(() => res.status(500).send());
			});
			Outgoing.catch((err) => res.status(500).send());
		})
	})



	api.post('/relate', (req, res) => {
		let query = `MATCH (u{uuid:'${req.body.from_id}'}), (n {uuid:'${req.body.to_id}'}) CREATE (u)-[e:${req.body.rel_type} {uuid:'${uuidv1()}', created_at:${new Date().getTime()}}]->(n) `;
		Object.keys(req.body.properties).forEach((key) => {
			if (key == 'uuid') return;
			let is_string = Object.prototype.toString.call(req.body.properties[key]).slice(8, -1) == "String";
			query += ` SET e.${key} = ${is_string ? "'" : ""}${req.body.properties[key]}${is_string ? "'" : ""}`
		});
		db.cypher({ query }, function (err, results) {
			if (err) res.status(500).send(err);
			res.send(query);

		});
	});

	//Gets all nodes of a certain label
	api.get('/relations/:from_id/:rel_type/:to_id', (req, res) => {

		let SubGraph = {};
		let rel_query = "[rel" + ((req.params.rel_type == "null" || req.params.rel_type == "undefined" || req.params.rel_type.length == 0) ? "]" : ":" + req.params.rel_type + "]");
		let query = `MATCH (from {uuid:'${req.params.from_id}'})-` + rel_query + `-(to {uuid:'${req.params.to_id}'}) RETURN from, rel,to`;
		console.log(query);
		db.cypher({
			query: query
		}, function (err, results) {
			if (err) res.status(500).send({ message: err });

			results.map((result) => {
				GraphJS.MergeNode(result.from, SubGraph);
				GraphJS.MergeNode(result.to, SubGraph);
				GraphJS.MergeRelationship(result.rel, SubGraph);
			});
			res.send(SubGraph);
		})
	});
	// let emails = [];
	api.post('/bulk/addition',function(req,res){
		let emails = req.body.users.attendees.map(function(element,index){
			return element.email
		});
		let params = {}
		params.emails= emails;
		let query = `MATCH (j:Journey{uuid: '${req.body.users.uuid}'}) UNWIND $emails as email
					MATCH (p:Person) WHERE p.email = trim(toLower(email)) OR p.alias = trim(toLower(email))
					MERGE (p)<-[:journey_attendee]-(j)`
		db.cypher({ query: query, params: params }, (err, result) => {
					if (err) res.status(500).send(err);
					res.send("attendees added successfully");
		});
	});

  function isJson(str) {
      try {
          JSON.parse(str);
      } catch (e) {
          return false;
      }
      return true;
  }

	return api;
}
