import { Router } from 'express';

const xss = require("xss");

const fs = require('fs');

// const Azure = require('../lib/azure');

const ImageKit = require("imagekit");

export default ({ config, db, broadcast }) => {
  let api = Router();

  api.post('/upload', (req, res) => {
    
    const imagekit = new ImageKit({
      publicKey:   "public_SFl3jDcVhbQORQSOwx8dHFFJsTU=",
      privateKey:  "private_vwkG8Nbvaj4FyQaxH6RwUEdFtjw=",
      urlEndpoint: "https://ik.imagekit.io/ruptive/"
    });

    imagekit.upload({
      file: xss(req.body.imagedata),
      fileName: xss(`${req.body.whiteboardId}_${Date.now()}.png`),
    })
    .then(response => {
      console.log(response)
      res.status(200).send(response)
    })
    .catch(error => {
      console.log(error)
      res.status(500).send({ message: 'error uploading image '})
    });
  })


  api.post('/whiteboard/load', (req, res) => {

    fs.readFile(`whiteboards/${req.body.channel}`, (err, data) => {
      if(err) {
        console.log(err)

        res.status(200).send([])
      }
      else {
        if(data) {
          if(IsJsonString(data)) {
            data = JSON.parse(data)
          }
        } else {
          data = []
        }
        res.status(200).send(data)
      }
    });

    // if(req.body.channel) {
    //   let nodes = req.body.channel.split('_')
    //
    //   let query = `
    //     MATCH (j:Journey{uuid: $journey}), (s:Stage{uuid: $stage})
    //     MATCH (j)-[:has_whiteboard]->(w:Whiteboard)<-[:has_whiteboard]-(s)
    //     RETURN properties(w) as whiteboard
    //   `
    //   db.cypher({
    //     query: query,
    //     params: {
    //       journey: nodes[0],
    //       stage:   nodes[1]
    //     }
    //   },
    //   (error, results) => {
    //     if (error) {
    //       console.log(error)
    //       res.status(500).send(error)
    //     }
    //     else {
    //       if(results[0] && results[0].whiteboard) {
    //         let whiteboard = results[0].whiteboard
    //
    //         // whiteboard.data = JSON.parse(whiteboard.data)
    //
    //         res.status(200).send(whiteboard)
    //       }
    //     }
    //   });
    // }
    // else {
    //   res.sendStatus(500)
    // }
  })

  api.post('/whiteboard/save', (req, res) => {
    let subdomain = req.subdomains[0] || 'test'

    let data = JSON.stringify(req.body.imageJSON, null, 2);

    // containerName


    // s3.upload({
    //   Bucket: 'ruptive-whiteboards',
    //   Key: `${subdomain}/${Date.now()}.json`,
    //   Body: data
    // },
    // (err, data) => {
    //   if(err) {
    //     res.sendStatus(500)
    //   }
    //   else {
    //     res.sendStatus(200)
    //   }
    //   console.log(err);
    // });

    fs.writeFile(`whiteboards/${req.body.channel}`, data, (err) => {
      if(err) {
        res.sendStatus(500)
      }
      else {
        res.sendStatus(200)
      }
    });


    // if(req.body.channel && req.body.imageJSON) {
    //   let nodes = req.body.channel.split('_')
    //
    //   let query = `
    //     MATCH (j:Journey{uuid: $journey}), (s:Stage{uuid: $stage})
    //     MERGE (j)-[:has_whiteboard]->(w:Whiteboard)<-[:has_whiteboard]-(s)
    //     SET w.updated_at = $updated
    //     SET w.data = $data
    //
    //     RETURN properties(w) as whiteboard
    //   `
    //
    //   db.cypher({
    //     query: query,
    //     params: {
    //       journey: nodes[0],
    //       stage:   nodes[1],
    //       updated: Date.now(),
    //       data:    JSON.stringify(req.body.imageJSON)
    //     }
    //   },
    //   (error, results) => {
    //     if (error) {
    //       res.status(500).send(error)
    //     }
    //     else {
    //       res.status(200).send(results[0])
    //     }
    //   });
    // }
    // else {
    //   res.sendStatus(500)
    // }
  })

  return api;
}


function IsJsonString(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}
