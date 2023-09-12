import { Router } from 'express';
const { parseAsync } = require('json2csv');
const moment = require('moment')

//api.use('/node', nodes({config, db}));
export default ({ config, db, broadcast }) => {
	let api = Router();

	api.get('/csv/:journeyUuid', (req, res) => {
		let query;

		if(req.query.template) {
			query = `
				MATCH (j:Journey{uuid: $journeyUuid})
				MATCH (p:Persona)<-[:journey_persona]-(j)-[:journey_stages]->(s:Stage)
				MATCH (j)-[:journey_interactions]->(i:Interaction)
				return s.title as Stage,
						 p.title as Persona,
						 i.title as NoteType
			`
		}
		else {
			query = `
				match (j:Journey{uuid: $journeyUuid})
				MATCH (p:Persona)<-[:journey_persona]-(j)-[jir:journey_interactions]->(i:Interaction)
				MATCH (j)-[jsr:journey_stages]->(s:Stage)<-[:note_stage]-(n:Note)-[:note_journey]->(j)
				MATCH (i)<-[:note_interaction]-(n)-[:note_persona]->(p)
				MATCH (n)-[:note_author]->(author:Person)
				optional match (n)<-[vi:vote]-(:Person) where vi.count > 0
				optional match (n)<-[vp:pain]-(:Person) where vp.count > 0
				optional match (commentor:Person)-[c:comment]->(n)
				with s.title as Stage,
						 p.title as Persona,
						 i.title as NoteType,
						 n.description AS Note,
						 author.email as NoteAuthor,
						 collect(distinct vi) as VotesImportant,
						 collect(distinct vp) as VotesPainful,
						 collect(distinct c { author: commentor.email, .comment, created: c.created_at }) as Comments

	       return Stage, Persona, NoteType, Note, NoteAuthor,
				 				reduce(s = 0, x IN VotesImportant | s + x.count) AS VotesImportant,
								reduce(s = 0, x IN VotesPainful | s + x.count) AS VotesPainful,
								Comments
			`
		}
		db.cypher({
			query,
			params: {
				journeyUuid: req.params.journeyUuid
			}
		}, (err, results) => {
			console.log(err)
			if(err) {
				res.sendStatus(400);
			}
			else {
				if(req.query.template) {
					parseAsync(results, {
						fields: ['Stage', 'Persona', 'NoteType', 'Note', 'Comments']
					})
					.then( csv => {
						res.setHeader('Content-disposition', `attachment; filename=${req.params.journeyUuid}_template.csv`);
						res.set('Content-Type', 'text/csv');
						res.status( 200 ).send( csv );
					})
					.catch( error => res.sendStatus(400));
				}
				else {
					results.map(result => {
						result.Comments.map(comment => {
							comment.created = moment(comment.created).format('lll')
						})
						result.Comments = JSON.stringify(result.Comments).replace(/},/g, '}|')
					})
					parseAsync(results, {
						fields: ['Stage', 'Persona', 'NoteType', 'Note', 'NoteAuthor', 'VotesImportant', 'VotesPainful', 'Comments']
					})
					.then( csv => {
						res.setHeader('Content-disposition', `attachment; filename=${req.params.journeyUuid}.csv`);
						res.set('Content-Type', 'text/csv');
						res.status( 200 ).send( csv );
					})
					.catch( error => res.sendStatus(400));
				}
			}
		})
	})


	api.get('/voting/:journey/:person', (req, res) => {
    db.cypher({
      query: `
        match (j:Journey{uuid: $journeyUuid})-->(s:Stage)
        match (i:Interaction)<-[ir:journey_interactions]-(j)-->(p:Persona)
        match (j)<--(n:Note)-->(s)
        match (i)<--(n)-->(p)
        match (voter:Person{uuid: $personUuid})-[votes:vote|pain]->(n) WHERE votes.count > 0

        with s, i, ir, p, {
          type: type(votes),
        	count: sum(votes.count)
        } as voting

        with s, i, ir, p {
        	.title,
					.uuid,
          votes: collect(distinct voting)
        } as personas

				with s, i {
					.title,
					.uuid,
					.color,
					order: ir.order,
					total: {
						vote: 0,
						pain: 0
					},
					personas: collect(distinct personas)
				} as interactions

				return s {
					.title,
					.uuid,
					interactions: collect(distinct interactions)
				}
      `,
      params: {
        journeyUuid: req.params.journey,
				personUuid: req.params.person
      }
    },
    (err, results) => {
      if(err) {
        console.log(err)

        res.status(500).send({ message: 'error' })
      }
      else {
				let stages = {}

				results.forEach(result => {
					stages[result.s.uuid] = result.s
        })

				for(let stage in stages) {
					stages[stage].interactions.forEach(interaction => {
						interaction.personas.forEach(persona => {
							persona.votes.forEach(vote => {
								interaction.total[vote.type] += vote.count
							})
						})
					})
				}
        res.status(200).send(stages)
      }
    })
  })

	// api.get('/vote_table/:journey/:person', (req, res) => {
	//   db.cypher({
	//     query: `
	// 			MATCH (j:Journey{uuid: '${req.params.journey}'})
	// 			MATCH (u:Person{uuid: '${req.params.person}'})
	// 			MATCH (j)-->(p:Persona)
	// 			MATCH (p)<--(n:Note)-->(i:Interaction)
	// 			MATCH (n)<-[votes:vote|pain]-(u) WHERE votes.count > 0
	// 			WITH p, i {
	// 			  .*,
	// 			  votes: {
	// 			    type: type(votes),
	// 			    count: sum(votes.count)
	// 			  }
	// 			} as interactions
	//
	// 			RETURN p {
	// 			  .*,
	// 			  interactions: collect(interactions)
	// 			} as persona
	// 		`
	//   }, (err, result) => {
	// 		console.log(err)
	//     if(err) {
	//       res.status(400).send(err)
	//     }
	//     else {
	// 			res.status(200).json(result.map(r => r.persona))
	//     }
	//   })
	// })


	api.get('/leaderboard/:uuid', (req, res) => {
	  const person = `(p:Person) WHERE NOT p.email IN
	    [
	      'sage.drllevich@indigoslate.com',
	      'sasha@ruptive.cx',
	      'msftadmin@ruptive.cx',
	      'zechariah.kress@indigoslate.com'
	    ]`

	  db.cypher({
	    queries: [
	      `
	      MATCH (j:Journey{uuid:'${req.params.uuid}'})<-[:note_journey]-(n:Note)
	      MATCH (n)<-[c:comment]-${person}
	      WITH distinct(p {
	        .name,
					.firstname,
	        .email,
	        .uuid,
	        .image_url,
	        count: count(c)
	      }) AS person
	      ORDER BY person.count desc
				LIMIT 5

	      RETURN {
	        order: 0,
	        title: 'Top Commenters',
	        count_label: 'Comments: ',
	        contributors: collect(person)
	      } as leaderboard
	      `,
	      `
	      MATCH (j:Journey{uuid:'${req.params.uuid}'})<-[:note_journey]-(n:Note)
				MATCH (n)<-[v:vote|pain]-${person}
	      WITH p {
	        .name,
					.firstname,
	        .email,
	        .uuid,
	        .image_url,
	        count: sum(v.count)
	      } AS person
	      ORDER BY person.count desc
				LIMIT 5

	      RETURN {
	        order: 1,
					title: 'Top Voters',
	        count_label: 'Votes: ',
	        contributors: collect(person)
	      } as leaderboard
	      `,
	      `
	      MATCH (j:Journey{uuid:'${req.params.uuid}'})<-[:note_journey]-(n:Note)
	      MATCH (n)-[a:note_author]->${person}
	      WITH p {
	        .name,
					.firstname,
	        .email,
	        .uuid,
	        .image_url,
	        count: count(n)
	      } AS person
	      ORDER BY person.count desc
				LIMIT 5

	      RETURN {
	        order: 2,
					title: 'Top Creators',
	        count_label: 'Created: ',
	        contributors: collect(person)
	      } as leaderboard
	      `,
	    ]
	  }, (err, result) => {
			console.log(err)
	    if(err) {
	      res.status(400).send(err)
	    }
	    else {
	      let results = []

	      result.map( array => results.push( array[0].leaderboard ));

				// broadcast(req.params.uuid, {
				// 	"workshop.stats": results
				// });

				return res.status(200).json(results)
	    }
	  })
	})

	api.get('/:uuid', (req, res) => {
		const person = "(p:Person) WHERE NOT p.email IN {blacklist}"
		db.cypher({
			query: `
				MATCH (j:Journey{uuid: {uuid}})
				MATCH (j)-[:node_activity]->(a:Activity)-[:activity_element]->(e:Element)-[:element_person]->${person}

				WITH j, {
					total: count(p),
					unique: count(distinct p)
				} as visits

				MATCH (j)<-[:note_journey]-(n:Note)-[na:note_author]->${person}

				WITH visits, j, {
				total: count(na),
				unique: count(distinct p)
				} as notes

				MATCH (j)<-[:note_journey]-(n:Note)<-[c:comment]-${person}
				WITH notes, visits, j, {
				total: count(c),
				unique: count(distinct p)
				} as comments

				MATCH (j)<-[:note_journey]-(n:Note)<-[v:vote|pain]-${person}
				WITH comments, notes, visits, j, {
				total: count(v),
				unique: count(distinct p)
				} as votes

				return visits, notes, comments, votes
				`,
			params: {
				uuid: req.params.uuid,
				blacklist: [
					'sage.drllevich@indigoslate.com',
					'ricky.brown@indigoslate.com',
					'sasha@ruptive.cx',
					'msftadmin@ruptive.cx',
					'zechariah.kress@indigoslate.com'
				]
			}
		}, function(err, results){
			if(err) {
				console.error(err)
				res.status(400).send(err)
			}
			else {
				results[0].date_checked = new Date();
				res.status(200).json(results[0])
			}
		})
	})

	return api;
}
