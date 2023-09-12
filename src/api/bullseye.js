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

	//Bullseye Dashboard View Getters for 3 Role Views
	api.get("/attendee/:uuid", (req, res) => {
		let SubGraph = {};
		let GetLibrary = FullfillLibraryView(SubGraph, `MATCH (n:Bullseye)-[:journey_attendee]->(p:Person {uuid:'${req.params.uuid}'}) WHERE NOT n:CompanyBullseye RETURN n`);
		GetLibrary.then(() => res.send(SubGraph));
		GetLibrary.catch((err) => res.status(500).send(err));
	});

	//Returns only the People invited to a Journey Workshop
	api.get('/invitees/:bullseye_uuid', (req, res) => {
		var SubGraph = {};
		let GetPivot = GraphAPI.AddRemoteNodeToSubgraph(req.params.bullseye_uuid, SubGraph, db);
		GetPivot.then(() => {
			let Outgoing = GraphAPI.GetOutgoingRels([req.params.bullseye_uuid], SubGraph, 'bullseye_attendee', db);
			Outgoing.then(() => { res.send(SubGraph); });
			Outgoing.catch((err) => { res.status(500).send(err); })
		});
		GetPivot.catch((err) => { res.status(500).send(err); })
	});

	// save bullseye attendees
	api.put('/attendees/:bullseye_uuid', (req, res) => {
		var query = `MATCH (b:Bullseye{uuid:'${req.params.bullseye_uuid}'}) `
		req.body.attendees.add.forEach((uuid, idx) => {
			query += `MATCH (p${idx}:Person{uuid:'${uuid}'}) MERGE (b)-[:bullseye_attendee]-(p${idx}) WITH b `
		})
		req.body.attendees.remove.forEach((uuid, idx) => {
			query += `MATCH (p${idx}:Person{uuid:'${uuid}'})-[r:bullseye_attendee]-(b) delete r WITH b `
		})
		query += 'MATCH (b)-[:bullseye_attendee]-(attendees:Person) RETURN attendees'

		db.cypher({ query }, (err, result) => {
			if (err) res.status(400).send({ message: err });
			res.status(200).send(result)
		});
	});


	api.get("/admin/:uuid", (req, res) => {
		let SubGraph = {};
		let GetLibrary = FullfillLibraryView(SubGraph, `MATCH (n:Bullseye)-[:author]->(p:Person {uuid:'${req.params.uuid}'}) WHERE NOT n:CompanyBullseye RETURN n`);
		GetLibrary.then(() => res.send(SubGraph));
		GetLibrary.catch((err) => res.status(500).send(err));
	});

	// TODO - Refactor API path
	// Returns all Workshop Bullseye details to display as a card
	api.get("/tenant", (req, res) => {
		let SubGraph = {};
		let query = `MATCH (n:Bullseye) WHERE NOT n:CompanyBullseye`;
		if(!config.sysadmins.includes(req.user.email)) {
			query += ` MATCH (n)-[:author|bullseye_attendee]-(p:Person{uuid:'${req.user.uuid}'})`
		}
		query += ' RETURN n'
		let GetLibrary = FullfillLibraryView(SubGraph, query);
		GetLibrary.then(() => res.send(SubGraph));
		GetLibrary.catch((err) => res.status(500).send(err));
	});


	api.post('/companyBullseye', (req, res) => {
		let query = `
			MATCH(cb:Bullseye:CompanyBullseye)
			MATCH(b:Bullseye{uuid:'${req.body.uuid}'})
			REMOVE cb:CompanyBullseye
			WITH b
			SET b:CompanyBullseye
		`;
		console.log(query)
		db.cypher({query: query}, (err, results) => {
			if(err) {
				res.sendStatus(400);
			} else {
				res.sendStatus(200);
			}
		})
	})

	//TODO - Refactor API path
	// Returns the Company Bullseye details to display as a card
	// Different node is used so Neo4j db browser will display this node in different color from the rest of workshop bullseye nodes
	api.get("/dashboard/card", (req, res) => {
		let SubGraph = {};
		let GetLibrary = FullfillLibraryView(SubGraph, `MATCH (n:CompanyBullseye) RETURN n`);
		GetLibrary.then(() => res.send(SubGraph));
		GetLibrary.catch((err) => res.status(500).send(err));
	});

	api.get("/connections/:uuid", (req, res) => {
		var query = `MATCH (bs {uuid:'${req.params.uuid}'})-[:bullseye_intersection]-(it: Intersection)
		WHERE bs:Bullseye OR bs:CompanyBullseye
		MATCH (stgy)<-[:intersection_strategy]-(it)-[:intersection_audience]->(aud)
		RETURN it.uuid as ituuid, stgy.uuid as stgyuuid, aud.uuid as auduuid`;
		console.log(query)
		db.cypher({
			query: query
		}, function (err, results) {
			if (err || !results || results.length == 0 || results[0] == null) {
				res.status(204).send(err);
			} else {
				var response = []
				results.map((result) => {
					console.log(result);
					response.push({ uuid: result.ituuid, audienceUuid: result.auduuid, strategyUuid: result.stgyuuid });
				});

				res.json(response);
			}
		});
	});

	//TODO - Refactor properly
	api.put("/connections/:uuid", (req, res) => {
		var query = `MATCH (bs {uuid:'${req.params.uuid}'})-[:bullseye_intersection]-(it: Intersection)
		WHERE bs:Bullseye OR bs:CompanyBullseye
		MATCH (stgy)<-[:intersection_strategy]-(it)-[:intersection_audience]->(aud)
		RETURN DISTINCT it.uuid as ituuid, stgy.uuid as stgyuuid, aud.uuid as auduuid`;

		var newIntersections = [];
		if (Object.keys(req.body).length != 0) {
			newIntersections = req.body;
		}

		var existingIntersections = []
		db.cypher({
			query: query
		}, function (err, results) {
			if (!err) {
				results.map((result) => {
					existingIntersections.push({ intersectionUuid: result.ituuid, audienceUuid: result.auduuid, strategyUuid: result.stgyuuid });
				});

				var deleteQuery = `MATCH (it: Intersection)-[r]-()
				WHERE it.uuid IN {delintersectionlist}
				DELETE r, it`;

				var queries = [];
				var delintersectionlist = [];
				for (var i = 0; i < existingIntersections.length; i++) {
					var existing = newIntersections.find(s => s.audienceUuid == existingIntersections[i].audienceUuid
						&& s.strategyUuid == existingIntersections[i].strategyUuid);

					if (existing == undefined) {
						console.log(i + ' ==> ' + existingIntersections[i].intersectionUuid);
						delintersectionlist.push(existingIntersections[i].intersectionUuid);
						// queries.push({
						// 	query: deleteQuery,
						// 	params: { intersectionuuid: existingIntersections[i].intersectionUuid }
						// });
					}
				}

				if (delintersectionlist.length != 0) {
					queries.push({
						query: deleteQuery,
						params: { delintersectionlist: delintersectionlist }
					});
				}

				var createQuery = `MATCH (bs {uuid: {bullseyeuuid}}) WHERE bs:Bullseye OR bs:CompanyBullseye
				MATCH (s:Strategy {uuid: {strategyuuid}})
				MATCH (a:Audience {uuid: {audienceuuid}})
				CREATE (s)<-[:intersection_strategy]-(it: Intersection {uuid: {intersectionuuid}})-[:intersection_audience]->(a),
				(bs)-[:bullseye_intersection]->(it)`;

				for (var i = 0; i < newIntersections.length; i++) {
					var newNode = existingIntersections.find(s => s.audienceUuid == newIntersections[i].audienceUuid
						&& s.strategyUuid == newIntersections[i].strategyUuid);

					if (newNode == undefined) {
						var param_local = {
							bullseyeuuid: req.params.uuid,
							audienceuuid: newIntersections[i].audienceUuid,
							strategyuuid: newIntersections[i].strategyUuid,
							intersectionuuid: uuidv1()
						};
						queries.push({ query: createQuery, params: param_local });
					}
				}

				console.log(queries);

				db.cypher({
					queries: queries
				}, function (err, results) {
					if (err) {
						console.log(err)
						res.status(500).send(err)
					}
					else {
						res.sendStatus(200);
					}
				});
			}
		});
	});


	api.get('/interactions', (req, res) => {
		db.cypher({query: 'MATCH (i:Interaction) RETURN properties(i) AS interactions'},
		(err, results) => {
			if(err) {
				res.status(400).send([])
			} else {
				results = results.map(result => {
					return result.interactions;
				})
				res.status(200).send(results)
			}
		})
	})

	api.get("/dashboard", (req, res) => {
		var queries = [`MATCH (seg:Segment)-[:segment_audiences]-(aud: Audience)-[:intersection_audience]-(it: Intersection)-[:bullseye_intersection]-(be:CompanyBullseye)
						RETURN DISTINCT seg.uuid AS seguuid, seg.title AS segtitle, aud.uuid AS auduuid, aud.title AS audtitle ORDER BY seg.title, aud.title`,
			`MATCH (st:StrategyType) RETURN st.uuid AS stuuid, st.title AS sttitle ORDER BY st.order`,
			`MATCH (be:CompanyBullseye)-[:bullseye_intersection]-(it: Intersection)
				MATCH (stgy: Strategy)-[:intersection_strategy]-(it)-[:intersection_audience]-(aud: Audience)
				MATCH (st:StrategyType)-[:strategytype_strategy]-(stgy)-[:journey_strategy]-(j:Journey)
				MATCH (seg:Segment)-[:segment_audiences]-(aud)-[:journey_audiences]-(j:Journey)
				RETURN DISTINCT {name: stgy.title, type: st.title} as strategy, it.uuid AS ituuid, seg.uuid AS seguuid, aud.uuid AS auduuid, st.uuid AS stuuid, COLLECT(distinct j.uuid) AS journeys, AVG(j.journey_score) as avgjourneyscore`];
		db.cypher({
			queries: queries
		}, function (err, results) {
			if (err) {
				res.status(204).send(err);
			} else {
				var segments = []
				results[0].forEach(function (row) {
					var seg = segments.find(s => s.uuid == row.seguuid)
					if (seg == undefined) {
						seg = { uuid: row.seguuid, name: row.segtitle, audiences: [] };
						segments.push(seg);
					}

					if (row.auduuid) {
						seg.audiences.push({ uuid: row.auduuid, name: row.audtitle });
					}
				}, this);
				//console.log(segments);

				var segmentTypes = []
				results[1].forEach(function (row) {
					segmentTypes.push({ uuid: row.stuuid, name: row.sttitle })
				}, this);

				var intersections = []
				results[2].forEach(function (row) {
					intersections.push({
						intersectionUuid: row.ituuid, audienceUuid: row.auduuid, segmentUuid: row.seguuid,
						strategytypeUuid: row.stuuid, strategy: row.strategy, journeys: row.journeys, avgJourneyScore: row.avgjourneyscore
					});
				}, this);

				res.json({ segments: segments, strategyTypes: segmentTypes, intersection: intersections });
			}
		});
	});
				// OPTIONAL MATCH (it)-[bc:bullseye_comment]-(p:Person {uuid: '${req.params.personuuid}'})

	api.get("/workshop/:uuid/:personuuid", (req, res) => {
		// Get Segment & Audience
		var queries = [`MATCH (seg:Segment)-[:segment_audiences]-(aud: Audience)-[:intersection_audience]-(it: Intersection)-[:bullseye_intersection]-(be:Bullseye {uuid:'${req.params.uuid}'})
						RETURN DISTINCT seg.uuid AS seguuid, seg.title AS segtitle, aud.uuid AS auduuid, aud.title AS audtitle ORDER BY seg.title, aud.title`,
			`MATCH (st:StrategyType) RETURN st.uuid AS stuuid, st.title AS sttitle ORDER BY st.order`,
		`MATCH (be:Bullseye {uuid:'${req.params.uuid}'})-[:bullseye_intersection]-(it: Intersection)
				MATCH (stgy: Strategy)-[:intersection_strategy]-(it)-[:intersection_audience]-(aud: Audience)
				OPTIONAL MATCH (stgy)-[:strategytype_strategy]-(st:StrategyType)
				OPTIONAL MATCH (aud)-[:segment_audiences]-(seg: Segment)
				OPTIONAL MATCH (it)-[allv:vote]-(allp:Person)
				OPTIONAL MATCH (it)-[uv:vote]-(p:Person {uuid: '${req.params.personuuid}'})
				OPTIONAL MATCH (it)-[comments:bullseye_comment]-(commentp:Person {uuid: '${req.params.personuuid}'})
				RETURN DISTINCT {name: stgy.title, type: st.title} as strategy, it.uuid AS ituuid, seg.uuid AS seguuid, aud.uuid AS auduuid, st.uuid AS stuuid, count(allv) AS votecount, SUM(allv.score) AS totalscore, uv.score AS userscore,collect(comments) as comments,commentp`,
				`MATCH (be:Bullseye {uuid:'${req.params.uuid}'}) RETURN be.uuid AS beuuid, be.title AS betitle`];

		console.log(queries);
		db.cypher({
			queries: queries
		}, function (err, results) {
			if (err) {
				res.status(204).send(err);
			} else {
				var segments = []
				results[0].forEach(function (row) {
					var seg = segments.find(s => s.uuid == row.seguuid)
					if (seg == undefined) {
						seg = { uuid: row.seguuid, name: row.segtitle, audiences: [] };
						segments.push(seg);
					}

					if (row.auduuid) {
						seg.audiences.push({ uuid: row.auduuid, name: row.audtitle });
					}
				}, this);
				//console.log(segments);

				var segmentTypes = []
				results[1].forEach(function (row) {
					segmentTypes.push({ uuid: row.stuuid, name: row.sttitle })
				}, this);

				var intersections = []
				results[2].forEach(function (row) {

					if(row.commentp !=null){
						row.comments.forEach(function(item,index){
							row.comments[index].properties.firstname = row.commentp.properties.firstname;
							row.comments[index].properties.personuuid = row.commentp.properties.uuid;
						});
					}
					console.log(row.comments);
					intersections.push({
						intersectionUuid: row.ituuid, audienceUuid: row.auduuid, segmentUuid: row.seguuid,
						strategytypeUuid: row.stuuid, strategy: row.strategy, voteCount: row.votecount,
						totalScore: row.totalscore, averageScore: (row.totalscore / row.votecount),
						 userScore: row.userscore,
						 comments:row.comments,

					});
				}, this);

				var bullseyedata = null
				results[3].forEach(function (row) {
					if (row.beuuid != null) {
						bullseyedata = { uuid: row.beuuid, title: row.betitle };
					}
				}, this);

				if (bullseyedata != null) {
					res.json({ bullseye: bullseyedata, segments: segments, strategyTypes: segmentTypes, intersection: intersections });
				}
				else {
					res.sendStatus(204);
				}
			}
		});
	});

	api.post("/workshop/:uuid/:intersectionuuid", (req, res) => {
		var inp = req.body;
		var query = `MATCH (it:Intersection {uuid: '${req.params.intersectionuuid}'})
					MATCH (p: Person {uuid: {personuuid}})
					MERGE (p)-[v:vote]->(it)
					SET v.score = {score}`;

		db.cypher({
			query: query,
			params: { personuuid: inp.personuuid, score: parseInt(inp.score) }
		}, function (err, results) {
			if (err) {
				res.status(204).send(err);
			} else {
				var query = `MATCH (it: Intersection {uuid:'${req.params.intersectionuuid}'})
				OPTIONAL MATCH (it)-[allv:vote]-(allp:Person)
				RETURN it.uuid AS ituuid, COUNT(allv) AS votecount, SUM(allv.score) AS totalscore`;
				db.cypher({
					query: query,
					params: { personuuid: inp.personuuid }
				}, function (err, results) {
					if (err) {
						res.status(204).send(err);
					} else {
						results.map((result) => {
							var intersection = {
								intersectionUuid: result.ituuid, voteCount: result.votecount,
								totalScore: result.totalscore, averageScore: (result.totalscore / result.votecount)
							};
							console.log('emit workshopbullseye.update: ' + req.params.uuid + intersection);
							broadcast(req.params.uuid, {
								"workshopbullseye.update": intersection
							})
							res.sendStatus(200);
						});
					}
				});
			}
		});
	});
	api.post("/workshop/comments", (req, res) => {
		let createDate = new Date().getTime();
		let {person,bullseyeId,scoreId,comment,uuid} = req.body;

		let params = {
            person:person,
            bullseyeId:bullseyeId,
            comment: comment,
            scoreId:scoreId,
            uuid: uuid,
            createDate: createDate
        }
		//  let query = `MATCH (u:Person{uuid: {person}}), (n:Intersection{uuid: {scoreId}})
		//              CREATE (u)-[e:bullseye_comment {uuid: {uuid}, comment: {comment}, created_at: {createDate}}]->(n)
		// 						 WITH (n)
		// 						 MATCH (n)-[c:bullseye_comment]-()
		// 						 OPTIONAL MATCH (p:Person{uuid: {person}})
		// 						 OPTIONAL MATCH (stgy: Strategy)-[:intersection_strategy]-(it: Intersection{uuid:{uuid: {scoreId}})-[:intersection_audience]-(aud: Audience)
		// 		OPTIONAL MATCH (stgy)-[:strategytype_strategy]-(st:StrategyType)
		// 		OPTIONAL MATCH (aud)-[:segment_audiences]-(seg: Segment)
		// 		OPTIONAL MATCH (it)-[allv:vote]-(allp:Person)
		// 		OPTIONAL MATCH (it)-[uv:vote]-(p:Person {uuid: {person}})
        //          RETURN  it.uuid AS ituuid, seg.uuid AS seguuid, aud.uuid AS auduuid,st.uuid AS stuuid, c.uuid as uuid, count(c) as comment_count,p `;

		let query = `MATCH (u:Person{uuid: {person}}), (n:Intersection{uuid:{scoreId}})
CREATE (u)-[e:bullseye_comment {uuid:{uuid}, comment:{comment}, created_at:{createDate}}]->(n)
WITH (n)
MATCH (n)-[c:bullseye_comment]-()
OPTIONAL MATCH (p:Person{uuid:{person}})
OPTIONAL MATCH (stgy: Strategy)-[:intersection_strategy]-(it: Intersection{uuid:{scoreId}})-[:intersection_audience]-(aud: Audience)
OPTIONAL MATCH (stgy)-[:strategytype_strategy]-(st:StrategyType)
OPTIONAL MATCH (aud)-[:segment_audiences]-(seg: Segment)
OPTIONAL MATCH (it)-[allv:vote]-(allp:Person)
OPTIONAL MATCH (it)-[uv:vote]-(p:Person {uuid: {person}})
RETURN  it.uuid AS ituuid, seg.uuid AS seguuid, aud.uuid AS auduuid,st.uuid AS stuuid, c.uuid as uuid, count(c) as comment_count,p`


		db.cypher({ query: query, params: params }, (err, results)=> {
            if (err) res.status(400).send(err);
			console.log(comment);
			let commentRes = {
				person:person,
				bullseyeId:bullseyeId,
				comment: comment || null,
				scoreId:scoreId,
				uuid: uuid,
				createDate: createDate,
				audienceId:results[0].auduuid,
				segmentId:results[0].seguuid,
				statergyId:results[0].stuuid,
				persondetails:results[0].p.properties.firstname
        	}
				broadcast(req.headers.bullseye, {
					"add.comment": commentRes
				})

			res.send(commentRes);
        });



		// res.send(req.body);
	});
    api.delete('/workshop/intersection/:intersection_uuid/comments/:comment_uuid', (req, res) => {
        let query = `
			MATCH (n:Intersection{uuid:'${req.params.intersection_uuid}'})<-[c:bullseye_comment{uuid:'${req.params.comment_uuid}'}]-(p:Person)
			DETACH DELETE c
			WITH (n)
			MATCH (n)-[c:comment]-()
			RETURN count(c) as comment_count
		`;
        db.cypher({ query: query }, (err, results) => {
            if (err) {
                res.sendStatus(400)
            } else {

                    let obj = {
                        author: req.user,
                        note: req.params.note_uuid,
                        comment: req.params.comment_uuid,
                        count: results[0].comment_count

					}

					broadcast(req.headers.bullseye, {
                            "delete.comment": obj
                        })

                res.send(true);
            }
        })
    })
	//Library View Shared logic
	function FullfillLibraryView(SubGraph, query) {
		return new Promise(function (resolve, reject) {
			db.cypher({
				query: query
			}, function (err, results) {
				if (err || !results || results.length == 0 || results[0] == null) {
					reject(err || { message: "No Bullseye" });
				} else {
					results.map((result) => { GraphJS.MergeNode(result.n, SubGraph) });
					let Expand = ExpandLibraryCard(SubGraph, SubGraph.node_label_index.Bullseye);
					Expand.then(() => resolve(SubGraph));
					Expand.catch((err) => reject(err));
				}
			});

		})
	}

	function ExpandLibraryCard(SubGraph, bullseye_uuid_array) {
		return new Promise(function (resolve, reject) {
			let Outgoing = GraphAPI.GetOutgoingRels(bullseye_uuid_array, SubGraph, 'workshop_attendee|author', db);
			Outgoing.then(() => resolve());
			Outgoing.catch(() => reject());
		})
	}

	return api;
}
