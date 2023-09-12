import { Router } from 'express';
const multiparty = require('connect-multiparty');
const multipartyMiddleware = multiparty();
const xss = require("xss");
const fs = require('fs');
const { createClient } = require("webdav");

// const Azure = require('../lib/azure');
let webdav;

if (process.env.webdav) {
    webdav = true;
}

const webdavaccess = {
  webdavserver: 'https://cloud.ruptive.cx/remote.php/dav/files/bestindefense/',
  webdavusername: 'bestindefense',
  webdavpassword: '!bestindefense!'
}

export default ({ config, db, broadcast }) => {
  let api = Router();

  var client = createClient(
    webdavaccess.webdavserver,
    {
      username: webdavaccess.webdavusername,
      password: webdavaccess.webdavpassword
    }
  )

  const upload = (req, res) => {
    return fs.readFile(req.files.file.path, (err, data) => {
      let dir = `/journeys/${req.body.journey}/${req.body.note}`;

      client.createDirectory(`/journeys/${req.body.journey}`)
      .catch(() => {})
      .finally(() => {
        client.createDirectory(`/journeys/${req.body.journey}/${req.body.note}`)
        .catch(() => {})
        .finally(() => {
          client.putFileContents(
            `${dir}/${Date.now()}_${req.files.file.name}`,
            data,
            {
              onUploadProgress: progress => {
                console.log(`Uploaded ${progress.loaded} bytes of ${progress.total}`);
              }
            }
          ).then(() => {
            console.log('done uploading')
            return res.status(200).send('done')
          })
          .catch(error => {
            console.log(error.response)
            return res.status(500).send(error.response)
          })
        })
        .catch(error => {
          console.log(error.response)
          return res.status(500).send(error.response)
        })
      })
    });
  }

  api.post('/file', multipartyMiddleware, upload)

  return api;
}
