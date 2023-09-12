'use strict';

import { Router } from 'express';

export default ({ config, db, broadcast }) => {

  let api = Router();

  api.post('/clicks', (req, res) => {
    let tag  = req.body.params.tag;

    let query = `
      MATCH (n{uuid: {node_uuid}})
      MATCH (p:Person{uuid: {user_uuid}})

      MERGE (n)-[:node_activity]->(a:Activity)
      SET a.view_count =
        CASE
          WHEN a.view_count IS NULL
          THEN 1
          ELSE a.view_count + 1
          END
      SET a.${tag} =
        CASE
          WHEN a.${tag} IS NULL
          THEN 1
          ELSE a.${tag} + 1
          END

      MERGE (a)-[:activity_element]->(e:Element{tag: {tag}})
      SET e.view_count =
        CASE
          WHEN e.view_count IS NULL
          THEN 1
          ELSE e.view_count + 1
          END

      CREATE (action:Action{
        timestamp: {timestamp},
        track_id: {track_id},
        from_path: {from_path},
        to_path: {to_path},
        rels: {rels}
      })-[:action_element]->(e)

      MERGE (a)-[:activity_location]->(l:Location{ip: {ip}})
      SET l.coordinates = {coordinates}
      SET l.timestamp = {timestamp}

      MERGE (a)-[:activity_person]->(p)
      MERGE (p)-[:person_action]->(action)
      MERGE (e)-[:element_location]->(l)
      MERGE (p)-[:person_location]->(l)
    `

    db.cypher({
      query: query,
      params: req.body.params
    }, ( err, results ) => {
      if( err ) {
        console.log(err)
        res.status( 400 ).send( err )
      }
      else {
        res.status( 200 ).send( results )
      }
    })

  })


  return api;

}
