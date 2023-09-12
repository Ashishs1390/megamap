import { Router } from 'express';
var _ = require('lodash');
import GraphJS from '../lib/graph';
import GraphAPI from '../lib/db_api'
import Validators from '../lib/validators';
var uuidv1 = require('uuid/v1');
var auth = require('../lib/auth');
var mailInvite = require('../lib/mail');
var bcrypt = require('bcryptjs');
var vars = require('../config/vars');
var Sentiment = require('../util/journey/sentiment.json');

//api.use('/node', nodes({config, db}));
export default ({ config, db, broadcast }) => {
    let api = Router();
    api.get('/count', (req, res) => {
        let finalQueryCount = '';
        const filteredCount = `MATCH (j:Journey)-[:author|journey_attendee|journey_external_attendee|facilitator]-(p:Person{uuid:'${req.user.uuid}'}) WHERE (j.workshop_type = "${req.query.journeyType}" OR NOT EXISTS(j.workshop_type)) AND j.title =~ '(?i).*${req.query.searchTerm}.*' OR j.description =~ '(?i).*${req.query.searchTerm}.*' return count(DISTINCT j) as count`
        const allCount = `
			MATCH(p:Person{uuid:'${req.user.uuid}'})-[:author|journey_attendee|journey_external_attendee|facilitator]-(j:Journey) with collect(j) as jour unwind(jour) as j
                match(j)-[:author]-(p:Person) WHERE  p.firstname =~ '(?i).*${req.query.searchTerm}.*' OR j.title =~ '(?i).*${req.query.searchTerm}.*' OR j.description =~ '(?i).*${req.query.searchTerm}.*' return count(DISTINCT j) as count
				`;
        if (req.query.journeyType == "alldata") {
            finalQueryCount = allCount;
        } else {
            finalQueryCount = filteredCount;
        }
      console.log(finalQueryCount);
        db.cypher({
            query: finalQueryCount
        }, function(err, results) {
            res.send(...results)
        }, (err, results) => {
          console.log(results,'-----------')
          console.log(err, '-----------')
              res.status(400).send({ message: 'unable to query journeys' })
        })
    });

    api.get('/all', (req, res) => {
        const journeyNode = () => {
          return (req.query.journeyType === 'alldata' ? 'Journey' : `Journey{workshop_type:'${req.query.journeyType}'}`)
        }

        // MATCH (g:Group) WHERE 'Journey' in g.labels
        // MATCH (j) WHERE NOT j.uuid in g.members

        const query = `
  				MATCH (p:Person{uuid: $userUuid})-[:author|journey_attendee|journey_external_attendee|facilitator]-(j:${journeyNode()})


          WITH collect(j) as jour unwind(jour) as j
          MATCH (j)-[:author]-(p:Person) WHERE p.firstname =~ '(?i).*${req.query.searchTerm}.*' OR j.title =~ '(?i).*${req.query.searchTerm}.*' OR j.description =~ '(?i).*${req.query.searchTerm}.*'
          MATCH (j)-[:author]->(author:Person)
          OPTIONAL MATCH (g:Group) WHERE 'Journey' in g.labels AND j.uuid in g.members
  				OPTIONAL MATCH (j)-[:journey_interactions]->(i:Interaction)
          OPTIONAL MATCH (i:Interaction)<-[:note_interaction]-(n:Note)
  				WITH j, g, author, i {
  					.*,
  					effectiveness: avg(toFloat(n.average_effectiveness)),
  					importance: avg(toFloat(n.average_importance))
  				} as interactions
  				RETURN DISTINCT j {
  					.*,
  					interactions: collect(distinct interactions),
            notes: size((j)-[:note_journey]-()),
            attendees: size((j)-[:journey_attendee]-()),
            external_attendees: size((j)-[:journey_external_attendee]-()),
            author: author { .firstname, .lastname, .email, .tenant, .admin, .image_url, .uuid },
            group: properties(g)
  				}

  				ORDER BY j.last_active_at DESC SKIP $skip LIMIT $limit
				`
        db.cypher({
          query: query,
          params: {
            userUuid: req.user.uuid,
            searchTerm: req.query.searchTerm,
            skip: parseInt(req.query.skip),
            limit: parseInt(req.query.limit)
          }
        }, (err, results) => {
          if (err) {
            console.log(err)
            res.status(400).send({ message: 'unable to query journeys' })
          }
          else {
            res.status(200).send(results.map(node => node.j))
          }
        })
    })

    api.post('/filtered', (req, res) => {
        let filtered;
        if (config.sysadmins.includes(req.user.email)) {
            filtered = (req.body.uuids[0] === 'all' ? '' : 'WHERE j.uuid IN {uuid_array}')
        } else {
            filtered = 'WHERE j.uuid IN {uuid_array}'
        }
        db.cypher({
            query: `
				MATCH (j:Journey)-[:author]-(author:Person)
				${filtered}
				OPTIONAL MATCH (j)-[:journey_interactions]->(i:Interaction)<-[:note_interaction]-(n:Note)
				with j, author, i {
					.*,
					effectiveness: avg(toFloat(n.average_effectiveness)),
					importance: avg(toFloat(n.average_importance))
				} as interactions
				RETURN DISTINCT j {
					.*,
					scores: collect(distinct interactions)
				},
				SIZE((j)-[:note_journey]-()) as notes, SIZE((j)-[:journey_attendee]-()) as attendees, properties(author) as author
				`,
            params: {
                uuid_array: req.body.uuids
            }

        }, function(err, results) {
            if (err) res.status(400).send(err)
            let journeys = results.map(function(node) {
                node.j.notes = node.notes;
                node.j.attendees = node.attendees;
                delete node.author.password;
                node.j.author = node.author;
                return node.j;
            })
            res.status(200).send(journeys)
        })
    })

    api.post('/activity', (req, res) => {
        let params = {
            uuid: req.body.uuid,
            date: req.body.date
        }
        let query = "MATCH (n:Journey{uuid:{uuid}}) SET n.last_active_at = {date}"
        if (typeof (req.body.view_count) === 'number') {
            params.view_count = (req.body.view_count + 1);
            query += " SET n.view_count = {view_count}"
        }
        db.cypher({
            query: query, params: {
                uuid: req.body.uuid,
                date: req.body.date,
                view_count: (req.body.view_count + 1)
            }
        }, (err, results) => {
            if (err) {
                res.sendStatus(400);
            } else {
                res.status(200).send('activity logged')
            }
        })
    })

    api.get('/kpis/:journey_uuid', (req, res) => {
        db.cypher({
            query: `
				MATCH (j:Journey{uuid:'${req.params.journey_uuid}'})-[r:journey_kpis]->(k:Kpi)
				RETURN k {
					.*,
					rel: properties(r)
				} as kpi
			`
        }, (err, results) => {
            if (err) {
                res.status(400).send(err)
            } else {
                results = results.map(result => {
                    return result.kpi;
                })
                res.status(200).send(results)
            }
        })
    })

    api.get('/interaction_scores/:journey_uuid', (req, res) => {
        db.cypher({
            query: `
				MATCH (j:Journey{uuid:{uuid}})-[:journey_interactions]->(i:Interaction)
				MATCH (n:Note)-[:note_interaction]->(i)
				return i {
					.*,
					effectiveness: avg(toFloat(n.average_effectiveness)),
					importance: avg(toFloat(n.average_importance))
				}
			`,
			params: {
				uuid: req.params.journey_uuid
			}
		}, (err, results) => {
			if(err) {
				res.sendStatus(400);
			} else {
				results = results.map(result => {
					return result.i;
				})
				res.status(200).send(results)
			}
		})
	})

	api.post('/invite', (req, res) => {
    if(req.body && req.body.emails) {
      mailInvite({
				email: req.body.emails,
				inviter: req.user,
				inviteNode: req.body.inviteTo,
				subdomain: req.body.subdomain,
        origin: req.body.origin,
				journey: req.body.journey
			}).then(() => {
        res.status(200).send('invited users')
      }).catch(err => {
        console.log('EMAIL ERROR', err)
        res.status(400).send('error emailing user invite')
      })
    }
    else if(req.body && req.body.email) {
      req.body.email = req.body.email.toLowerCase()

      let validateEmail = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

      if(validateEmail.test(req.body.email)) {
		    let email, uuid, query, salt, hash, params, mailParams;

  			params = {
  				email: req.body.email.toLowerCase(),
  				salt: bcrypt.genSaltSync(vars.bcrypt.salt),
  				hash: bcrypt.hashSync('password', salt),
  				uuid: uuidv1()
  			}
  			mailParams = {
  				email: (req.body.emails || [req.body.email]),
  				inviter: req.user,
  				inviteNode: req.body.inviteTo,
  				subdomain: req.body.subdomain,
          origin: req.body.origin,
  				journey: req.body.journey
  			}
  			// check if user exists
  			query = `MATCH (n:Person{email:{email}}) return n`;
  			db.cypher({ query: query, params: params }, (err, result) => {
  				if(err) res.status(400).send(err);

  				if(result && result.length === 0){
  					query = `CREATE (n:Person) SET n.uuid = {uuid} SET n.title={email} SET n.email={email} SET n.password={hash} return n`;
  					db.cypher({ query: query, params: params }, (err, result) => {
  						if(err) res.status(400).send(err);
  						// send email to new user
  						mailInvite(mailParams).then(data => {
  							res.status(200).send(result[0].n.properties)
  						}).catch(err => {
  							console.log('EMAIL ERROR', err)
  							res.status(400).send('error emailing user invite')
  						})
  					})
  				// still send email to existing user
  				} else if(result && result.length > 0){
  					mailInvite(mailParams).then(data => {
  						res.status(200).send(result[0].n.properties)
  					}).catch(err => {
  						console.log('EMAIL ERROR', err)
  						res.status(400).send('error emailing user invite')
  					})
  				}
  			})
  		} else {
  			res.status(400).send({ message: "invalid email address" });
  		}
    }
  })


  api.post('/notify', (req, res) => {
    // downcase email to ensure uniqueness
		req.body.email = req.body.email.toLowerCase();

		let validateEmail = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
		let email, uuid, query, salt, hash, params, mailParams;

		if(req.body && req.body.email && validateEmail.test(req.body.email)) {
			params = {
				email: req.body.email.toLowerCase(),
				salt: bcrypt.genSaltSync(vars.bcrypt.salt),
				hash: bcrypt.hashSync('password', salt),
				uuid: uuidv1()
			}
			mailParams = {
				email: [req.body.email],
				inviter: req.user,
				inviteNode: req.body.inviteTo,
				subdomain: req.body.subdomain,
        origin: req.body.origin,
        notify : true
			}

      mailInvite(mailParams).then(data => {

        res.status(200).send({'message':'successfuly sent a mail'})
      }).catch(err => {

        console.log('EMAIL ERROR', err)
        res.status(400).send('error emailing user invite')
      })

		} else {
			res.status(400).send({ message: "invalid email address" });
		}
	})

  api.get('/:journey/connections', (req, res) => {
    let query = `
      MATCH (j:Journey{uuid:{journey_uuid}})
      MATCH (j)-[cc:component_connector]->(component)
      MATCH (p:Person {uuid: cc.author})

      OPTIONAL MATCH (component)<-[:component_connection]-(cn:Note)

      RETURN component {
				.*,
        labels: labels(component),
				rels: {
					author: p { .email, .title, .firstname, .lastname, .image_url, .uuid },
          connected_note_count: count(distinct cn)
				}
			}
    `
    db.cypher({
      query: query,
      params: {
        journey_uuid: req.params.journey
      }
    },
    (err, results) => {
      if(err) {
        console.log(err)
        res.status(500).send(err)
      }
      else {
        res.status(200).send(results.map(result => result.component))
      }
    })
  })

  // api.post('/changePersona', (req, res) => {
  //   let query = `
  //     MATCH (j:Journey{uuid: $journeyUuid}), (fp:Persona{uuid: $fromPersona}, (tp:Persona{uuid: $toPersona}))
  //     MATCH (p:Persona)<-[:journey_persona]-(j)-[jir:journey_interactions]->(i:Interaction)
  //     MATCH (p)<-[np:note_persona]-(n:Note)-[:note_journey]->(j)
  //     DELETE np
  //     MERGE
  //   `,
  //
  // })

	api.get('/:journey/stage/:stage', (req, res) => {
    let query = '';

    console.log('is a group?', req.query.group)

    if(req.query.group) {
      query += `
        MATCH (g:Group{uuid: $journey_uuid})
        MATCH (j:Journey) WHERE j.uuid in g.members
      `
    }
    else {
      query += 'MATCH (j:Journey{uuid: $journey_uuid})'
    }

		query += `
      MATCH (s:Stage{uuid: $stage_uuid})
			MATCH (persona:Persona)<-[:journey_persona]-(j)-[jir:journey_interactions]->(i:Interaction)
			MATCH (j)-[jsr:journey_stages]->(s)<-[:note_stage]-(n:Note)-[:note_journey]->(j)
			MATCH (i)<-[:note_interaction]-(n)-[:note_persona]->(persona)
			WITH n AS note, j, i, s, persona
			MATCH (note)-[:note_author]->(p:Person)
			OPTIONAL MATCH (ca:Person)-[c:comment]->(note)
			OPTIONAL MATCH (note)-[kr:note_kpi]->(k:Kpi)
      OPTIONAL MATCH (:Mot{from_uuid: note.uuid})<-[motvalues:values]-(:Person)
      OPTIONAL MATCH (note)-[:mot_connection]->(mot:Mot)
			WITH note, note {
				.*,
        mot_score: round(avg(toFloat(motvalues.mot_score))),
        mot_node: properties(mot),
        mot_connection: collect(distinct mot.from_uuid),
				rels: {
          stage: properties(s),
					kpis: collect(distinct k {
						.*,
						rel: properties(kr)
					}),
					interaction: i { .* },
					persona: persona { .* },
          journey: j { .uuid, .title },
					votes_count: 0,
					pains_count: 0,
					author: p { .email, .title, .firstname, .lastname, .image_url, .uuid },
					comments_count: SIZE((note)-[:comment]-()),
					comments: collect(distinct c {
						.*,
						author: ca {
							.uuid,
							.firstname,
							.image_url,
              .email
						}
					}),
					commenters: collect(distinct ca.uuid)
				}
			} as note_with_rels

			OPTIONAL MATCH (voter:Person)-[votes:vote|pain]->(note)
      WITH note_with_rels, type(votes) as votes, sum(votes.count) as counts, collect(distinct voter.uuid) as voters
      WITH {
        type: votes,
        count: counts,
		    voters: voters
      } as votes_with_rels, note_with_rels

      return note_with_rels, collect(votes_with_rels) as voting`;
      // return note_with_rels, collect(votes_with_rels) as voting ${req.query.limit ? 'skip 0 limit 12' : ''}`;

      db.cypher({
        query: query,
        params: {
          stage_uuid: req.params.stage,
          journey_uuid: req.params.journey
        }
      }, (err, results) => {
        results = results.map(result => {
          if(result.note_with_rels.uuid === '21efbea0-c836-11e9-9e6c-cdeff96dc2de'){
            console.log('right here!!!!!!!')
            console.log(result.voting)
          }
          result.voting.forEach(vote => {
            if (vote && vote.type) {
              result.note_with_rels.rels[`${vote.type}s_count`] = vote.count;
              result.note_with_rels.rels[`user_${vote.type}`] = (vote.voters.indexOf(req.user.uuid) > -1 ? true : false);
            }
          })
          result.note_with_rels.rels.interaction.order = JSON.parse(req.query.interaction_orders)[result.note_with_rels.rels.interaction.uuid]
          result.note_with_rels.rels.commenter =
          (result.note_with_rels.rels.commenters.indexOf(req.user.uuid) > -1 ? true : false);

          Object.keys(result.note_with_rels).forEach((key) => {
            if (isJson(result.note_with_rels[key])) {
              result.note_with_rels[key] = JSON.parse(result.note_with_rels[key]);
            }
          })
          // if(result.note_with_rels.primary) result.note_with_rels.primary = JSON.parse(result.note_with_rels.primary)
          // if(result.note_with_rels.secondary) result.note_with_rels.secondary = JSON.parse(result.note_with_rels.secondary)
          return result.note_with_rels;
        })
        res.status(200).send(results)
      })
    })


    function isJson(str) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }


    api.get('/updatenotepersonas/:journey_uuid', (req, res) => {
        db.cypher({
            query: `MATCH (j:Journey{uuid:'${req.params.journey_uuid}'})-[:journey_persona]-(p:Persona)
			 WITH last(collect(distinct p.uuid)) as persona
			 RETURN persona`
        }, function(err, results) {
            let persona = results[0].persona;
            db.cypher({
                query: `MATCH (j:Journey{uuid:'${req.params.journey_uuid}'}), (p:Persona{uuid:'${persona}'})
					MATCH (j)-[]-(n:Note)
					MERGE (n)-[:note_persona{uuid : {persona_rel_uuid}}]->(p)
					RETURN n`,
                params: {
                    persona_rel_uuid: uuidv1()
                }
            }, function(err, results2) {
                res.send(results2)
            })
        })
    })

    api.post('/group/flatten', (req, res) => {
      let journeyUuid = uuidv1()

      db.cypher({
        queries: [
          {
            query: `
              MATCH (p:Person {uuid: $group.author.uuid })
              CREATE (j:Journey {
                workshop_type: 'journey',
                title: $group.title,
                description: $group.title,
                created_at: timestamp(),
                updated_at: timestamp(),
                last_active_at: timestamp(),
                uuid: $journeyUuid
              })-[:author{uuid: randomUUID()}]->(p)
              RETURN j.uuid AS journey_uuid
            `,
            params: { group: req.body.group, journeyUuid }
          },
          {
            query: `
              MATCH (j:Journey{uuid: $journeyUuid})
              UNWIND $group.stages as stage
              MATCH (s:Stage{uuid: stage.uuid})
              MERGE (j)-[:journey_stages{uuid: randomUUID(), created_at: timestamp(), order: stage.order}]->(s)
            `,
            params: { group: req.body.group, journeyUuid }
          },
          {
            query: `
              MATCH (j:Journey{uuid: $journeyUuid})
              UNWIND $group.personas as persona
              MATCH (p:Persona{uuid: persona.uuid})
              MERGE (j)-[:journey_persona{uuid: randomUUID(), created_at: timestamp(), order: persona.order}]->(p)
            `,
            params: { group: req.body.group, journeyUuid }
          },
          {
            query: `
              MATCH (j:Journey{uuid: $journeyUuid})
              UNWIND $group.interactions as interaction
              MATCH (i:Interaction{uuid: interaction.uuid})
              MERGE (j)-[:journey_interactions{uuid: randomUUID(), created_at: timestamp(), order: interaction.order}]->(i)
            `,
            params: { group: req.body.group, journeyUuid }
          },
          {
            query: `
              MATCH (g:Group{uuid: $group.uuid})
              MATCH (journey:Journey{uuid: $journeyUuid})
              MATCH (j:Journey) WHERE j.uuid IN g.members
              MATCH (n:Note)-[:note_journey]->(j)
              MATCH (n)-[:note_stage]->(s:Stage)
              MATCH (n)-[:note_persona]->(p:Persona)
              MATCH (n)-[:note_author]->(a:Person)
              MATCH (n)-[:note_interaction]->(i:Interaction)

              CREATE (new:Note)
              SET new += n
              MERGE (new)-[:note_stage{uuid: randomUUID()}]->(s)
              MERGE (new)-[:note_persona{uuid: randomUUID()}]->(p)
              MERGE (new)-[:note_interaction{uuid: randomUUID()}]->(i)
              MERGE (new)-[:note_author{uuid: randomUUID()}]->(a)
              MERGE (new)-[:note_journey{uuid: randomUUID()}]->(journey)


            `,
            params: { group: req.body.group, journeyUuid }
          }
        ]
      }, (error, results) => {
        if(error) {
          console.error(error)
          res.status(500).send(error)
        }
        else if(results) {
          console.log(results[0])
          res.status(200).send(results[0][0])
        }
      })
    })

    api.get('/group/:group_uuid', (req, res) => {
      db.cypher({
        query: `
          MATCH (g:Group{uuid: $groupUuid})
          MATCH (j:Journey) WHERE j.uuid IN g.members

          MATCH (j)-[:author|facilitator]->(admin:Person)
          OPTIONAL MATCH (author:Person{uuid: g.author})
          OPTIONAL MATCH (j)-[ji:journey_interactions]->(i:Interaction)
          OPTIONAL MATCH (j)-[jp:journey_persona]->(p:Persona)
          OPTIONAL MATCH (j)-[js:journey_stages]->(s:Stage)
          OPTIONAL MATCH (j)-[jk:journey_kpis]->(k:Kpi)

          WITH g, author, j {
           .*,
           admins: COALESCE(collect(distinct admin.uuid)),
           admin_objects: COALESCE(collect(distinct {
             name: admin.name,
             email: admin.email,
             uuid: admin.uuid
           })),
           interactions: COALESCE(collect(distinct i { .*, order: ji.order})),
           personas: COALESCE(collect(distinct p { .*, order: jp.order})),
           stages: COALESCE(collect(distinct s {
             .*,
             order: js.order,
             workshop_description: js.description,
             workshop_whiteboard: js.whiteboard,
             workshop_static_image_ref: js.static_image_ref,
             workshop_static_text: js.static_text,
             workshop_sentiment_score: js.sentiment_score
           })),
           kpis: COALESCE(collect(distinct k { .*, order: jk.order, rel: properties(jk) }))
          } as journey

          RETURN g {
            .*,
            title: g.name,
            author: COALESCE(author { .firstname, .lastname, .email, .uuid, .image_url }),
            journeys: collect(journey)
          } as group`,

        params: {
          groupUuid: req.params.group_uuid
        }
      },
      (err, results) => {
        if (err) {
          console.log(err)
          res.status(500).send(err)
        }
        else if (results) {
          let group = results[0].group;
          group.interaction_orders = {}
          group.persona_orders = {}
          group.kpi_orders = {}

          let journeys = group.journeys.map(journey => {
            Object.keys(journey).forEach(key => {
              if(Array.isArray(journey[key])) {
                if(!group[key]) {
                  group[key] = journey[key]
                }
                else {
                  let combined = [...group[key], ...journey[key]]
                  group[key] = [...new Map(combined.map(v => [v.uuid, v])).values()]
                }
              }
            })
            journey.interaction_orders = {}
            journey.persona_orders = {}
            journey.kpi_orders = {}
            journey.interactions.forEach(i => {
              journey.interaction_orders[i.uuid] = i.order;
              group.interaction_orders[i.uuid] = i.order;
            })
            journey.personas.forEach(p => {
              journey.persona_orders[p.uuid] = p.order;
              group.persona_orders[p.uuid] = p.order;
            })
            journey.kpis.forEach(k => {
              journey.kpi_orders[k.uuid] = k.order;
              group.kpi_orders[k.uuid] = k.order;
            })
            return journey
          })
          res.status(200).send(group)
        } else {
          res.status(404).send('journey not found')
        }
      })
    })

    api.get('/:journey_uuid', (req, res) => {
        db.cypher({
          query: `
            MATCH (j:Journey{uuid:'${req.params.journey_uuid}'})-[:author|facilitator]->(admin:Person)
            OPTIONAL MATCH (j)-[ji:journey_interactions]->(i:Interaction)
            OPTIONAL MATCH (j)-[jp:journey_persona]->(p:Persona)
            OPTIONAL MATCH (j)-[js:journey_stages]->(s:Stage)
            OPTIONAL MATCH (j)-[jk:journey_kpis]->(k:Kpi)

            WITH j {
             .*,
             admins: COALESCE(collect(distinct admin.uuid)),
             admin_objects: COALESCE(collect(distinct {
            	 name: admin.name,
            	 email: admin.email
             })),
             interactions: COALESCE(collect(distinct i { .*, order: ji.order})),
             personas: COALESCE(collect(distinct p { .*, order: jp.order})),
             stages: COALESCE(collect(distinct s {
            	 .*,
            	 order: js.order,
            	 workshop_description: js.description,
               workshop_whiteboard: js.whiteboard,
            	 workshop_static_image_ref: js.static_image_ref,
               workshop_static_text: js.static_text,
            	 workshop_sentiment_score: js.sentiment_score
             })),
             kpis: COALESCE(collect(distinct k { .*, order: jk.order, rel: properties(jk) }))
            } as journey
            RETURN journey`
        },
        (err, results) => {
          if (err) {
            res.status(500).send(err)
          }
          else if (results && results[0]) {
            let journey = results[0].journey;
            journey.interaction_orders = {}
            journey.persona_orders = {}
            journey.kpi_orders = {}
            journey.interactions.forEach(i => {
              journey.interaction_orders[i.uuid] = i.order;
            })
            journey.personas.forEach(p => {
              journey.persona_orders[p.uuid] = p.order;
            })
            journey.kpis.forEach(k => {
              journey.kpi_orders[k.uuid] = k.order;
            })
            res.status(200).send(journey)
          } else {
            res.status(404).send('journey not found')
          }
        })
    });

    api.get('/sentiment/:journey_uuid', (req, res) => {
        db.cypher({
            query: `
			 MATCH (j:Journey{uuid:'${req.params.journey_uuid}'})<-[:note_journey]-(n:Note)<-[c:comment]-(p:Person)
		   RETURN trim(REDUCE(output = "", comment IN collect(c.comment) | output + comment + " ")) AS text
			 `
        }, (err, results) => {
            if (results[0]) {

                const sentiment = {
                    text: results[0].text,
                    scores: {},
                    average: 0
                }

                let wordCount = 0;

                for (let word of sentiment.text.split(' ')) {
                    word = word.toUpperCase();

                    if (Sentiment[word]) {
                        if (sentiment.scores[word]) {
                            sentiment.scores[word] += Sentiment[word];
                        }
                        else {
                            sentiment.scores[word] = Sentiment[word];
                        }
                        sentiment.average += Sentiment[word]
                        wordCount += 1;
                    }
                }

                sentiment.average = Math.round(
                    (sentiment.average / wordCount) * 1
                ) / 1

                res.status(200).send(sentiment)
            } else {
                res.status(404).send('journey not found')
            }
        })
    })

    api.get('/graphs/:journey_uuid', (req, res) => {
        db.cypher({
            query: `MATCH (j:Journey{uuid:'${req.params.journey_uuid}'})<-[:note_journey]-(n:Note) return properties(n) as note`
        }, function(err, results) {
            results = results.map(node => {
                return node.note
            })
            res.status(200).send(results)
        })
    })


    api.put('/toggleVotes', (req, res) => {
        let params = {
            uuid: req.body.uuid,
            show_votes: req.body.show_votes
        }
        let query = `MATCH (j:Journey{uuid:{uuid}}) SET j.show_votes = {show_votes}`;

        db.cypher({ query: query, params: params }, (err, results) => {
            if (err) {
                res.status(400).send(err);
            } else {
                broadcast(req.body.uuid, {
                    "note.show_votes": req.body.show_votes
                })
                // io.to(req.body.uuid).emit("note.show_votes", req.body.show_votes);
                res.status(200).send(results)
            }
        })
    })


    api.post('/resetConnections', (req, res) => {
      let query = `
        MATCH (c:${req.body.label} {uuid: $connection})
        MATCH (j:Journey {uuid: $journey})-[cc:component_connector]->(c)
        DELETE cc
      `
      let params = req.body

      db.cypher({ query: query, params }, ( err, results ) => {
        console.log(err, results)
        res.status(200).send( results )

        broadcast(req.body.journey, {
          "note.connect": req.body
        })
      })
    })

    api.post('/connectNotes', (req, res) => {
      console.log('time to connect notes')
      let queries = [
        `
          MATCH (c) WHERE c.uuid = $connection
          MATCH (c)<-[cc:component_connection]-(:Note)
          DELETE cc
        `,
        `
          MATCH (c) WHERE c.uuid = $connection
          MATCH (n:Note) where n.uuid in $connections OR n.uuid in $notes

          MERGE (c)<-[r:component_connection]-(n)
            ON MATCH
              SET r.updated_at = timestamp()
            ON CREATE
              SET r.created_at = timestamp()
              SET r.connecter = $connecter

          RETURN properties(c), r, properties(n)
        `
      ]
      db.cypher({ queries, params: {
          ...req.body
        }
      },
      (err, results) => {
        if(err) {
          console.log(err)
          res.status(500).send(err)
        }
        else {
          broadcast(req.body.journey, {
            "note.connect": req.body
          })
          res.status(200).send(results[1])
        }
      })
    })

    api.post('/getConnections', (req, res) => {
      console.log(req.body)
      let query = `
        MATCH (c) WHERE c.uuid = $uuid
        MATCH (c)<-[:component_connection]-(n:Note)

        RETURN collect(n.uuid) as notes
      `
      db.cypher({ query: query, params: { uuid: req.body.note }}, ( err, results ) => {
        if(err) {
          console.error(err)
          res.status(500).send(err)
        }
        else {
          res.status(200).send({
            notes: (results[0].notes || []),
            connection: req.body.note
          })
        }
      })
    })

    api.post('/getMotConnections', (req, res) => {
      console.log(req.body)
      let query = `
        MATCH (mot:Mot{from_uuid: $uuid})<-[:mot_connection]-(n:Note)
        RETURN collect(n.uuid) as notes
      `
      db.cypher({ query: query, params: { uuid: req.body.note }}, ( err, results ) => {
        res.status(200).send({
          notes: (results[0].notes || []),
          mot: req.body.note
        })
      })
    })



    api.post('/mergeNotes', (req, res) => {
      const noteConnection = req.query.connection;

      let params = {
        ...req.body.notes
      }

      let query1 = `
        MATCH (merger:Person{uuid: $merger})
        MATCH (others:Note) WHERE others.uuid in $others

        OPTIONAL MATCH (others)<-[ovote:vote]-(:Person)
        OPTIONAL MATCH (others)<-[opain:pain]-(:Person)

        WITH others, {
          votes: sum(ovote.count),
          pains: sum(opain.count)
        } as other_votes

        MATCH (merger:Person{uuid: $merger})
        MATCH (primary:Note{uuid: $primary})

        MERGE (merger)-[ppain:pain]->(primary)
        ON MATCH  SET ppain.count = ppain.count + other_votes.pains
        ON CREATE SET ppain.count = other_votes.pains

        MERGE (merger)-[pvote:vote]->(primary)
        ON MATCH  SET pvote.count = pvote.count + other_votes.votes
        ON CREATE SET pvote.count = other_votes.votes

        WITH collect(distinct others) as others

        MATCH (merger:Person{uuid: $merger})
        MATCH (primary:Note{uuid: $primary})

        UNWIND others as other
        MATCH (other)-[:note_author]->(author:Person)

        OPTIONAL MATCH (other)<-[opain:pain]-(:Person)
        OPTIONAL MATCH (other)<-[ovote:vote]-(:Person)

        WITH coalesce(sum(ovote.count), 0) as votes_count,
             coalesce(sum(opain.count), 0) as pains_count,
             other, merger, primary, author

        MERGE (author)-[c:comment {
          uuid: other.uuid,
          votes_count: votes_count,
          pains_count: pains_count,
          comment: other.description,
          created_at: other.created_at,
          merged_in_at: timestamp(),
          merged_from_note: true,
          merger_by: merger.uuid
        }]->(primary)

        WITH other, primary

        MATCH (other)<-[comments:comment]-(cauthor:Person)
        WHERE NOT EXISTS(comments.merged_from_note)

        WITH collect(distinct comments) as comments, other, primary, cauthor

        UNWIND comments as comment

        MERGE (cauthor)-[c:comment {
          uuid: comment.uuid,
          comment: comment.comment,
          voc: comment.voc,
          created_at: comment.created_at,
          merged_in_at: timestamp()
        }]->(primary)
      `

      db.cypher({ query: query1, params }, (error, results) => {
        if(error) {
          console.log(error)
          return res.status(500).send(error)
        }

        let query2 = `
          MATCH (note:Note{uuid: $primary})
          MATCH (others:Note) WHERE others.uuid in $others

          detach delete others
          WITH note

          MATCH (note)-[:note_author]->(p:Person)
          MATCH (i:Interaction)<-[:note_interaction]-(note)-[:note_stage]->(s:Stage)
          MATCH (persona:Persona)<-[:note_persona]-(note)
          MATCH (ca:Person)-[c:comment]->(note)
          WITH note, note {
            .*,
            rels: {
              stage: s { .* },
              interaction: i { .* },
              persona: persona { .* },
              votes_count: 0,
              pains_count: 0,
              author: p { .email, .title, .firstname, .lastname, .image_url, .uuid },
              comments_count: SIZE((note)-[:comment]-()),
              comments: collect(distinct c {
                .*,
                author: {
                  uuid: ca.uuid,
                  firstname: ca.firstname,
                  image_url: ca.image_url
                }
              }),
              commenters: collect(distinct ca.uuid)
            }
          } as note_with_rels

          OPTIONAL MATCH (voter:Person)-[votes:vote|pain]->(note) WHERE votes.count > 0
          WITH note_with_rels, type(votes) as votes, sum(votes.count) as counts, collect(distinct voter.uuid) as voters
          WITH {
            type: votes,
            count: counts,
            voters: voters
          } as votes_with_rels, note_with_rels

          return note_with_rels, collect(votes_with_rels) as voting
        `

        db.cypher({ query: query2, params }, (error, results) => {
          if(error) {
            console.log(error)

            res.status(400).send(error)
          }
          else {
            let result = results[0];

            console.log(result)

            result.voting.forEach(vote => {
              if(vote && vote.type) {
                result.note_with_rels.rels[`${vote.type}s_count`] = vote.count;
                result.note_with_rels.rels[`user_${vote.type}`] = (vote.voters.indexOf(req.user.uuid) > -1 ? true : false);
              }
            })
            if( !noteConnection ) {
              result.note_with_rels.rels.interaction.order = req.body.interaction_orders[result.note_with_rels.rels.interaction.uuid]
            }
            result.note_with_rels.rels.commenter =
              (result.note_with_rels.rels.commenters.indexOf(req.user.uuid) > -1 ? true : false);

            Object.keys(result.note_with_rels).forEach((key) => {
              if(isJson(result.note_with_rels[key])) {
                result.note_with_rels[key] = JSON.parse(result.note_with_rels[key]);
              }
            })

            broadcast(req.body.journey, {
              "note.merge": {
                primary: result.note_with_rels,
                others: req.body.notes.others,
                connections: result.note_with_rels.connection
              }
            })
            res.status(200).send(result)
          }
        })
      })
	})


	api.post('/createNoteFromComment', (req, res) => {

	})

  api.post('/btl/:journeyUuid', (req, res) => {
    console.log(req.params.journeyUuid, req.body)

    let query = `
      MATCH (j:Journey {uuid: $journeyUuid})
      MATCH (c:${req.body.label} {uuid: $uuid})

      MERGE (j)-[cc:component_connector]->(c)
      SET cc.updated = timestamp()
      SET cc.author = $person
    `
    db.cypher({
      query,
      params: {
        journeyUuid: req.params.journeyUuid,
        ...req.body
      }
    }, (err, results) => {
      if(err) {
        console.log(err)
        res.status(500).send(err)
      }
      else {
        res.sendStatus(200)
      }
    })
  })

	// DANGER - THIS IS A MAINTENANCE/REPAIR ENDPOINT
	api.get('/:journey_uuid/clearallvotes', (req, res) => {
		db.cypher({
			query: `MATCH (j:Journey{uuid:'${req.params.journey_uuid}'})-[:note_journey]-(n:Note)-[votes:vote|pain]-(p:Person) delete votes`
		}, function(err, results){
			res.status(200).send(results)
		})
	});


  api.get('/note/mots/:from_uuid/:journey_uuid', (req, res) => {
    const personAttributes = (n) => {
      return `{
        uuid: ${n}.uuid, email: ${n}.email, image_url: ${n}.image_url, name: ${n}.firstname
      }`
    }
    db.cypher({
      query: `
        MATCH (mot:Mot{from_uuid: $from_uuid})
        OPTIONAL MATCH (pv:Person)-[values:values{uuid: $journey_uuid}]->(mot)
        OPTIONAL MATCH (pd:Person)-[mot_description:mot_description]->(mot) WHERE mot_description.text CONTAINS $journey_uuid
        OPTIONAL MATCH (ps:Person)-[mot_sts:mot_sts]->(mot) WHERE mot_sts.text CONTAINS $journey_uuid
        OPTIONAL MATCH (pl:Person)-[mot_lts:mot_lts]->(mot) WHERE mot_lts.text CONTAINS $journey_uuid

        WITH mot, pv, values, {
          description: collect(distinct mot_description{
            .*, person: ${personAttributes('pd')}
          }),
          sts: collect(distinct mot_sts{
            .*, person: ${personAttributes('ps')}
          }),
          lts: collect(distinct mot_lts{
            .*, person: ${personAttributes('pl')}
          })
        } as text_fields

        RETURN {
          inputs: collect(distinct pv {
            person: ${personAttributes('pv')},
            values: properties(values)
          }),
          text_fields: text_fields,
          averages: {
            mot_score:      round(avg(toFloat(values.mot_score))),
            mot_nitp:       round(avg(toFloat(values.mot_nitp))),
            mot_hdits:      round(avg(toFloat(values.mot_hdits))),
            mot_itb:        round(avg(toFloat(values.mot_itb))),
            mot_complexity: round(avg(toFloat(values.mot_complexity))),
            mot_effort:     round(avg(toFloat(values.mot_effort)))
          }
        } as values
      `,
      params: {
        from_uuid: req.params.from_uuid,
        journey_uuid: req.params.journey_uuid
      }
    },
    ( err, results ) => {
      if (err) {
        console.log(err)
        res.status(400).send(err)
      }
      else {
        let values = results[0].values;

        Object.keys(values.text_fields).forEach(key => {

          values.text_fields[key].forEach(obj => {
            let split = obj.text.split(' ||')

            if(split[1]) {
              if(split[1].includes(req.params.journey_uuid)) {
                obj.text = split[0]
              }
            }
            else { obj.text = split[0] }
          })
        })

        let meValues = values.inputs.find(input => {
          console.log(input)

          return input.person.uuid === req.user.uuid
        })

        // console.log(meValues)

        values.me = meValues ? meValues.values : {}

        res.status(200).send(values)
      }
    });
  })


	api.get('/note/:note_uuid/comments', (req, res) => {
		console.log('HIT THE ENDPOINT')
		db.cypher({
			query: `MATCH (n:Note{uuid:'${req.params.note_uuid}'})-[c:comment]-(p:Person) return n.uuid, p as author, c`
		}, function(err, results){
			results = results.map(function(result){
				delete result.author.properties.password;
				result.c.properties.author = result.author.properties;
				result.c.properties.note_uuid = result['n.uuid'];
				return result.c.properties;
			})
			res.status(200).send(results)
		})
	});


