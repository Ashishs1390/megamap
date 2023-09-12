import { Router } from 'express';
var _ = require('lodash');
import GraphJS from '../lib/graph';
import GraphAPI from '../lib/db_api'
import Validators from '../lib/validators';
var uuidv1 = require('uuid/v1');


//api.use('/node', nodes({config, db}));
export default ({ config, db, broadcast }) => {
	let api = Router();


  api.post('/screenshot', (req, res) => {
    console.log(req.body)
    // res.header('Content-Disposition')
    res.send(req.body.image)
  })

	api.get('/connections/:journey_uuid', (req, res) => {
		let queries = [
			`
				match (j:Journey{uuid: '${req.params.journey_uuid}'})
				match (s:Stage)<--(j)-->(p:Persona)
				match (n:Note) WHERE NOT EXISTS(n.connection)
			  match (p)<--(n)-->(j)-->(i:Interaction)
			  match (i)<--(n)-->(s)

			  return j {
			    .*,
			    stages: collect(distinct properties(s)),
			    types: collect(distinct properties(i)),
			    personas: collect(distinct properties(p)),
			    notes: collect(distinct n {
			      .*,
			      rels: {
			        stage: s.uuid,
			        persona: p.uuid,
			        type: i.uuid
			      }
			    })
			  }
			`,
			`
				match (j:Journey{uuid: '${req.params.journey_uuid}'})
				match (j)<--(n:Note)-[:component_connection]->(c)

				with c, collect(distinct properties(n)) as notes

				return collect(distinct c {
					connection: c.uuid,
					properties: properties(c),
          notes: notes
				}) as note_connections
			`,
			`
				match (j:Journey{uuid: '${req.params.journey_uuid}'})
				match (j)-[:component_connector]->(c)
				with c
				order by c.component_type, c.description
				return collect(properties(c)) as connections
			`
		]
		db.cypher({
			queries: queries
		},
		( err, result ) => {
			console.log(err,result)
			res.status( 200 ).send( result.reduce(( a, v ) => a.concat( v ), [] ))
		})
	})

	//Returns a Journey Centered SubGraph, filtered to only Direct Workshop Components
	api.get('/journey/:uuid', (req, res) => {
		// req.params.uuid = '5ba1edd0-f4bb-11e7-a839-69578041f8a7';
		let stages = [];
		let interactions = [];
		let nRels = 'r:note_attribute|note_author|note_interaction|note_profile|note_stage';
		db.cypher({
			query: `MATCH (j:Journey{uuid:'${req.params.uuid}'})-[:journey_interactions]-(i) MATCH (j:Journey{uuid:'${req.params.uuid}'})-[:journey_persona]-(p) return j, collect(distinct p) as p, collect(distinct i) as i` //, SIZE( (n)-[:vote]-() ) as votes_count, SIZE( (n)-[:pain]-() ) as pains_count`
		}, function(err, resultsA){
			if(err) {
				console.log(err);
				res.status(400).send(err);
			}
			let journeyReport = resultsA[0].j.properties;
			journeyReport.Persona = resultsA[0].p[0].properties
			journeyReport.Interactions = resultsA[0].i.map(function(i){
				return i.properties;
			})

			// res.status(200).send(journeyReport)

			db.cypher({
				query: `
					MATCH (j:Journey{uuid:'${req.params.uuid}'})<-[:note_journey]-(n:Note)-[${nRels}]-(f)
					MATCH (n)-[v:vote]-() MATCH (n)-[p:pain]-()  with j, [n, collect(f), {votes: size(collect(distinct v))}, {pains: size(collect(distinct p))}] as relative

					MATCH (n)<-[c:comment]-(p:Person)
				  WITH collect(c.comment) as array
				  WITH trim(REDUCE(output = "", comment IN array | output + comment + " ")) AS comments;
					WITH collect(relative) as relatives
					RETURN relatives, comments
				` //, SIZE( (n)-[:vote]-() ) as votes_count, SIZE( (n)-[:pain]-() ) as pains_count`
			}, function(err, resultsB){
				if(err) {
					console.log(err);
					res.status(400).send(err);
				}
				console.log('=== HEY MAN ===')
				console.log(resultsB)
				journeyReport.notes = resultsB[0].relatives.map(function(result){
					result[0].properties.votes = result[2].votes;
					result[0].properties.pains = result[3].pains;
					result[1].forEach(function(rel){
						let stringObject = JSON.stringify(rel.properties)
						if(rel.labels[0] == 'Stage' && stages.indexOf(stringObject) < 0){
							stages.push(stringObject)
						}
						if(rel.labels[0] == 'Interaction' && interactions.indexOf(stringObject) < 0){
							interactions.push(stringObject)
						}
						// if(rel.labels[0] == 'Interaction'){
						// 	console.log(rel.properties.description)
						// 	let key = rel.properties.description.replace(' ', '_')
						// 	if(interactions.hasOwnProperty(key)){
						// 		interactions[key] += 1
						// 	} else {
						// 		interactions[key] = 0
						// 	}
						// }

						result[0].properties[rel.labels[0]] = rel.properties
					})
					delete result[0].properties.Person.password;
					return result[0].properties
				})
				stages = stages.map(function(stage){ return JSON.parse(stage) })
				interactions = interactions.map(function(interaction){ return JSON.parse(interaction) })
				journeyReport.stages = stages;
				journeyReport.interactions = interactions;
				// journeyReport.comments = journeyReport

				res.status(200).send(journeyReport)
			})
		})
	});


	let JourneyWorkshopComponents =
		[{
			"label": "Product",
			"type": "journey_product"
		}, {
			"label": "Persona",
			"type": "journey_persona"
		}, {
			"label": "Strategy",
			"type": "journey_strategy"
		}, {
			"label": "Stage",
			"type": "journey_stages"
		}, {
			"label": "Interaction",
			"type": "journey_interactions"
		}, {
			"label": "Audience",
			"type": "journey_audiences"
		}, {
			"label": "Person",
			"type": "journey_attendee"
		}, {
			"label": "Person",
			"type": "facilitator"
		}, {
			"label": "Capability",
			"type": "journey_capability"
		}];
	let WorkshopNoteComponents = [{
		"label": "Interaction",
		"type": "note_interaction"
	}, {
		"label": "Stage",
		"type": "note_stage"
	}]
	return api;
}
