import { Router } from 'express';
const { parseAsync } = require('json2csv');
const moment = require('moment')
const uuidv1 = require('uuid/v1');

//api.use('/node', nodes({config, db}));
export default ({ config, db, broadcast }) => {
	let api = Router();

	api.get('/all', (req, res) => {
		db.cypher({
			query: `
        MATCH (t:Template)
        MATCH (s:Stage) WHERE s.uuid in t.stages
        MATCH (p:Persona) WHERE p.uuid in t.personas
        MATCH (i:Interaction) WHERE i.uuid in t.noteTypes

        WITH t,
        collect(distinct properties(s)) as stages,
        collect(distinct properties(p)) as personas,
        collect(distinct properties(i)) as noteTypes

				OPTIONAL MATCH (a:Person{uuid: t.author})

        RETURN collect(distinct t {
          .*,
          author: a {
            .firstname,
            .lastname,
            .email,
            .uuid
          },
          stages: stages,
          personas: personas,
          noteTypes: noteTypes
        }) as templates
      `,
		}, (err, results) => {
			if(err) {
        console.error(err)
				res.sendStatus(400);
			}
			else {
        console.log(results[0].templates[0])
				res.status(200).send(results[0].templates)
			}
		})
	})

  api.post('/', (req, res) => {
		db.cypher({
			query: `
        CREATE (t:Template{uuid: randomUUID()})
        SET t.created = timestamp()
        SET t += $template

        RETURN properties(t)
      `,
      params: {
        template: req.body.template,
      }
		}, (err, results) => {
			console.log(err)
			if(err) {
				res.sendStatus(500);
			}
			else {
				res.status(200).send(results)
			}
		})
	})

  api.post('/createWorkshop', (req, res) => {
		let journeyUuid = uuidv1()
    db.cypher({
			queries: [
				{
					query: `
		        MATCH (t:Template{uuid: $templateUuid})
		        CREATE (j:Journey{uuid: $journeyUuid})
		        SET j.workshop_type = t.type
		        SET j.title = $workshopName
						SET j.description = $workshopName
		        SET j.vote_limit_per_stage = t.voteLimit
		        SET j.created_at = timestamp()
		        SET j.updated_at = timestamp()
		        SET j.last_active_at = {dateLastUpdate}

		        WITH t, j

		        MATCH (a:Person{uuid: $journeyAuthor})
		        MERGE (j)-[ja:author]->(a)
		        ON CREATE SET ja.uuid = randomUUID()
					`,
					params: {
						templateUuid: req.body.templateUuid,
						workshopName: req.body.workshopName,
						dateLastUpdate: new Date().toJSON(),
						journeyUuid: journeyUuid,
						journeyAuthor: req.body.journeyAuthor
					}
				},
				{
					query: `
						MATCH (t:Template{uuid: $templateUuid})
						MATCH (j:Journey{uuid: $journeyUuid})
						MATCH (s:Stage) WHERE s.uuid in t.stages
						CREATE (j)-[js:journey_stages{uuid: randomUUID()}]->(s)
						SET js.created_at = timestamp()
						SET js.order = $orders[s.uuid]
						SET js += $stageRelProps[s.uuid]
					`,
					params: {
						templateUuid: req.body.templateUuid,
						journeyUuid: journeyUuid,
						orders: req.body.orders,
						stageRelProps: req.body.stageRelProps
					}
				},
				{
					query: `
						MATCH (t:Template{uuid: $templateUuid})
						MATCH (j:Journey{uuid: $journeyUuid})
						MATCH (p:Persona) WHERE p.uuid in t.personas
						CREATE (j)-[jp:journey_persona{uuid: randomUUID()}]->(p)
						SET jp.created_at = timestamp()
						SET jp.order = $orders[p.uuid]
					`,
					params: {
						templateUuid: req.body.templateUuid,
						journeyUuid: journeyUuid,
						orders: req.body.orders,
						stageRelProps: req.body.stageRelProps
					}
				},
				{
					query: `
						MATCH (t:Template{uuid: $templateUuid})
						MATCH (j:Journey{uuid: $journeyUuid})
						MATCH (i:Interaction) WHERE i.uuid in t.noteTypes
						CREATE (j)-[ji:journey_interactions{uuid: randomUUID()}]->(i)
						SET ji.created_at = timestamp()
						SET ji.order = $orders[i.uuid]
					`,
					params: {
						templateUuid: req.body.templateUuid,
						journeyUuid: journeyUuid,
						orders: req.body.orders,
						stageRelProps: req.body.stageRelProps
					}
				}
			]
		}, (err, results) => {
			if(err) {
				console.log(err)
				res.sendStatus(500);
			}
			else {
				res.status(200).send(results)
			}
		})
  })

  api.delete('/:uuid', (req, res) => {
    db.cypher({
			query: `
        MATCH (t:Template{uuid: $uuid})
        DELETE t
      `,
      params: {
        uuid: req.params.uuid,
      }
		}, (err, results) => {
			if(err) {
				res.sendStatus(500);
			}
			else {
				res.sendStatus(200)
			}
		})
  })

	return api;
}