//////////////////////////////////////////////////////////////////////////////////////////






	//Journey Dashboard View Getters for 3 Role Views
	api.get("/attendee/:uuid", (req, res) => {
		let SubGraph = {};
		let GetLibrary = FullfillLibraryView(SubGraph, `MATCH (n:Journey)-[:journey_attendee]->(p:Person {uuid:'${req.params.uuid}'}) RETURN n`);
		GetLibrary.then(() => res.send(SubGraph));
		GetLibrary.catch((err) => res.status(500).send(err));
	});
	api.get("/admin/:uuid", (req, res) => {
		let SubGraph = {};
		let GetLibrary = FullfillLibraryView(SubGraph, `MATCH (n:Journey)-[:author|facilitator]->(p:Person {uuid:'${req.params.uuid}'}) RETURN n`);
		GetLibrary.then(() => res.send(SubGraph));
		GetLibrary.catch((err) => res.status(500).send(err));
	});
	api.get("/tenant/:uuid", (req, res) => {
		let SubGraph = {};
		let GetLibrary = FullfillLibraryView(SubGraph, `MATCH (n:Journey) RETURN n`);
		GetLibrary.then(() => res.send(SubGraph));
		GetLibrary.catch((err) => res.status(500).send(err));
	});

	//Library View Shared logic
	function FullfillLibraryView(SubGraph, query) {
		return new Promise(function (resolve, reject) {
			db.cypher({
				query: query
			}, function (err, results) {
				if (err || !results || results.length==0 || results[0]==null) {
					reject(err || {message:"No Journeys"});
				} else {
					results.map((result) => { GraphJS.MergeNode(result.n, SubGraph) });
					let Expand = ExpandLibraryCard(SubGraph, SubGraph.node_label_index.Journey);
					Expand.then(() => resolve(SubGraph));
					Expand.catch((err) => reject(err));
				}
			});
		})
	}

	function GetJourneyNotesSubGraph(SubGraph, note_uuid_array) {
		return new Promise(function (resolve, reject) {
			if (!note_uuid_array) { reject("note_uuid_array is missing"); } else {
				let Outgoing = GraphAPI.GetOutgoingRels(note_uuid_array, SubGraph, 'note_interaction|note_stage|note_author', db);
				Outgoing.then(() => {
					let Incoming = GraphAPI.GetIncomingRels(note_uuid_array, SubGraph, 'vote|vote2x|vote3x|pain|comment', db);
					Incoming.then(() => resolve());
					Incoming.catch(() => reject());
				});
				Outgoing.catch((error) => reject(error));
			}
		})

	};

	function GetJourneySubGraph(SubGraph, uuid , getListWithoutNotes) {
		return new Promise(function (resolve, reject) {
			let GetPivot = GraphAPI.AddRemoteNodeToSubgraph(uuid, SubGraph, db);
			GetPivot.then(() => {
				let Outgoing = GraphAPI.GetOutgoingRels([uuid], SubGraph, 'journey_strategy|journey_product|journey_persona|journey_interactions|journey_audiences|journey_stages|facilitator|journey_capability|journey_kpis', db);
				Outgoing.then(() => {
                    // this if condition is added as we dont want notes in API response on component click
                    if(getListWithoutNotes){
                        resolve();
                    }else{
                        let Incoming = GraphAPI.GetIncomingRels([uuid], SubGraph, 'note_journey', db);
                        Incoming.then(() => resolve());
                        Incoming.catch((error) => { reject(error); })
                    }

				});
				Outgoing.catch(() => reject());
			});
			GetPivot.catch(() => reject())
		})
	};

	function ExpandLibraryCard(SubGraph, journey_uuid_array) {
		return new Promise(function (resolve, reject) {
			let Outgoing = GraphAPI.GetOutgoingRels(journey_uuid_array, SubGraph, 'journey_attendee|author', db);
			Outgoing.then(() => {
				let Incoming = GraphAPI.GetIncomingRels(journey_uuid_array, SubGraph, 'note_journey', db);
				Incoming.then(() => resolve());
				Incoming.catch(() => reject());
			});
			Outgoing.catch(() => reject());
		})
	}


	//Returns a complete view of a Journey Workshop.
	api.get('/:journey_uuid', (req, res) => {
		var SubGraph = {};
		let GetJourney = GetJourneySubGraph(SubGraph, req.params.journey_uuid);
		GetJourney.then(() => {
			if (!SubGraph.node_label_index.Note) { res.send(SubGraph); } else {
				let ExpandJourneysNotes = GetJourneyNotesSubGraph(SubGraph, SubGraph.node_label_index.Note);
				ExpandJourneysNotes.then(() => res.send(SubGraph));
				ExpandJourneysNotes.catch((error) => res.status(500).send(error));
			}
		});
		GetJourney.catch((error) => res.status(500).send(error));
	});
	//Following function is added to change order of elements according to the order that we had saved
	function reOrder(SubGraph){
		for(var key in SubGraph.rels){
			if(SubGraph.rels[key].type == 'journey_interactions'){
				SubGraph.node_label_index.Interaction[SubGraph.rels[key].properties.order] = SubGraph.rels[key].to_id;
			}
			else if(SubGraph.rels[key].type == 'journey_stages'){
				SubGraph.node_label_index.Stage[SubGraph.rels[key].properties.order] = SubGraph.rels[key].to_id;
			}
		}
	}
	//Returns a Journey Centered SubGraph, filtered to only Direct Workshop Components
	api.get('/connections/:journey_uuid', (req, res) => {

		var SubGraph = {};
		GetJourneySubGraph(SubGraph, req.params.journey_uuid,req.query.getNodesWithouNotes).then(() => {
			reOrder(SubGraph);
			res.send(SubGraph);
		})
	});

	api.get('/connectionsNew/:journey_uuid', (req, res) => {
		let query = `
			MATCH all=(j:Journey{uuid:'${req.params.journey_uuid}'})-[r:journey_strategy|journey_product|journey_persona|journey_interactions|journey_audiences|journey_stages|journey_capability|journey_kpis]-(n)
			WITH n, labels(n)[0] as label
			RETURN label, collect(properties(n)) as nodes`
        db.cypher({ query: query }, (err, results) => {
            if (err) {
                res.sendStatus(400);
            } else {
                res.status(200).send(results);
            }
        })
    });
    // get all nodes including connections
    api.get('/connector/:journey_uuid', (req, res) => {
        let query = `
			MATCH all=(j:Journey{uuid:'${req.params.journey_uuid}'})-[r:facilitator|journey_strategy|journey_product|journey_persona|journey_interactions|journey_audiences|journey_stages|journey_capability|journey_kpis]-(connected)
			WITH {
			  label: labels(connected)[0],
			  nodes: collect(distinct properties(connected))
			} as connected

			MATCH (n)
			WHERE n:Audience OR n:Capability OR n:Interaction OR n:Person OR n:Persona OR n:Product OR n:Stage OR n:Strategy

			RETURN {
			  connected: connected,
			  all: {
					label: labels(n)[0],
					nodes: collect(distinct properties(n))
				}
			} as results`
        db.cypher({ query: query }, (err, results) => {
            if (err) {
                res.sendStatus(400);
            } else {
                res.status(200).send(results);
            }
        })
    });


    //Returns only the People invited to a Journey Workshop
    api.get('/invitees/:journey_uuid', (req, res) => {
        var SubGraph = {};
        // convert string to boolean
        req.query.external = req.query.external == 'true';

        // check if external attendee
        let relationship = (req.query.external ? 'journey_external_attendee' : 'journey_attendee');

        let GetPivot = GraphAPI.AddRemoteNodeToSubgraph(req.params.journey_uuid, SubGraph, db);
        GetPivot.then(() => {
            let Outgoing = GraphAPI.GetOutgoingRelsCase([req.params.journey_uuid], SubGraph, relationship, db,req.query);

            Outgoing.then(() => {
             res.send(SubGraph); });
            Outgoing.catch((err) => { res.status(500).send(err); })
        });
        GetPivot.catch((err) => { res.status(500).send(err); })
    });

    //computes differences in initial/revised states, generates Cypher Statements, executes Cypher Statements
    api.post('/connections', (req, res) => {
        let journey_uuid = req.body.initial.nodes[req.body.initial.node_label_index.Journey[0]].properties.uuid

        //Compute Differences
        var Difference = GraphJS.Differences(req.body.initial, req.body.revised)
        let Statements = { Missing_Rels: [], Extra_Rels: [], Updated: [] };

        //Creates Cypher Statements for New/Deleted Relationships
        ["Extra", "Missing"].forEach((state) => {
            JourneyWorkshopComponents.forEach((it) => {
                if (Difference[state].node_label_index[it.label] && req.body.revised.incoming[it.type]) {
                    Difference[state].node_label_index[it.label].forEach((node_id) => {
                       // console.log(req.body[(state == "Extra") ? "revised" : "initial"]);
                        console.log("type "+it.type);
                        console.log("id "+node_id+" state is "+state);
                        console.log("check " + req.body[(state == "Extra") ? "revised" : "initial"].incoming[it.type][node_id]);
                        req.body[(state == "Extra") ? "revised" : "initial"].incoming[it.type][node_id].forEach((rel_id) => {
                            let rel = Difference[state].rels[rel_id];

                            let query = (state == "Extra") ?
                                `MATCH (j:Journey {uuid:'${(rel.from_id || journey_uuid)}'}), (o {uuid:'${rel.to_id}'}) CREATE (j)-[e:${rel.type} {uuid:'${rel.properties.uuid}', order:${rel.properties.order || 0}, created_at:${new Date().getTime()}}]->(o)`
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
            if (err) res.status(400).send({ message: err });
            res.send(Statements);
        });
    })

    api.put('/noteprogressupdate', (req, res) => {
      let note =   req.body.note
      // console.log(req.body)
      let query =  `MATCH (n:Note {uuid:'${note.uuid}' }) SET n.progress = '${note.progress}', n.projectUUID = '${note.projectUUID}' , n.projectName = '${note.projectName}', n.history = '${JSON.stringify(note.history)}' , n.projectAssignee = '${JSON.stringify(note.projectAssignee)}' RETURN n`
      db.cypher({ query: query }, (err, result) => {
        if (err) res.status(500).send({ message: err });
			  res.send(result);
      });
    });

    api.post('/note', (req, res) => {
      req.body.note = { properties: req.body.note }
      // console.log(req.body)
      let validator_errors = Validators.Note(req.body.note);
      // console.log(validator_errors)
      if (validator_errors) { res.status(400).send(validator_errors); return }
      // let createDate = new Date().getTime();
      if(req.body.note.properties.connection){
        db.cypher({
          query: `
            MATCH (author:Person {uuid:{author_uuid}}) WITH collect(author)[0] as a
            MATCH (j:Journey {uuid: {journey_uuid} })
            CREATE (n:Note {uuid:{uuid}, description:{description}, image_url:{image_url}, external_url:{external_url}, external:{external}, created_at:{created_at}, updated_at:{created_at} , connection:{connection} , component_type : {component_type} , component_uuid : {component_uuid} })
            MERGE (n)-[:note_author {uuid: {author_rel_uuid}}]->(a)
            MERGE (n)-[:note_journey {uuid: {journey_rel_uuid}}]->(j)
            RETURN n
          `,
          params: {
            //Note Params
            uuid: uuidv1(),
            description: req.body.note.properties.description,
            image_url: req.body.note.properties.image_url,
            external_url: req.body.note.properties.external_url,
            external: req.body.note.properties.external,
            connection:req.body.note.properties.connection,
            component_type: req.body.note.properties.component_type,
            component_uuid: req.body.note.properties.component_uuid,
            created_at: new Date().getTime(),
            //neighbors
            journey_uuid: req.body.journey_id,
            author_uuid: req.body.author_id,
            //New rel ids
            journey_rel_uuid: uuidv1(),
            author_rel_uuid: uuidv1()
          }
        },
        ( err, results ) => {
          if (err) {
            res.status(400).send(err)
          }
          else {
            let response = results[0].n.properties;
            response.rels = {};
            response.rels.author = req.user;

            broadcast(req.body.journey_id, {
              "post.connection": response
            })
            res.sendStatus(200)
          }
        });
      }
      else {
        for (let stage_uuid of req.body.stage_ids) {
          for (let persona_uuid of req.body.persona_ids) {
            db.cypher({
              query: `
              MATCH (author:Person {uuid:{author_uuid}}) WITH collect(author)[0] as a
              MATCH (j:Journey {uuid: {journey_uuid} }), (s:Stage {uuid:{stage_uuid}}), (i:Interaction {uuid:{interaction_uuid}}), (p:Persona {uuid:{persona_uuid}})
              CREATE (n:Note {uuid:{uuid}, description:{description}, image_url:{image_url}, external_url:{external_url}, external:{external}, created_at:{created_at}, updated_at:{created_at} })
              CREATE (n)-[:note_author {uuid : {author_rel_uuid}}]->(a)
              CREATE (n)-[:note_journey {uuid : {journey_rel_uuid}}]->(j)
              CREATE (n)-[:note_stage {uuid : {stage_rel_uuid}}]->(s)
              CREATE (n)-[:note_persona {uuid : {persona_rel_uuid}}]->(p)
              CREATE (n)-[:note_interaction {uuid : {interaction_rel_uuid}}]->(i)
              RETURN n, s, i, p
              `,
              params: {
                //Note Params
                uuid: uuidv1(),
                description: req.body.note.properties.description,
                image_url: req.body.note.properties.image_url,
                external_url: req.body.note.properties.external_url,
                external: req.body.note.properties.external,
                created_at: new Date().getTime(),
                //neighbors
                journey_uuid: req.body.journey_id,
                stage_uuid: stage_uuid,
                persona_uuid: persona_uuid,
                interaction_uuid: req.body.interaction_id,
                author_uuid: req.body.author_id,
                //New rel ids
                stage_rel_uuid: uuidv1(),
                persona_rel_uuid: uuidv1(),
                interaction_rel_uuid: uuidv1(),
                journey_rel_uuid: uuidv1(),
                author_rel_uuid: uuidv1()
              }
            },
            ( err, results ) => {
              if (err) {
                res.status(400).send(err)
              }
              else {
                let response = results[0].n.properties;
                response.rels = {};
                response.rels.interaction = results[0].i.properties;
                response.rels.persona = results[0].p.properties;
                response.rels.stage = results[0].s.properties;
                response.rels.author = req.user;

                broadcast(req.body.journey_id, {
                  "post.note": response
                })
                res.sendStatus(200)
              }
            });
          }
        }
      }
    });

    api.get('/note/:note_uuid', (req, res) => {
      let query = `
        MATCH (n:Note{uuid: $note_uuid})
        return n {
          .*,
          rels: {}
        } as note
      `
      db.cypher({ query, params: {...req.params }}, (err, results) => {
  			if(err) {
          console.log(err)
          res.status(400).send(err);
        }

        console.log(results)

  			res.status(200).send(results[0].note)
  		})
    })

    //Updates a notes components, and properties
    api.put('/note', (req, res) => {
        let params = {}

        let query = `MATCH (n:Note{uuid:'${req.body.note.uuid}'}) `

        req.body.note.searchable = []

        if(req.body.note.mot)  req.body.note.searchable.push('#mot')
        if(req.body.note.mot_solution) req.body.note.searchable.push('#mots')

        if (req.body.note.primary_kpi) {
            query += `
			  MATCH (pk:Kpi{uuid:'${req.body.note.primary_kpi}'})
				OPTIONAL MATCH (n)-[pkr:note_kpi]-(pko:Kpi)
				WHERE n.primary_kpi = pko.uuid
				DETACH DELETE pkr
				WITH n, pk
			  MERGE (n)-[:note_kpi]->(pk) WITH n `
        }
        if (req.body.note.secondary_kpi) {
            query += `
			  MATCH (sk:Kpi{uuid:'${req.body.note.secondary_kpi}'})
				OPTIONAL MATCH (n)-[skr:note_kpi]-(sko:Kpi)
				WHERE n.secondary_kpi = sko.uuid
				DETACH DELETE skr
				WITH n, sk
			  MERGE (n)-[:note_kpi]-(sk) WITH n `
		}

    // note properties
		let whitelist = ["description", "image_url", "drawing_url", "external_url", "touch_point_icon", "video_url",
		"sample_size", "number_of_interview", "average_importance", "average_effectiveness",
		"gap", "stated_importance", "derived_importance", "kano_quadrant", "mot", "mot_solution", "mot_archive", "external",
		"cxi_priority", "qual_date", "quant_date", "order_in_sequence", "primary_kpi", "secondary_kpi", "trend",
		"correlation", "correlation_a", "correlation_b", "correlation_c", "correlation_d", "correlation_e", "correlation_f" , "connection","component_type", "component_uuid", "projectUUID",
    "competitive_differentiation", "economic_value", "profit_margin_growth", "timing_term", "timing_duration", "threat_response", "strategic_positioning",
    "bottleneck_dependency", "risk", "value_add", "investment_level", "resource_constraints", "complexity", "competitive_advantage",
    "technology_maturity", "h1", "h2", "h3", "searchable"]

    // set new value for any of these given properties
		whitelist.forEach(function(prop){
			if(Object.keys(req.body.note).indexOf(prop) > -1){
				if(req.body.note[prop] && typeof(req.body.note[prop]) === 'object') {
					params[prop] = JSON.stringify(req.body.note[prop]);
				} else {
					params[prop] = req.body.note[prop];
				}
				query += `SET n.${prop} = {${prop}} `
			}
		})
		let updatedAt = new Date().getTime();
		query += `SET n.updated_at = ${updatedAt} `

		// let relationalQuery = `MATCH (n:Note{uuid:'${req.body.note.uuid}'}) `
		let relationships = [{
			label: 'Stage',
			prop: 'stage'
		}, {
			label: 'Interaction',
			prop: 'interaction'
		}, {
			label: 'Persona',
			prop: 'persona'
		}]
		relationships.forEach(function(obj, idx){
			if(req.body.note.rels[obj.prop]){
				query += `
          WITH n MATCH (n)-[r${idx}:note_${obj.prop}]-(n${idx}:${obj.label}),
                       (nn${idx}:${obj.label}{uuid:'${req.body.note.rels[obj.prop].uuid}'})
				  CREATE (n)-[r${idx+1}:note_${obj.prop}]->(nn${idx})
          SET r${idx+1}=r${idx}
          DELETE r${idx} `
			}
		})

    if(req.body.note.mot_connection) {
      req.body.note.mot_connection.forEach((connection, ci) => {
        query += `
          WITH n
          MATCH (mot_connection${ci}:Mot{from_uuid: '${connection.uuid}'})
          MERGE (n)-[:mot_connection]->(mot_connection${ci})
        `
      })
    }

    let mot_fields = [
      "mot_score",
      "mot_nitp",
      "mot_hdits",
      "mot_itb",
      "mot_complexity",
      "mot_effort"
    ]

    let text_fields = [
      "mot_description",
      "mot_lts",
      "mot_sts",
    ]

    if(req.body.note.mot_archive) {
      query += `
        WITH n
        MATCH (mot:Mot{from_uuid: n.uuid})
        SET mot.archive = true
      `
    }
    else if(req.body.note.mot){
      query += `
        WITH n
        MATCH (p:Person{uuid:'${req.user.uuid}'})

        MERGE (mot:Mot{from_uuid: n.uuid})
        ON CREATE SET
          mot.title = n.description,
          mot.description = n.description,
          mot.created_at = timestamp(),
          mot.updated_at = timestamp(),
          mot.uuid = randomUUID(),
          mot.solution = ${!!req.body.note.mot_solution},
          mot.beingCreated = true
        ON MATCH SET
          mot.solution = ${!!req.body.note.mot_solution},
          mot.title = n.description,
          mot.description = n.description,
          mot.archive = false

        FOREACH(ifthen in mot.beingCreated |
          MERGE (p)-[:author]->(mot)
          REMOVE mot.beingCreated
        )
        MERGE (p)-[v:values]->(mot)

        SET v.journey_uuid = '${req.body.journey}'

        WITH mot, v, n, p
      `
      mot_fields.forEach((prop, idx) => {
        if(req.body.note[prop]) {
          query += `
            SET v.${prop} = ${req.body.note[prop]}
            SET v.updated_at = timestamp()`
        }
      })

      text_fields.forEach((prop, idx) => {
        if(req.body.note[prop]) {
          query += `
            MERGE (p)-[t${idx}:${prop}{text: '${req.body.note[prop]} || ${req.body.journey}', created_at: timestamp()}]->(mot)`
        }
      })
    }

		query += ` RETURN n `

		db.cypher({query: query, params: params}, function(err, results){
			if(err) {
        console.log(err)
        res.status(400).send(err);
      }
			delete req.body.note.user_vote;
			delete req.body.note.user_pain;
			broadcast(req.headers.journey, {
				"update.note": req.body.note
			})
			// io.to(req.headers.journey).emit('update.note', req.body.note)
			res.status(200).send(req.body.note)
		})
	})

	api.post('/note/vote', (req, res) => {
		let rel   = req.body.str;
		let direction = req.body.direction

    let query = `
      MATCH (p:Person{uuid:'${req.user.uuid}'}), (n:Note{uuid:'${req.body.uuid}'})
      MERGE (p)-[r:${rel}]->(n)
      ${direction === 'up' ? `
        ON MATCH
          SET r.count = r.count + 1
        ON CREATE
          SET r.count = 1
      `
      : ''}
      ${direction === 'down' ? `
        ON MATCH
          SET r.count = r.count - 1
        ON CREATE
          SET r.count = 0
      `
      : ''}
      WITH n, r
      MATCH (n)-[v:${rel}]-(:Person)
      WITH sum(v.count) as ${rel}s, r
      RETURN ${rel}s, r.count
    `
    db.cypher({ query }, ( err, results ) => {
      if( err ) {
        res.status(400).send(err);
      }
      else {
        let data = {
          note: req.body.uuid,
          count: results[0][`${rel}s`]
        }
        if(!req.body.nobroadcast) {
          let broadcastPayload = {};
          broadcastPayload[`note.${rel}s`] = data;

          broadcast(req.headers.journey, broadcastPayload)
        }

        res.status(200).send(data)
      }
    })
  });


    api.delete('/note/:note_uuid/comment/:comment_uuid', (req, res) => {
        let query = `
			MATCH (n:Note{uuid:'${req.params.note_uuid}'})<-[c:comment{uuid:'${req.params.comment_uuid}'}]-(p:Person)
			DETACH DELETE c
			WITH (n)
			MATCH (n)-[c:comment]-()
			RETURN count(c) as comment_count
		`;
        db.cypher({ query: query }, (err, results) => {
            if (err) {
                res.sendStatus(400)
            } else {
                broadcast(req.headers.journey, {
                    "delete.comment": {
                        author: req.user,
                        note: req.params.note_uuid,
                        comment: req.params.comment_uuid,
                        count: results[0].comment_count
                    }
                })
                res.sendStatus(200);
            }
        })
    })

    api.post('/note/:note_uuid/comment/:comment_uuid', (req, res) => {
      console.log('THE BODY',req.body)
        let query = `
    			MATCH (n:Note{uuid:'${req.params.note_uuid}'})<-[c:comment{uuid:'${req.params.comment_uuid}'}]-(p:Person)
    			SET c.comment = '${req.body.comment}'
    		`;
        db.cypher({ query: query }, (err, results) => {
            if (err) {
                res.sendStatus(400)
            } else {
                broadcast(req.headers.journey, {
                    "update.comment": {
                        author: req.user,
                        note: req.params.note_uuid,
                        comment: req.params.comment_uuid,
                        commentText: req.body.comment
                    }
                })
                res.sendStatus(200);
            }
        })
    })

    api.post('/attendee/removelocal/:uuid', (req, res) => {
      let params = {
        emails: req.body.removeFromLocalData,
        uuid: req.params.uuid
      }
      let query = `UNWIND {emails} AS email
Match(j:Journey{uuid:{uuid}})-[jr:journey_attendee]-(p:Person{email:email}) DELETE jr`

      db.cypher({ query: query, params: params }, function(err, results) {
        if(err) {
          res.status(400).send(err)
        }
        else {

          res.status(200).send('ok computer');
        }
      });

    });
    api.post('/note/comment', (req, res) => {
      // req.body.properties.comment = req.body.properties.comment.replace(/"/g, '\\"');
      let createDate = new Date().getTime();
      let params = {
          from_id: req.body.from_id,
          to_id: req.body.to_id,
          comment: req.body.properties.comment,
          voc: req.body.properties.voc,
          task: req.body.properties.task,
          rank: (req.body.properties.rank || 0),
          uuid: req.body.properties.uuid,
          pmo : (req.body.properties.pmo || false),
          createDate: createDate
      }
      if(req.body.properties.pmo){
        params.pmo = req.body.properties.pmo
      }
      let query = `
        MATCH (u:Person{uuid: {from_id}})
        MATCH (n:Note{uuid: {to_id}})
        CREATE (u)-[e:comment {uuid: {uuid}, comment: {comment}, voc: {voc}, pmo : {pmo} , task: {task}, rank: {rank}, created_at: {createDate}}]->(n)
        WITH u, e, n
        MATCH (n)-[c:comment]-()
        RETURN e {
          .*,
          note: n.uuid,
          author: u {
            .email,
            .firstname,
            .lastname,
            .image_url,
            .created_at,
            .uuid
          },
          count: count(c)
        } as new_comment`;

      db.cypher({ query: query, params: params }, function(err, results) {
        if(err) {
          console.log(results[0])
          res.status(400).send(err)
        }
        else {
          broadcast(req.headers.journey, {
            "post.comment": results[0].new_comment
          })
          res.status(200).send('comment');
        }
      });
    });

    api.delete('/note/vote/:uuid', (req, res) => {
        let query = `MATCH ()-[e {uuid:'${req.params.uuid}'}]->(n) DELETE e RETURN n`;
        db.cypher({ query }, function(err, results) {
            if (err) res.status(400).send(err);
            let SubGraph = { nodes: {}, rels: {} }
            SubGraph.rels[req.params.uuid] = { properties: { uuid: req.params.uuid } };
            broadcast(req.headers.journey, {
                "delete.vote": { uuid: req.params.uuid }
            })
            // io.to(req.headers.journey).emit("delete.vote", {uuid: req.params.uuid});
            res.status(200).send({ uuid: req.params.uuid });
        });
    });

    api.delete('/note/:uuid', (req, res) => {
        let query = `
          MATCH (n:Note {uuid:"${req.params.uuid}"})
          WITH n, properties(n) as note
          DETACH DELETE n
          RETURN note
        `;
        db.cypher({ query }, function(err, results) {
            if (err) {
              res.status(400).send(err);
            }
            else {
              let deletedNote = results[0].note;

              broadcast(req.headers.journey, {
                  "delete.note": {
                    uuid: req.params.uuid,
                    stage: req.headers.stage,
                    connection: deletedNote.connection
                  }
              })

              res.status(200).send({ uuid: req.params.uuid });
            }
        });
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
            "type": "journey_external_attendee"
        }, {
            "label": "Person",
            "type": "facilitator"
        }, {
            "label": "Capability",
            "type": "journey_capability"
        }, {
            "label": "Kpi",
            "type": "journey_kpis"
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
