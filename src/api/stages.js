import { Router } from 'express';

export default ({ config, db, broadcast }) => {
  let api = Router();

  api.post('/set_workshop_stage_details', (req, res) => {
    let params = {
      suuid: req.body.stage,
      juuid: req.body.journey,
      description: req.body.description,
      image: req.body.image,
      text: req.body.text,
      score: req.body.score,
      whiteboard: req.body.whiteboard
    }
    let query = `
      MATCH (s:Stage{uuid:{suuid}})<-[r:journey_stages]-(j:Journey{uuid:{juuid}})
      SET r.description = {description}
      SET r.static_image_ref = {image}
      SET r.static_text = {text}
      SET r.sentiment_score = {score}
      SET r.whiteboard = {whiteboard}
      RETURN r.stage as stage`
    db.cypher({ query: query, params: params}, (err, results) => {
      if(err) {
        res.status(404).send('error querying database')
      } else {
        results = (results ? results[0] : false);
        if(results) {
          results.stage_uuid = req.body.stage;
          results.static_image_ref = req.body.image
          results.static_text = req.body.text
          results.description = req.body.description
          results.score = req.body.score
          results.whiteboard = req.body.whiteboard
          broadcast(req.body.journey, {
  					"stage.workshop_details": results
  				})
          res.status(200).send(results)
        }
      }
    })
  })

  api.get('/descriptions/:uuid', (req, res) => {
    let params = {
      stage: req.params.uuid,
    }
    let query = `
      MATCH (s:Stage{uuid:{stage}})<-[r:journey_stages]-(j:Journey)
      WHERE r.description IS NOT NULL
      WITH {
        journey: j.title,
        description: r.description
      } as result
      RETURN collect(result) as results`

    db.cypher({ query: query, params: params }, (err, results) => {
      if(err) {
        console.error(err)
        res.status(400).send('error getting descriptions')
      } else {
        console.log(results)
        res.status(200).send(results[0] ? results[0].results : [])
      }
    })
  })

  return api;
}
