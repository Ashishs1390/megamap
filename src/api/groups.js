import { Router } from 'express';
const { parseAsync } = require('json2csv');
const moment = require('moment')
const uuidv1 = require('uuid/v1');

//api.use('/node', nodes({config, db}));
export default ({ config, db, broadcast }) => {
	let api = Router();

	api.get('/all/:label', (req, res) => {
		db.cypher({
			query: `
        MATCH (g:Group) WHERE $label in g.labels
        OPTIONAL MATCH (n) WHERE n.uuid in g.members

        WITH g,
        collect(distinct properties(n)) as members

        RETURN collect(distinct g {
          .*,
          members: members
        }) as groups
      `,
      params: {
        label: req.params.label,
      }
		}, (err, results) => {
			if(err) {
        console.error(err)
				res.sendStatus(400);
			}
			else {
				res.status(200).send(results[0].groups)
			}
		})
	})

	api.get('/:uuid', (req, res) => {
		db.cypher({
			query: `
        MATCH (g:Group) WHERE $uuid in g.members
        MATCH (n) WHERE n.uuid in g.members

        WITH g,
        collect(distinct properties(n)) as members

        RETURN collect(distinct g {
          .*,
          members: members
        }) as groups
      `,
      params: {
        uuid: req.params.uuid,
      }
		}, (err, results) => {
			if(err) {
        console.error(err)
				res.sendStatus(400);
			}
			else {
				res.status(200).send(results[0].groups)
			}
		})
	})

	api.get('/members/:uuid', (req, res) => {
		db.cypher({
			query: `
				MATCH (g:Group{uuid: $uuid})
				MATCH (n) WHERE n.uuid IN g.members

				RETURN collect({
					labels: labels(n),
					properties: properties(n)
				}) as members,
				collect(distinct labels(n)) as labels
			`,
			params: {
				uuid: req.params.uuid,
			}
		}, (err, results) => {
			if(err) {
				console.error(err)
				res.sendStatus(400);
			}
			else {
				res.status(200).send({
					labels: results[0].labels.reduce(( a, v ) => a.concat( v ), []),
					nodes:  results[0].members
				})
			}
		})
	})

  api.post('/', (req, res) => {
		db.cypher({
			query: `
        CREATE (g:Group{uuid: randomUUID()})
        SET g.created = timestamp()
        SET g += $group

        RETURN properties(g) as group
      `,
      params: {
        group: req.body.group
      }
		}, (err, results) => {
			console.log(err)
			if(err) {
				res.sendStatus(500);
			}
			else {
				res.status(200).send(results[0].group)
			}
		})
	})

  api.delete('/:uuid', (req, res) => {
    db.cypher({
			query: `
        MATCH (g:Group{uuid: $uuid})
        DELETE g
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
